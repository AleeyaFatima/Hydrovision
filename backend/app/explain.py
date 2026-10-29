"""Grad-CAM explainability for flood segmentation models."""
import numpy as np
import torch
from pytorch_grad_cam import GradCAM
from pytorch_grad_cam.utils.image import show_cam_on_image
from pytorch_grad_cam.utils.model_targets import SemanticSegmentationTarget


class BinarySegmentationTarget:
    """Target function for binary segmentation Grad-CAM."""
    def __init__(self, mask: np.ndarray):
        self.mask = torch.from_numpy(mask).float()

    def __call__(self, model_output):
        if self.mask.device != model_output.device:
            self.mask = self.mask.to(model_output.device)
        # Weight logits by the predicted water region
        return (model_output * self.mask).sum()


def get_target_layer(model: torch.nn.Module) -> list[torch.nn.Module]:
    """Finds the optimal deep feature layer for Grad-CAM."""
    if hasattr(model, "decoder") and hasattr(model.decoder, "blocks") and len(model.decoder.blocks) > 0:
        return [model.decoder.blocks[-1]]
    elif hasattr(model, "encoder") and hasattr(model.encoder, "features"):
        return [model.encoder.features[-1]]
    else:
        # Fallback to the last convolutional module
        convs = [m for m in model.modules() if isinstance(m, torch.nn.Conv2d)]
        if convs:
            return [convs[-1]]
        raise ValueError("Could not find suitable layer for Grad-CAM")


def generate_gradcam(
    model: torch.nn.Module,
    tensor_img: torch.Tensor,
    raw_rgb_norm: np.ndarray,
    binary_mask: np.ndarray,
    device: torch.device,
) -> np.ndarray:
    """Computes Grad-CAM heatmap overlaid on normalized RGB image [0, 1].
    
    Returns:
        overlay_rgb: (H, W, 3) uint8 image of Grad-CAM overlay
    """
    model.eval()
    if tensor_img.dim() == 3:
        tensor_img = tensor_img.unsqueeze(0)
    tensor_img = tensor_img.to(device)

    target_layers = get_target_layer(model)
    targets = [BinarySegmentationTarget(binary_mask)]

    with GradCAM(model=model, target_layers=target_layers) as cam:
        grayscale_cam = cam(input_tensor=tensor_img, targets=targets)[0]

    cam_overlay = show_cam_on_image(raw_rgb_norm, grayscale_cam, use_rgb=True)
    return cam_overlay

