"""YOLOv11 PyTorch to ONNX Export Script with ONNXSlim Optimization.

Exports Ultralytics YOLOv11 nano weights to a high-efficiency ONNX graph
tailored for low-latency CPU inference.
"""

import argparse
from pathlib import Path
import sys
import time


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Export YOLOv11 model to optimized ONNX for AgriTech CPU inference"
    )
    parser.add_argument(
        "--weights",
        type=str,
        default="yolo11n.pt",
        help="Path to trained PyTorch weights (.pt)",
    )
    parser.add_argument(
        "--output",
        type=str,
        default="app/models/yolo11n_leaf.onnx",
        help="Destination path for the exported .onnx file",
    )
    parser.add_argument(
        "--imgsz",
        type=int,
        default=640,
        help="Inference image resolution (default: 640)",
    )
    parser.add_argument(
        "--opset",
        type=int,
        default=17,
        help="ONNX opset version (default: 17)",
    )
    parser.add_argument(
        "--slim",
        action="store_true",
        default=True,
        help="Apply onnxslim graph optimization and constant folding",
    )
    return parser.parse_args()


def export_yolo(args: argparse.Namespace) -> None:
    try:
        from ultralytics import YOLO
    except ImportError:
        print("[ERROR] 'ultralytics' is not installed. Run: pip install ultralytics")
        sys.exit(1)

    weights_path = Path(args.weights)
    output_path = Path(args.output)
    output_path.parent.mkdir(parents=True, exist_ok=True)

    print(f"[*] Loading YOLO weights from: {weights_path}")
    model = YOLO(str(weights_path))

    print(f"[*] Exporting to ONNX (imgsz={args.imgsz}, opset={args.opset})...")
    exported_file = model.export(
        format="onnx",
        imgsz=args.imgsz,
        dynamic=False,
        opset=args.opset,
        simplify=False,  # We will use onnxslim for superior optimization
    )

    exported_path = Path(exported_file)

    # Apply onnxslim optimization if requested
    if args.slim:
        try:
            import onnxslim

            print("[*] Running onnxslim model simplification...")
            slim_output = onnxslim.slim(
                model=str(exported_path),
                output_model=str(output_path),
            )
            print(f"[+] Successfully slimmed ONNX model to: {output_path}")
        except ImportError:
            print("[WARN] 'onnxslim' not installed. Copying raw exported ONNX. (pip install onnxslim)")
            import shutil
            shutil.copy(exported_path, output_path)
    else:
        import shutil
        shutil.copy(exported_path, output_path)

    # Verify model with ONNX Runtime
    try:
        import numpy as np
        import onnxruntime as ort

        print("[*] Verifying exported model with ONNX Runtime CPU provider...")
        session = ort.InferenceSession(str(output_path), providers=["CPUExecutionProvider"])
        input_name = session.get_inputs()[0].name
        dummy_input = np.random.randn(1, 3, args.imgsz, args.imgsz).astype(np.float32)

        # Benchmark 10 iterations
        t_start = time.perf_counter()
        for _ in range(10):
            _ = session.run(None, {input_name: dummy_input})
        avg_latency_ms = ((time.perf_counter() - t_start) / 10) * 1000.0

        print(f"[SUCCESS] ONNX model verified! Average CPU latency: {avg_latency_ms:.2f} ms")
    except Exception as exc:
        print(f"[WARN] Verification check failed: {exc}")


if __name__ == "__main__":
    export_yolo(parse_args())
