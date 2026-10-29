"""Export PyTorch model to ONNX and benchmark PyTorch vs ONNX Runtime."""
import argparse
import json
import time
from pathlib import Path
import numpy as np
import torch
import onnx
import onnxruntime as ort

from app.config import settings
from app.models import get_model


def export_to_onnx(
    model_name: str = "unet_mobilenetv2",
    checkpoint_path: Path | None = None,
    output_path: Path | None = None,
    img_size: int = 256,
):
    if checkpoint_path is None:
        checkpoint_path = settings.MODELS_DIR / f"best_{model_name}.pth"
    if output_path is None:
        output_path = settings.MODELS_DIR / f"{model_name}.onnx"

    print(f"\n--- Exporting {model_name} to ONNX ---")
    print(f"Loading weights from {checkpoint_path}")
    checkpoint = torch.load(checkpoint_path, map_location="cpu")

    model = get_model(model_name, pretrained=False)
    model.load_state_dict(checkpoint["state_dict"])
    model.eval()

    dummy_input = torch.randn(1, 3, img_size, img_size, requires_grad=False)

    output_path.parent.mkdir(parents=True, exist_ok=True)
    torch.onnx.export(
        model,
        dummy_input,
        str(output_path),
        export_params=True,
        opset_version=14,
        do_constant_folding=True,
        input_names=["input"],
        output_names=["output"],
        dynamic_axes={
            "input": {0: "batch_size"},
            "output": {0: "batch_size"},
        },
    )
    print(f"Saved ONNX model to: {output_path}")

    # Verify ONNX model structure
    onnx_model = onnx.load(str(output_path))
    onnx.checker.check_model(onnx_model)
    print("ONNX model structure verified with onnx.checker!")

    # Verify numerical match with PyTorch
    with torch.no_grad():
        torch_out = model(dummy_input).numpy()

    session = ort.InferenceSession(str(output_path), providers=["CPUExecutionProvider"])
    ort_inputs = {"input": dummy_input.numpy()}
    ort_out = session.run(None, ort_inputs)[0]

    max_diff = float(np.max(np.abs(torch_out - ort_out)))
    print(f"Max absolute difference between PyTorch and ONNX Runtime: {max_diff:.6e}")
    if max_diff >= 1e-4:
        print(f"Warning: numerical difference {max_diff} is above 1e-4 threshold.")
    else:
        print("Numerical parity check passed (< 1e-4)!")

    # Benchmark PyTorch CPU vs ONNX Runtime CPU
    runs = 30
    # PyTorch CPU benchmark
    torch_times = []
    with torch.no_grad():
        for _ in range(5):  # warmup
            _ = model(dummy_input)
        for _ in range(runs):
            t0 = time.perf_counter()
            _ = model(dummy_input)
            torch_times.append((time.perf_counter() - t0) * 1000.0)

    # ONNX Runtime CPU benchmark
    ort_times = []
    for _ in range(5):  # warmup
        _ = session.run(None, ort_inputs)
    for _ in range(runs):
        t0 = time.perf_counter()
        _ = session.run(None, ort_inputs)
        ort_times.append((time.perf_counter() - t0) * 1000.0)

    torch_mean = float(np.mean(torch_times))
    ort_mean = float(np.mean(ort_times))
    speedup = float(torch_mean / max(ort_mean, 1e-6))

    benchmark_data = {
        "model_name": model_name,
        "img_size": img_size,
        "runs": runs,
        "pytorch_cpu_ms": {
            "mean": torch_mean,
            "std": float(np.std(torch_times)),
            "min": float(np.min(torch_times)),
            "max": float(np.max(torch_times)),
        },
        "onnxruntime_cpu_ms": {
            "mean": ort_mean,
            "std": float(np.std(ort_times)),
            "min": float(np.min(ort_times)),
            "max": float(np.max(ort_times)),
        },
        "speedup_factor": speedup,
        "max_abs_diff": max_diff,
        "onnx_model_path": str(output_path.name),
    }

    settings.REPORTS_DIR.mkdir(parents=True, exist_ok=True)
    report_file = settings.REPORTS_DIR / "onnx_benchmark.json"
    with open(report_file, "w") as f:
        json.dump(benchmark_data, f, indent=2)

    print(f"\n--- ONNX Benchmark Summary ---")
    print(f"PyTorch CPU Mean Latency:     {torch_mean:.2f} ms")
    print(f"ONNX Runtime CPU Mean Latency: {ort_mean:.2f} ms")
    print(f"Speedup:                       {speedup:.2f}x")
    print(f"Saved benchmark to: {report_file}")

    return benchmark_data


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--model", type=str, default="unet_mobilenetv2")
    args = parser.parse_args()
    export_to_onnx(model_name=args.model)


if __name__ == "__main__":
    main()
