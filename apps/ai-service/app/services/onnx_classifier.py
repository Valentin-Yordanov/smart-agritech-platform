"""MobileNetV4 ONNX Plant Disease Classifier Service.

Provides optimized CPU inference, ImageNet normalization, numerically stable softmax,
and Top-K extraction with comprehensive agronomic metadata enrichment.
"""

import json
from pathlib import Path
import time
from typing import Any, Dict, List, Optional

import cv2
import numpy as np
import onnxruntime as ort

from app.core.config import Settings, get_settings
from app.core.logger import logger
from app.schemas.classification import ClassificationResult, TopKPrediction


class MobileNetV4Classifier:
    """Production-grade ONNX Runtime wrapper for MobileNetV4 plant disease classification."""

    def __init__(
        self,
        model_path: Optional[Path] = None,
        classes_path: Optional[Path] = None,
        settings: Optional[Settings] = None,
    ) -> None:
        self.settings = settings or get_settings()
        self.model_path = model_path or self.settings.CLASSIFIER_MODEL_PATH
        self.classes_path = classes_path or self.settings.CLASSES_JSON_PATH

        self.classes_metadata: Dict[int, Dict[str, Any]] = self._load_classes()
        self.session: ort.InferenceSession = self._init_session()

        inputs = self.session.get_inputs()
        outputs = self.session.get_outputs()
        self.input_name: str = inputs[0].name
        self.output_name: str = outputs[0].name
        self.input_size: int = self.settings.CLASSIFIER_INPUT_SIZE

        # Precompute ImageNet mean and std as float32 arrays
        self.mean = np.array(self.settings.IMAGE_NET_MEAN, dtype=np.float32).reshape(1, 1, 3)
        self.std = np.array(self.settings.IMAGE_NET_STD, dtype=np.float32).reshape(1, 1, 3)

        logger.info(
            f"Initialized MobileNetV4Classifier: model={self.model_path.name}, "
            f"input='{self.input_name}', output='{self.output_name}', "
            f"classes={len(self.classes_metadata)}"
        )

    def _load_classes(self) -> Dict[int, Dict[str, Any]]:
        """Loads classification class metadata from classes.json."""
        if not self.classes_path.exists():
            logger.warning(f"Classes JSON not found at {self.classes_path}. Using fallback.")
            return {
                0: {"class_name": "Tomato___Early_blight", "species": "Tomato", "disease": "Early Blight", "is_healthy": False, "severity": "Moderate"},
                1: {"class_name": "Tomato___healthy", "species": "Tomato", "disease": "None", "is_healthy": True, "severity": "None"},
            }

        try:
            with open(self.classes_path, "r", encoding="utf-8") as f:
                data = json.load(f)
                items = data.get("classification_classes", [])
                result: Dict[int, Dict[str, Any]] = {}
                for idx, item in enumerate(items):
                    cid = item.get("id", idx)
                    result[cid] = item
                return result
        except Exception as exc:
            logger.error(f"Failed to load classification metadata: {exc}")
            return {0: {"class_name": "Plant___Healthy", "species": "Plant", "disease": "None", "is_healthy": True}}

    def _init_session(self) -> ort.InferenceSession:
        """Initializes ONNX Runtime session with tuned CPU threading and graph rewrites."""
        opts = ort.SessionOptions()
        opts.intra_op_num_threads = self.settings.ONNX_INTRA_OP_NUM_THREADS
        opts.inter_op_num_threads = self.settings.ONNX_INTER_OP_NUM_THREADS

        if self.settings.ONNX_EXECUTION_MODE == "ORT_SEQUENTIAL":
            opts.execution_mode = ort.ExecutionMode.ORT_SEQUENTIAL
        else:
            opts.execution_mode = ort.ExecutionMode.ORT_PARALLEL

        opts.graph_optimization_level = ort.GraphOptimizationLevel.ORT_ENABLE_ALL

        session = ort.InferenceSession(
            str(self.model_path),
            sess_options=opts,
            providers=["CPUExecutionProvider"],
        )
        return session

    def warmup(self) -> None:
        """Priming inference pass to initialize memory pools and thread schedulers."""
        dummy_input = np.zeros((1, 3, self.input_size, self.input_size), dtype=np.float32)
        _ = self.session.run([self.output_name], {self.input_name: dummy_input})
        logger.info("MobileNetV4Classifier warm-up completed.")

    def preprocess(self, image_bgr: np.ndarray) -> np.ndarray:
        """Resizes, converts to RGB, applies ImageNet normalization, and formats CHW."""
        # High quality bilinear resize
        resized = cv2.resize(
            image_bgr,
            (self.input_size, self.input_size),
            interpolation=cv2.INTER_LINEAR,
        )
        # Convert BGR to RGB
        rgb = cv2.cvtColor(resized, cv2.COLOR_BGR2RGB).astype(np.float32) / 255.0
        # Standardize using ImageNet statistics
        normalized = (rgb - self.mean) / self.std
        # Transpose HWC -> CHW and add batch dimension (1, 3, H, W)
        chw = np.transpose(normalized, (2, 0, 1))
        tensor = np.expand_dims(chw, axis=0).astype(np.float32)
        return tensor

    @staticmethod
    def softmax(x: np.ndarray) -> np.ndarray:
        """Numerically stable softmax."""
        shift_x = x - np.max(x, axis=-1, keepdims=True)
        exps = np.exp(shift_x)
        return exps / np.sum(exps, axis=-1, keepdims=True)

    def classify(
        self,
        image_bgr: np.ndarray,
        top_k: Optional[int] = None,
    ) -> ClassificationResult:
        """Executes classification inference on a BGR image ROI."""
        start_time = time.perf_counter()
        k = top_k or self.settings.CLASSIFIER_TOP_K

        tensor = self.preprocess(image_bgr)
        raw_outputs = self.session.run([self.output_name], {self.input_name: tensor})
        logits = raw_outputs[0][0]  # shape: (num_classes,)

        probabilities = self.softmax(logits)
        num_classes = len(probabilities)
        k = min(k, num_classes)

        # Rank indices descending by confidence
        top_indices = np.argsort(probabilities)[::-1][:k]

        predictions: List[TopKPrediction] = []
        for idx in top_indices:
            cid = int(idx)
            prob = float(probabilities[cid])
            meta = self.classes_metadata.get(cid, {})

            predictions.append(
                TopKPrediction(
                    class_id=cid,
                    class_name=meta.get("class_name", f"Class_{cid}"),
                    confidence=round(prob, 4),
                    species=meta.get("species"),
                    disease=meta.get("disease"),
                    is_healthy=meta.get("is_healthy"),
                    severity=meta.get("severity"),
                    treatment=meta.get("treatment"),
                )
            )

        latency_ms = (time.perf_counter() - start_time) * 1000.0

        return ClassificationResult(
            predictions=predictions,
            top_prediction=predictions[0],
            latency_ms=round(latency_ms, 2),
        )
