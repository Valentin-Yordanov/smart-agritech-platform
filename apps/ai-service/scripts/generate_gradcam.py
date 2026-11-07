"""PyTorch Grad-CAM Visual Explainability Generator for Competition Jury Proof.

Generates botanical attribution heatmaps overlaid on leaf pathology imagery,
proving to jury members and agronomists that the vision model attends to true
pathological symptoms (e.g. fungal lesions, chlorosis, necrosis) rather than
background artifacts (soil, trellis, lighting).
"""

import argparse
import json
from pathlib import Path
import sys
from typing import Optional, Tuple

import cv2
import numpy as np


class GradCAM:
    """Self-contained PyTorch Grad-CAM implementation with gradient hook tracking."""

    def __init__(self, model, target_layer) -> None:
        self.model = model
        self.target_layer = target_layer
        self.gradients: Optional[np.ndarray] = None
        self.activations: Optional[np.ndarray] = None

        self._register_hooks()

    def _register_hooks(self) -> None:
        def forward_hook(module, input, output):
            self.activations = output.detach()

        def backward_hook(module, grad_in, grad_out):
            self.gradients = grad_out[0].detach()

        self.target_layer.register_forward_hook(forward_hook)
        self.target_layer.register_full_backward_hook(backward_hook)

    def generate(self, input_tensor, target_class_idx: Optional[int] = None) -> Tuple[np.ndarray, int, float]:
        import torch
        import torch.nn.functional as F

        self.model.eval()
        output = self.model(input_tensor)
        probs = F.softmax(output, dim=1)

        if target_class_idx is None:
            target_class_idx = int(torch.argmax(probs, dim=1).item())

        confidence = float(probs[0, target_class_idx].item())

        # Zero gradients and backpropagate target class score
        self.model.zero_grad()
        score = output[0, target_class_idx]
        score.backward()

        # Global average pool of gradients -> channel importance weights
        # Gradients: [1, C, H, W], Activations: [1, C, H, W]
        grads = self.gradients[0].cpu().numpy()
        acts = self.activations[0].cpu().numpy()

        weights = np.mean(grads, axis=(1, 2))  # [C]

        # Weighted combination of forward activation maps
        cam = np.zeros(acts.shape[1:], dtype=np.float32)  # [H, W]
        for i, w in enumerate(weights):
            cam += w * acts[i, :, :]

        # Apply ReLU to focus strictly on positive contributions
        cam = np.maximum(cam, 0)

        # Normalize to [0, 1]
        cam_min, cam_max = np.min(cam), np.max(cam)
        if cam_max > cam_min:
            cam = (cam - cam_min) / (cam_max - cam_min)
        else:
            cam = np.zeros_like(cam)

        return cam, target_class_idx, confidence


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Generate Grad-CAM Explainability Heatmaps for AgriTech Jury Proof"
    )
    parser.add_argument(
        "--image",
        type=str,
        required=True,
        help="Path to input plant leaf image",
    )
    parser.add_argument(
        "--model-name",
        type=str,
        default="mobilenetv4_conv_small.e1200_r224_in1k",
        help="Timm architecture identifier",
    )
    parser.add_argument(
        "--weights",
        type=str,
        default="",
        help="Optional path to custom fine-tuned weights (.pth)",
    )
    parser.add_argument(
        "--num-classes",
        type=int,
        default=22,
        help="Number of classes in classification head (default: 22)",
    )
    parser.add_argument(
        "--target-class",
        type=int,
        default=None,
        help="Specific class index to explain (default: argmax top prediction)",
    )
    parser.add_argument(
        "--output",
        type=str,
        default="gradcam_jury_proof.jpg",
        help="Destination path for composite visual evidence image",
    )
    parser.add_argument(
        "--classes-json",
        type=str,
        default="app/models/classes.json",
        help="Path to classes metadata JSON",
    )
    return parser.parse_args()


def main() -> None:
    args = parse_args()

    try:
        import timm
        import torch
    except ImportError:
        print("[ERROR] 'torch' and 'timm' are required to generate Grad-CAM proof.")
        print("Run: pip install torch torchvision timm")
        sys.exit(1)

    image_path = Path(args.image)
    if not image_path.exists():
        print(f"[ERROR] Input image not found: {image_path}")
        sys.exit(1)

    # Load classes metadata
    class_name_map = {}
    classes_json = Path(args.classes_json)
    if classes_json.exists():
        with open(classes_json, "r", encoding="utf-8") as f:
            data = json.load(f)
            for idx, item in enumerate(data.get("classification_classes", [])):
                cid = item.get("id", idx)
                class_name_map[cid] = item.get("class_name", f"Class_{cid}")

    print(f"[*] Initializing model: {args.model_name}...")
    model = timm.create_model(
        args.model_name,
        pretrained=(not args.weights),
        num_classes=args.num_classes,
    )

    if args.weights and Path(args.weights).exists():
        state_dict = torch.load(args.weights, map_location="cpu")
        if "state_dict" in state_dict:
            state_dict = state_dict["state_dict"]
        model.load_state_dict(state_dict, strict=False)

    model.eval()

    # Identify the last convolutional feature layer in MobileNetV4 / Timm model
    target_layer = None
    for name, module in reversed(list(model.named_modules())):
        if isinstance(module, torch.nn.Conv2d):
            target_layer = module
            print(f"[*] Attached Grad-CAM hook to target feature layer: '{name}'")
            break

    if target_layer is None:
        print("[ERROR] Could not automatically locate Conv2d layer in model architecture.")
        sys.exit(1)

    # Read and preprocess image
    orig_bgr = cv2.imread(str(image_path))
    if orig_bgr is None:
        print(f"[ERROR] Failed to load image: {image_path}")
        sys.exit(1)

    orig_h, orig_w = orig_bgr.shape[:2]

    # Preprocess for model
    resized = cv2.resize(orig_bgr, (224, 224), interpolation=cv2.INTER_LINEAR)
    rgb = cv2.cvtColor(resized, cv2.COLOR_BGR2RGB).astype(np.float32) / 255.0

    mean = np.array([0.485, 0.456, 0.406], dtype=np.float32)
    std = np.array([0.229, 0.224, 0.225], dtype=np.float32)
    norm = (rgb - mean) / std

    tensor = torch.from_numpy(np.transpose(norm, (2, 0, 1))).unsqueeze(0).float()

    print("[*] Computing activation gradients and heatmaps...")
    cam_generator = GradCAM(model, target_layer)
    cam, pred_idx, confidence = cam_generator.generate(tensor, target_class_idx=args.target_class)

    # Resize CAM to native image dimensions
    cam_resized = cv2.resize(cam, (orig_w, orig_h), interpolation=cv2.INTER_CUBIC)
    heatmap = cv2.applyColorMap(np.uint8(255 * cam_resized), cv2.COLORMAP_JET)

    # Create composite overlay (65% original image + 35% thermal heatmap)
    overlay = cv2.addWeighted(orig_bgr, 0.65, heatmap, 0.35, 0)

    # Build side-by-side presentation panel: [Original | Heatmap | Overlay]
    banner_height = 60
    panel_w = orig_w * 3
    panel_h = orig_h + banner_height
    composite = np.zeros((panel_h, panel_w, 3), dtype=np.uint8)

    composite[banner_height:, :orig_w] = orig_bgr
    composite[banner_height:, orig_w : orig_w * 2] = heatmap
    composite[banner_height:, orig_w * 2 :] = overlay

    # Add explanatory annotations
    label_text = class_name_map.get(pred_idx, f"Class_{pred_idx}")
    title_text = f"Grad-CAM Attribution Proof | Class: {label_text} | Conf: {confidence * 100:.1f}%"
    cv2.putText(
        composite,
        title_text,
        (20, 38),
        cv2.FONT_HERSHEY_SIMPLEX,
        0.8,
        (255, 255, 255),
        2,
        cv2.LINE_AA,
    )

    output_path = Path(args.output)
    output_path.parent.mkdir(parents=True, exist_ok=True)
    cv2.imwrite(str(output_path), composite)

    print(f"\n[+] Grad-CAM Jury Proof Generated Successfully!")
    print(f"    - Diagnosed Class : {label_text} (ID: {pred_idx})")
    print(f"    - Model Confidence: {confidence * 100:.2f}%")
    print(f"    - Composite Proof : {output_path.resolve()}\n")


if __name__ == "__main__":
    main()
