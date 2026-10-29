"""Inference engine supporting PyTorch, ONNX, TTA uncertainty, and Grad-CAM."""
import io
import base64
import time
from pathlib import Path
from typing import Any
import numpy as np
from PIL import Image
import torch
import cv2

from app.config import settings
from app.models import get_model, get_device
from app.transforms import get_inference_transforms
from app.uncertainty import predict_with_tta, create_uncertainty_heatmap
from app.explain import generate_gradcam


class AquaMapInferenceEngine:
    def __init__(self):
        self.model = None
        self.onnx_session = None
        self.model_name = settings.DEFAULT_MODEL_NAME
        self.device = get_device(settings.DEVICE)
        self.threshold = settings.DEFAULT_THRESHOLD
        self.img_size = settings.IMAGE_SIZE
        self.backend = settings.INFERENCE_BACKEND
        self.is_loaded = False
        self.transform = get_inference_transforms(self.img_size)

    def load_model(self, checkpoint_path: Path | None = None, backend: str | None = None):
        if backend:
            self.backend = backend

        if checkpoint_path is None:
            checkpoint_path = settings.BASE_DIR / settings.MODEL_PATH

        if self.backend == "onnx":
            onnx_path = checkpoint_path.with_suffix(".onnx")
            if not onnx_path.exists():
                print(f"ONNX model not found at {onnx_path}")
                self.is_loaded = False
                return False
            import onnxruntime as ort
            self.onnx_session = ort.InferenceSession(str(onnx_path), providers=["CPUExecutionProvider"])
            self.is_loaded = True
            print(f"Loaded ONNX model from {onnx_path}")
            return True

        # PyTorch backend
        if not checkpoint_path.exists():
            print(f"Checkpoint not found at {checkpoint_path}")
            self.is_loaded = False
            return False

        try:
            ckpt = torch.load(checkpoint_path, map_location=self.device)
            self.model_name = ckpt.get("model_name", settings.DEFAULT_MODEL_NAME)
            self.threshold = ckpt.get("best_threshold", settings.DEFAULT_THRESHOLD)
            self.img_size = ckpt.get("img_size", settings.IMAGE_SIZE)

            self.model = get_model(self.model_name, pretrained=False)
            self.model.load_state_dict(ckpt["state_dict"])
            self.model.to(self.device)
            self.model.eval()
            self.is_loaded = True
            print(f"Loaded PyTorch model '{self.model_name}' on {self.device} with threshold {self.threshold:.2f}")
            return True
        except Exception as e:
            print(f"Failed to load checkpoint: {e}")
            self.is_loaded = False
            return False

    def image_to_base64(self, img_arr: np.ndarray) -> str:
        """Converts RGB uint8 numpy array to base64 PNG string."""
        pil_img = Image.fromarray(img_arr.astype(np.uint8))
        buf = io.BytesIO()
        pil_img.save(buf, format="PNG")
        return base64.b64encode(buf.getvalue()).decode("utf-8")

    def create_overlay(self, original_rgb: np.ndarray, binary_mask: np.ndarray) -> np.ndarray:
        """Create 50% opacity cyan overlay on original image."""
        overlay = original_rgb.copy()
        cyan = np.array([34, 211, 238], dtype=np.uint8)  # Electric cyan #22D3EE
        water_px = binary_mask == 1
        overlay[water_px] = (0.5 * overlay[water_px] + 0.5 * cyan).astype(np.uint8)
        return overlay

    def predict(
        self,
        image_bytes: bytes,
        explain: bool = False,
        uncertainty: bool = False,
    ) -> dict[str, Any]:
        if not self.is_loaded:
            raise RuntimeError("Model is not loaded. Train a model or place checkpoint at models/best_model.pth.")

        orig_pil = Image.open(io.BytesIO(image_bytes)).convert("RGB")
        orig_w, orig_h = orig_pil.size
        orig_np = np.array(orig_pil)

        # Preprocess to 256x256 with ImageNet normalization
        augmented = self.transform(image=orig_np)
        input_tensor = augmented["image"].unsqueeze(0)  # (1, 3, 256, 256)

        t0 = time.perf_counter()
        mean_uncertainty = None
        uncertainty_b64 = None
        gradcam_b64 = None

        if uncertainty and self.model is not None:
            # TTA prediction
            mean_prob, std_map, mean_unc = predict_with_tta(self.model, input_tensor[0], self.device)
            mean_uncertainty = mean_unc
            prob_map = mean_prob

            # Generate uncertainty heatmap and resize to original
            unc_rgb_small = create_uncertainty_heatmap(std_map)
            unc_rgb_orig = cv2.resize(unc_rgb_small, (orig_w, orig_h), interpolation=cv2.INTER_LINEAR)
            uncertainty_b64 = self.image_to_base64(unc_rgb_orig)
        else:
            if self.backend == "onnx" and self.onnx_session is not None:
                ort_inputs = {"input": input_tensor.numpy()}
                logits = self.onnx_session.run(None, ort_inputs)[0]
                prob_map = 1.0 / (1.0 + np.exp(-logits[0, 0]))
            else:
                with torch.no_grad():
                    logits = self.model(input_tensor.to(self.device))
                    probs = torch.sigmoid(logits).cpu().numpy()
                    prob_map = probs[0, 0]

        t1 = time.perf_counter()
        inference_ms = float((t1 - t0) * 1000.0)

        # Upsample probability map to original image resolution
        prob_orig = cv2.resize(prob_map, (orig_w, orig_h), interpolation=cv2.INTER_LINEAR)
        binary_mask = (prob_orig >= self.threshold).astype(np.uint8)

        # Calculate water pixel percentage
        water_px_count = int(np.sum(binary_mask))
        total_px = int(orig_w * orig_h)
        water_percentage = float((water_px_count / max(total_px, 1)) * 100.0)

        # Mask as black/white PNG
        mask_png_arr = (binary_mask * 255).astype(np.uint8)
        mask_b64 = self.image_to_base64(np.stack([mask_png_arr]*3, axis=-1))

        # Overlay
        overlay_rgb = self.create_overlay(orig_np, binary_mask)
        overlay_b64 = self.image_to_base64(overlay_rgb)

        # Grad-CAM if requested and using PyTorch U-Net
        if explain and self.model is not None and "unet" in self.model_name:
            try:
                # Raw normalized image in [0, 1] for Grad-CAM display
                raw_resized = cv2.resize(orig_np, (self.img_size, self.img_size)).astype(np.float32) / 255.0
                bin_mask_small = (prob_map >= self.threshold).astype(np.uint8)
                cam_small = generate_gradcam(
                    self.model,
                    input_tensor[0],
                    raw_resized,
                    bin_mask_small,
                    self.device,
                )
                cam_orig = cv2.resize(cam_small, (orig_w, orig_h), interpolation=cv2.INTER_LINEAR)
                gradcam_b64 = self.image_to_base64(cam_orig)
            except Exception as e:
                print(f"Grad-CAM generation failed: {e}")

        return {
            "mask_png_base64": mask_b64,
            "overlay_png_base64": overlay_b64,
            "uncertainty_png_base64": uncertainty_b64,
            "gradcam_png_base64": gradcam_b64,
            "water_pixel_percentage": round(water_percentage, 2),
            "mean_uncertainty": round(mean_uncertainty, 4) if mean_uncertainty is not None else None,
            "threshold": float(self.threshold),
            "inference_ms": round(inference_ms, 2),
            "model_name": self.model_name,
            "image_size": [orig_w, orig_h],
        }


engine = AquaMapInferenceEngine()

