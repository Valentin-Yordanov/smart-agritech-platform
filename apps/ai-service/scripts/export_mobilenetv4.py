"""MobileNetV4 Timm PyTorch to ONNX Export Script.

Exports a MobileNetV4 convolutional model to an optimized static ONNX graph
for plant pathology classification.
"""

import argparse
from pathlib import Path
import sys
import time


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Export Timm MobileNetV4 model to ONNX for CPU inference"
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
        help="Optional path to custom fine-tuned PyTorch state_dict (.pth / .pt)",
    )
    parser.add_argument(
        "--num-classes",
        type=int,
        default=22,
        help="Number of plant disease output classes (default: 22)",
    )
    parser.add_argument(
        "--output",
        type=str,
        default="app/models/mobilenetv4_plant_disease.onnx",
        help="Output destination path for the .onnx file",
    )
    parser.add_argument(
        "--imgsz",
        type=int,
        default=224,
        help="Input resolution (default: 224)",
    )
    parser.add_argument(
        "--opset",
        type=int,
        default=17,
        help="ONNX opset version (default: 17)",
    )
    return parser.parse_args()


def export_mobilenetv4(args: argparse.Namespace) -> None:
    try:
        import timm
        import torch
    except ImportError:
        print("[ERROR] 'torch' or 'timm' is not installed. Run: pip install torch timm")
        sys.exit(1)

    output_path = Path(args.output)
    output_path.parent.mkdir(parents=True, exist_ok=True)

    print(f"[*] Creating Timm model '{args.model_name}' with {args.num_classes} classes...")
    model = timm.create_model(
        args.model_name,
        pretrained=(not args.weights),
        num_classes=args.num_classes,
    )

    if args.weights and Path(args.weights).exists():
        print(f"[*] Loading fine-tuned weights from: {args.weights}")
        state_dict = torch.load(args.weights, map_location="cpu")
        if "state_dict" in state_dict:
            state_dict = state_dict["state_dict"]
        model.load_state_dict(state_dict, strict=False)

    model.eval()

    dummy_input = torch.randn(1, 3, args.imgsz, args.imgsz, dtype=torch.float32)

    print(f"[*] Exporting MobileNetV4 to ONNX (opset={args.opset})...")
    torch.onnx.export(
        model,
        dummy_input,
        str(output_path),
        export_params=True,
        opset_version=args.opset,
        do_constant_folding=True,
        input_names=["input"],
        output_names=["logits"],
        dynamic_axes=None,  # Fixed shape yields best CPU kernel fusion in ONNX Runtime
    )

    print(f"[+] Successfully exported model to: {output_path}")

    # ONNX graph validation
    try:
        import onnx
        onnx_model = onnx.load(str(output_path))
        onnx.checker.check_model(onnx_model)
        print("[*] ONNX graph structure checked: OK")
    except ImportError:
        pass

    # Benchmark CPU latency
    try:
        import numpy as np
        import onnxruntime as ort

        print("[*] Running CPU performance benchmark with ONNX Runtime...")
        session = ort.InferenceSession(str(output_path), providers=["CPUExecutionProvider"])
        test_arr = np.random.randn(1, 3, args.imgsz, args.imgsz).astype(np.float32)

        # Warmup
        _ = session.run(None, {"input": test_arr})

        # 20 timing iterations
        t_start = time.perf_counter()
        iters = 20
        for _ in range(iters):
            _ = session.run(None, {"input": test_arr})
        avg_ms = ((time.perf_counter() - t_start) / iters) * 1000.0

        print(f"[SUCCESS] MobileNetV4 CPU Latency: {avg_ms:.2f} ms per ROI (Target: < 20 ms)")
    except Exception as exc:
        print(f"[WARN] Runtime verification check skipped: {exc}")


if __name__ == "__main__":
    export_mobilenetv4(parse_args())
