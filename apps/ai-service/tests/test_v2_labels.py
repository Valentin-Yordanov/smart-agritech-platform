"""Tests for the unknown class, crop-part (fruit) labels, pest regions and detector/classes.json consistency."""

import json

import numpy as np
import pytest

from app.core.config import get_settings
from app.schemas.detection import BoundingBox, DetectionItem, DetectionResult
from app.services.onnx_classifier import MobileNetV4Classifier
from app.services.onnx_detector import YOLO11Detector
from app.services.pipeline import DiagnosisPipeline


@pytest.fixture(scope="module")
def classifier() -> MobileNetV4Classifier:
    return MobileNetV4Classifier()


@pytest.fixture(scope="module")
def detector() -> YOLO11Detector:
    return YOLO11Detector()


class FakeSession:
    """Stands in for an ONNX session and always returns the given logits."""

    def __init__(self, logits: np.ndarray):
        self.logits = logits.astype(np.float32)[None, :]

    def run(self, output_names, feeds):
        return [self.logits]


class FakeDetector:
    """Returns fixed detections so pipeline logic can be tested without a real photo."""

    def __init__(self, labels):
        self.labels = labels

    def detect(self, image_bgr, conf_threshold=None, iou_threshold=None) -> DetectionResult:
        h, w = image_bgr.shape[:2]
        items = [
            DetectionItem(
                box=BoundingBox(x_min=10.0 + i, y_min=10.0, x_max=w - 10.0, y_max=h - 10.0),
                class_id=i,
                class_name=label,
                confidence=0.9,
            )
            for i, label in enumerate(self.labels)
        ]
        return DetectionResult(detections=items, count=len(items), image_width=w, image_height=h, latency_ms=1.0)


def classifier_with(tmp_path, entries, winner_id):
    """Real classifier wrapper with a custom classes.json and a session that picks `winner_id`."""
    path = tmp_path / "classes.json"
    path.write_text(json.dumps({"detection_classes": {"0": "leaf"}, "classification_classes": entries}))
    clf = MobileNetV4Classifier(classes_path=path)
    logits = np.full(len(entries), -5.0)
    logits[winner_id] = 8.0
    clf.session = FakeSession(logits)
    return clf


FRUIT_ENTRIES = [
    {"id": 0, "class_name": "tomato_fruit___blossom_end_rot", "species": "Tomato", "disease": "Blossom End Rot",
     "is_healthy": False, "severity": "Moderate", "treatment": "Water evenly.", "plant_part": "fruit"},
    {"id": 1, "class_name": "tomato_fruit___healthy", "species": "Tomato", "disease": "None",
     "is_healthy": True, "severity": "None", "treatment": "Healthy.", "plant_part": "fruit"},
    {"id": 2, "class_name": "unknown", "species": "Unknown", "disease": "Unknown",
     "is_healthy": False, "severity": "None", "treatment": "Retake.", "plant_part": "none"},
]


def test_detector_classes_match_model_output(detector: YOLO11Detector):
    with open(get_settings().CLASSES_JSON_PATH, encoding="utf-8") as f:
        names = json.load(f)["detection_classes"]
    assert detector.num_model_classes == len(names)
    assert detector.class_names == {int(k): v for k, v in names.items()}


def test_unknown_class_for_non_plant_image(classifier: MobileNetV4Classifier):
    names = {m["class_name"].lower() for m in classifier.classes_metadata.values()}
    unknown = set(get_settings().UNKNOWN_CLASS_NAMES) & names
    if not unknown:
        pytest.skip("Deployed classifier has no unknown class")

    noise = np.random.default_rng(0).integers(0, 256, (480, 640, 3), dtype=np.uint8)
    top = classifier.classify(noise).top_prediction
    assert top.class_name.lower() in unknown
    assert top.plant_part is None

    response = DiagnosisPipeline(detector=FakeDetector([]), classifier=classifier).diagnose(noise)
    assert response.status == "UNCERTAIN"
    assert response.primary_species == "Unknown"


def test_fruit_class_is_reported_with_its_part(tmp_path):
    clf = classifier_with(tmp_path, FRUIT_ENTRIES, winner_id=0)
    image = np.full((320, 320, 3), 80, dtype=np.uint8)

    top = clf.classify(image).top_prediction
    assert top.class_name == "tomato_fruit___blossom_end_rot"
    assert top.plant_part == "fruit"
    assert top.confidence > get_settings().CLASSIFIER_CONF_THRESHOLD

    response = DiagnosisPipeline(detector=FakeDetector(["fruit"]), classifier=clf).diagnose(image)
    assert response.status == "DISEASED"
    assert response.primary_species == "Tomato"
    assert response.primary_disease == "Tomato (fruit) Blossom End Rot"
    assert response.regions[0].detection_label == "fruit"
    assert response.regions[0].classification.top_prediction.plant_part == "fruit"


def test_part_is_derived_from_v2_class_name_when_missing(tmp_path):
    entries = [dict(e) for e in FRUIT_ENTRIES]
    for e in entries:
        e.pop("plant_part")
    clf = classifier_with(tmp_path, entries, winner_id=1)
    top = clf.classify(np.zeros((64, 64, 3), dtype=np.uint8)).top_prediction
    assert top.plant_part == "fruit"
    assert MobileNetV4Classifier._part_from_name("Tomato___Early_blight") == "leaf"
    assert MobileNetV4Classifier._part_from_name("rice_panicle___bacterial_panicle_blight") == "panicle"


def test_pest_box_sets_pest_status_and_is_not_a_disease_candidate(tmp_path):
    clf = classifier_with(tmp_path, FRUIT_ENTRIES, winner_id=1)
    image = np.full((320, 320, 3), 80, dtype=np.uint8)
    response = DiagnosisPipeline(detector=FakeDetector(["pest", "fruit"]), classifier=clf).diagnose(image)
    assert response.status == "PEST_INFESTATION"
    assert response.regions_analyzed == 2


def test_regions_are_capped(tmp_path):
    clf = classifier_with(tmp_path, FRUIT_ENTRIES, winner_id=1)
    labels = ["leaf"] * (get_settings().CLASSIFIER_MAX_REGIONS + 5)
    response = DiagnosisPipeline(detector=FakeDetector(labels), classifier=clf).diagnose(np.zeros((200, 200, 3), dtype=np.uint8))
    assert response.regions_analyzed == get_settings().CLASSIFIER_MAX_REGIONS
