"""YOLOv11 ONNX Object Detector Service.

Handles optimized ONNX Runtime session management, aspect-ratio preserving letterboxing,
vectorized candidate filtering, OpenCV C++ Non-Maximum Suppression (NMS), and
coordinate un-padding back to native resolution.
"""

import json
from pathlib import Path
import time
from typing import Dict, List, Optional, Tuple

import cv2
import numpy as np
import onnxruntime as ort

from app.core.config import Settings, get_settings
from app.core.logger import logger
from app.schemas.detection import BoundingBox, DetectionItem, DetectionResult


class YOLO11Detector:
    """Production-grade ONNX Runtime wrapper for YOLOv11 nano leaf/pest detection."""

    def __init__(
        self,
        model_path: Optional[Path] = None,
        classes_path: Optional[Path] = None,
        settings: Optional[Settings] = None,
    ) -> None:
        self.settings = settings or get_settings()
        self.model_path = model_path or self.settings.YOLO_MODEL_PATH
        self.classes_path = classes_path or self.settings.CLASSES_JSON_PATH

        self.class_names: Dict[int, str] = self._load_classes()
        self.session: ort.InferenceSession = self._init_session()

        # Extract input/output metadata
        inputs = self.session.get_inputs()
        outputs = self.session.get_outputs()
        self.input_name: str = inputs[0].name
        self.output_name: str = outputs[0].name
        self.input_shape: List[int] = inputs[0].shape  # e.g., [1, 3, 640, 640]
        self.target_size: int = self.settings.DETECTOR_INPUT_SIZE

        logger.info(
            f"Initialized YOLO11Detector: model={self.model_path.name}, "
            f"input='{self.input_name}', output='{self.output_name}', "
            f"classes={len(self.class_names)}"
        )

    def _load_classes(self) -> Dict[int, str]:
        """Loads detection class mappings from classes.json."""
        if not self.classes_path.exists():
            logger.warning(f"Classes JSON not found at {self.classes_path}. Using fallback classes.")
            return {0: "leaf", 1: "leaf_spot", 2: "stem", 3: "fruit", 4: "aphid", 5: "whitefly", 6: "caterpillar", 7: "spider_mite"}

        try:
            with open(self.classes_path, "r", encoding="utf-8") as f:
                data = json.load(f)
                detection_classes = data.get("detection_classes", {})
                return {int(k): str(v) for k, v in detection_classes.items()}
        except Exception as exc:
            logger.error(f"Failed to parse classes JSON from {self.classes_path}: {exc}")
            return {0: "leaf", 1: "leaf_spot"}

    def _init_session(self) -> ort.InferenceSession:
        """Configures ONNX Runtime with optimized CPU threadpools and graph rewrites."""
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
        """Runs a synthetic inference pass to warm up CPU caches and ORT allocators."""
        dummy_input = np.zeros((1, 3, self.target_size, self.target_size), dtype=np.float32)
        _ = self.session.run([self.output_name], {self.input_name: dummy_input})
        logger.info("YOLO11Detector warm-up completed.")

    def letterbox(
        self,
        image: np.ndarray,
        target_size: int = 640,
        color: Tuple[int, int, int] = (114, 114, 114),
    ) -> Tuple[np.ndarray, float, Tuple[float, float]]:
        """Resizes and pads image while maintaining aspect ratio (stride 32 compatible).

        Returns:
            padded_img: np.ndarray of shape (target_size, target_size, 3)
            ratio: float scale factor
            (pad_w, pad_h): padding offsets in pixels
        """
        shape = image.shape[:2]  # [height, width]
        ratio = min(target_size / shape[0], target_size / shape[1])
        new_unpad = (int(round(shape[1] * ratio)), int(round(shape[0] * ratio)))

        pad_w = (target_size - new_unpad[0]) / 2.0
        pad_h = (target_size - new_unpad[1]) / 2.0

        if shape[::-1] != new_unpad:
            image = cv2.resize(image, new_unpad, interpolation=cv2.INTER_LINEAR)

        top, bottom = int(round(pad_h - 0.1)), int(round(pad_h + 0.1))
        left, right = int(round(pad_w - 0.1)), int(round(pad_w + 0.1))
        padded_img = cv2.copyMakeBorder(
            image, top, bottom, left, right, cv2.BORDER_CONSTANT, value=color
        )
        return padded_img, ratio, (pad_w, pad_h)

    def preprocess(self, image_bgr: np.ndarray) -> Tuple[np.ndarray, float, Tuple[float, float]]:
        """Transforms raw image into CHW normalized float32 tensor."""
        padded_img, ratio, (pad_w, pad_h) = self.letterbox(image_bgr, target_size=self.target_size)
        # Convert BGR to RGB
        img_rgb = cv2.cvtColor(padded_img, cv2.COLOR_BGR2RGB)
        # Normalize to [0.0, 1.0] and transpose to (C, H, W)
        blob = img_rgb.astype(np.float32) / 255.0
        blob = np.transpose(blob, (2, 0, 1))
        blob = np.expand_dims(blob, axis=0)  # (1, 3, 640, 640)
        return blob, ratio, (pad_w, pad_h)

    def postprocess(
        self,
        output: np.ndarray,
        ratio: float,
        pads: Tuple[float, float],
        orig_shape: Tuple[int, int],
        conf_threshold: Optional[float] = None,
        iou_threshold: Optional[float] = None,
    ) -> List[DetectionItem]:
        """Parses YOLOv11 output tensor, applies C++ NMS, and un-pads bounding boxes."""
        conf_thresh = conf_threshold or self.settings.DETECTOR_CONF_THRESHOLD
        iou_thresh = iou_threshold or self.settings.DETECTOR_IOU_THRESHOLD
        pad_w, pad_h = pads
        orig_h, orig_w = orig_shape

        # YOLOv11 output shape is typically (1, 4 + num_classes, 8400)
        # Ensure predictions shape is (8400, 4 + num_classes)
        preds = output[0]
        if preds.shape[0] < preds.shape[1]:
            preds = np.transpose(preds, (1, 0))

        boxes = preds[:, :4]  # (cx, cy, w, h)
        class_scores = preds[:, 4:]  # (num_anchors, num_classes)

        # Vectorized candidate extraction
        class_ids = np.argmax(class_scores, axis=1)
        confidences = class_scores[np.arange(len(class_scores)), class_ids]

        mask = confidences >= conf_thresh
        if not np.any(mask):
            return []

        boxes = boxes[mask]
        confidences = confidences[mask]
        class_ids = class_ids[mask]

        # Convert cx, cy, w, h to xywh format for cv2.dnn.NMSBoxes
        cx, cy, w, h = boxes[:, 0], boxes[:, 1], boxes[:, 2], boxes[:, 3]
        x1 = cx - (w / 2.0)
        y1 = cy - (h / 2.0)

        boxes_xywh = np.stack([x1, y1, w, h], axis=1).tolist()
        scores_list = confidences.astype(float).tolist()

        indices = cv2.dnn.NMSBoxes(
            boxes_xywh,
            scores_list,
            score_threshold=float(conf_thresh),
            nms_threshold=float(iou_thresh),
        )

        detections: List[DetectionItem] = []
        if len(indices) == 0:
            return detections

        flat_indices = np.array(indices).flatten()[: self.settings.DETECTOR_MAX_BOXES]

        for idx in flat_indices:
            box_x1 = (x1[idx] - pad_w) / ratio
            box_y1 = (y1[idx] - pad_h) / ratio
            box_x2 = (x1[idx] + w[idx] - pad_w) / ratio
            box_y2 = (y1[idx] + h[idx] - pad_h) / ratio

            # Clamp coordinates to native image bounds
            box_x1 = max(0.0, min(float(orig_w), float(box_x1)))
            box_y1 = max(0.0, min(float(orig_h), float(box_y1)))
            box_x2 = max(0.0, min(float(orig_w), float(box_x2)))
            box_y2 = max(0.0, min(float(orig_h), float(box_y2)))

            cid = int(class_ids[idx])
            cname = self.class_names.get(cid, f"class_{cid}")

            detections.append(
                DetectionItem(
                    box=BoundingBox(
                        x_min=round(box_x1, 2),
                        y_min=round(box_y1, 2),
                        x_max=round(box_x2, 2),
                        y_max=round(box_y2, 2),
                    ),
                    class_id=cid,
                    class_name=cname,
                    confidence=round(float(confidences[idx]), 4),
                )
            )

        return detections

    def detect(
        self,
        image_bgr: np.ndarray,
        conf_threshold: Optional[float] = None,
        iou_threshold: Optional[float] = None,
    ) -> DetectionResult:
        """Executes full detection pipeline on a BGR numpy image."""
        start_time = time.perf_counter()
        orig_h, orig_w = image_bgr.shape[:2]

        blob, ratio, pads = self.preprocess(image_bgr)
        outputs = self.session.run([self.output_name], {self.input_name: blob})
        detections = self.postprocess(
            outputs[0],
            ratio=ratio,
            pads=pads,
            orig_shape=(orig_h, orig_w),
            conf_threshold=conf_threshold,
            iou_threshold=iou_threshold,
        )

        latency_ms = (time.perf_counter() - start_time) * 1000.0

        return DetectionResult(
            detections=detections,
            count=len(detections),
            image_width=orig_w,
            image_height=orig_h,
            latency_ms=round(latency_ms, 2),
        )
