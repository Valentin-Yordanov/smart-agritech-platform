"""Diagnosis Pipeline Orchestration Service.

Combines YOLOv11 leaf/pest localization, context-padded ROI cropping,
and MobileNetV4 pathology classification into a unified pipeline with
sub-100ms CPU latency tracking and agronomic diagnostic reasoning.
"""

from pathlib import Path
import time
from typing import List, Optional, Tuple

import cv2
import numpy as np

from app.core.config import Settings, get_settings
from app.core.logger import logger
from app.schemas.classification import ClassificationResult
from app.schemas.detection import BoundingBox
from app.schemas.diagnosis import DiagnosedRegion, DiagnosisResponse, LatencyBenchmark
from app.services.onnx_classifier import MobileNetV4Classifier
from app.services.onnx_detector import YOLO11Detector


class DiagnosisPipeline:
    """End-to-end diagnostic pipeline for plant health assessment."""

    def __init__(
        self,
        detector: Optional[YOLO11Detector] = None,
        classifier: Optional[MobileNetV4Classifier] = None,
        settings: Optional[Settings] = None,
    ) -> None:
        self.settings = settings or get_settings()
        self.detector = detector or YOLO11Detector(settings=self.settings)
        self.classifier = classifier or MobileNetV4Classifier(settings=self.settings)

    def warmup(self) -> None:
        """Primes both ONNX models to prevent cold-start latency."""
        self.detector.warmup()
        self.classifier.warmup()
        logger.info("Diagnosis pipeline fully primed.")

    def decode_image(self, image_bytes: bytes) -> np.ndarray:
        """Decodes raw image bytes into a validated BGR numpy array."""
        np_arr = np.frombuffer(image_bytes, np.uint8)
        img_bgr = cv2.imdecode(np_arr, cv2.IMREAD_COLOR)
        if img_bgr is None or img_bgr.size == 0:
            raise ValueError("Failed to decode image bytes. Unsupported or corrupted format.")
        return img_bgr

    def _extract_crop_with_padding(
        self,
        image_bgr: np.ndarray,
        box: BoundingBox,
        padding_ratio: float = 0.10,
    ) -> Tuple[np.ndarray, BoundingBox]:
        """Crops ROI from image with safety padding to prevent edge truncation."""
        img_h, img_w = image_bgr.shape[:2]
        w = box.width
        h = box.height

        pad_x = w * padding_ratio
        pad_y = h * padding_ratio

        x1 = max(0, int(box.x_min - pad_x))
        y1 = max(0, int(box.y_min - pad_y))
        x2 = min(img_w, int(box.x_max + pad_x))
        y2 = min(img_h, int(box.y_max + pad_y))

        # Fallback for degenerate boxes
        if x2 <= x1 or y2 <= y1:
            crop = cv2.resize(image_bgr, (self.settings.CLASSIFIER_INPUT_SIZE, self.settings.CLASSIFIER_INPUT_SIZE))
            return crop, box

        crop = image_bgr[y1:y2, x1:x2]
        padded_box = BoundingBox(
            x_min=float(x1),
            y_min=float(y1),
            x_max=float(x2),
            y_max=float(y2),
        )
        return crop, padded_box

    def diagnose(
        self,
        image_bgr: np.ndarray,
        conf_threshold: Optional[float] = None,
        iou_threshold: Optional[float] = None,
    ) -> DiagnosisResponse:
        """Executes the complete diagnosis pipeline with high-resolution latency profiling."""
        total_start = time.perf_counter()

        # Step 1: Preprocess & Detection
        t_det_start = time.perf_counter()
        detection_result = self.detector.detect(
            image_bgr=image_bgr,
            conf_threshold=conf_threshold,
            iou_threshold=iou_threshold,
        )
        t_det_end = time.perf_counter()
        det_time_ms = (t_det_end - t_det_start) * 1000.0

        # Step 2: Context-padded Crop Extraction
        t_crop_start = time.perf_counter()
        diagnosed_regions: List[DiagnosedRegion] = []
        crop_images: List[Tuple[np.ndarray, BoundingBox, str, float]] = []

        for det in detection_result.detections:
            crop, padded_box = self._extract_crop_with_padding(
                image_bgr=image_bgr,
                box=det.box,
                padding_ratio=self.settings.CROP_PADDING_RATIO,
            )
            crop_images.append((crop, padded_box, det.class_name, det.confidence))

        t_crop_end = time.perf_counter()
        crop_time_ms = (t_crop_end - t_crop_start) * 1000.0

        # Step 3: Classification on Crops + Full Image
        t_cls_start = time.perf_counter()

        # Run full-image baseline
        full_img_cls = self.classifier.classify(image_bgr)

        # Classify localized ROIs
        for idx, (crop, padded_box, det_label, det_conf) in enumerate(crop_images):
            crop_cls = self.classifier.classify(crop)
            diagnosed_regions.append(
                DiagnosedRegion(
                    region_id=idx + 1,
                    box=padded_box,
                    detection_label=det_label,
                    detection_confidence=det_conf,
                    classification=crop_cls,
                )
            )

        t_cls_end = time.perf_counter()
        cls_time_ms = (t_cls_end - t_cls_start) * 1000.0

        total_time_ms = (time.perf_counter() - total_start) * 1000.0
        prep_time_ms = max(0.0, total_time_ms - (det_time_ms + crop_time_ms + cls_time_ms))

        # Step 4: Agronomic Health Reasoning & Synthesis
        pest_labels = {"aphid", "whitefly", "caterpillar", "spider_mite"}
        has_pest = any(r.detection_label.lower() in pest_labels for r in diagnosed_regions)

        # Check diseases across regions and full image
        active_pathologies = []
        highest_severity = "None"
        severity_rank = {"None": 0, "Low": 1, "Moderate": 2, "High": 3, "Critical": 4}

        candidates = [full_img_cls.top_prediction] + [r.classification.top_prediction for r in diagnosed_regions]

        for cand in candidates:
            if not cand.is_healthy and cand.disease and cand.disease.lower() != "none":
                active_pathologies.append(cand)
                cand_sev = cand.severity or "Moderate"
                if severity_rank.get(cand_sev, 0) > severity_rank.get(highest_severity, 0):
                    highest_severity = cand_sev

        # Determine overall status and species
        dominant_species = full_img_cls.top_prediction.species or "Plant"

        if has_pest:
            status = "PEST_INFESTATION"
            health_score = 45.0
            primary_disease = "Pest Infestation Detected"
        elif active_pathologies:
            status = "DISEASED"
            primary = max(active_pathologies, key=lambda x: x.confidence)
            primary_disease = f"{primary.species} {primary.disease}".strip()
            # Health score inversely proportional to severity
            score_map = {"Critical": 25.0, "High": 45.0, "Moderate": 65.0, "Low": 80.0, "None": 90.0}
            health_score = score_map.get(highest_severity, 60.0)
        else:
            status = "HEALTHY"
            health_score = 96.5
            primary_disease = "None"
            highest_severity = "None"

        # Step 5: Actionable Recommendations
        recommendations: List[str] = []
        if status == "HEALTHY":
            recommendations.append("Canopy vigor is optimal. Maintain current irrigation and nutrient feeding cycles.")
            recommendations.append("Continue periodic scouting every 5 to 7 days for early prevention.")
        elif status == "PEST_INFESTATION":
            recommendations.append("Apply targeted organic insecticidal soap or release biological controls (e.g. predatory mites).")
            recommendations.append("Inspect underside of surrounding leaves and place yellow sticky traps to track population density.")
        else:
            for path in active_pathologies[:2]:
                if path.treatment:
                    recommendations.append(f"{path.disease}: {path.treatment}")
            if not recommendations:
                recommendations.append("Isolate symptomatic plants to inhibit fungal and bacterial spread.")
                recommendations.append("Ensure adequate plant spacing to reduce microclimate humidity.")

        latencies = LatencyBenchmark(
            decode_and_preprocess_ms=round(prep_time_ms, 2),
            detection_ms=round(det_time_ms, 2),
            crop_ms=round(crop_time_ms, 2),
            classification_ms=round(cls_time_ms, 2),
            total_pipeline_ms=round(total_time_ms, 2),
            sub_100ms_target_met=(total_time_ms <= self.settings.LATENCY_BUDGET_MS),
        )

        return DiagnosisResponse(
            status=status,
            primary_species=dominant_species,
            primary_disease=primary_disease,
            overall_health_score=round(health_score, 1),
            severity_level=highest_severity,
            regions_analyzed=len(diagnosed_regions),
            regions=diagnosed_regions,
            full_image_classification=full_img_cls,
            recommendations=recommendations,
            latencies=latencies,
        )
