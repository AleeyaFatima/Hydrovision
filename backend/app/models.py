"""Model definitions for the AquaMap 3-model benchmark."""
import torch
import torch.nn as nn
import torch.nn.functional as F
import segmentation_models_pytorch as smp
from transformers import SegformerForSemanticSegmentation


class SegFormerB0(nn.Module):
    """SegFormer (nvidia/mit-b0) adapter for binary segmentation.
    
    Upsamples the 1/4 resolution feature logits back to original image size (256x256).
    """
    def __init__(self, pretrained: bool = True):
        super().__init__()
        model_name = "nvidia/mit-b0"
        if pretrained:
            self.model = SegformerForSemanticSegmentation.from_pretrained(
                model_name,
                num_labels=1,
                ignore_mismatched_sizes=True,
            )
        else:
            from transformers import SegformerConfig
            config = SegformerConfig.from_pretrained(model_name, num_labels=1)
            self.model = SegformerForSemanticSegmentation(config)

    def forward(self, x: torch.Tensor) -> torch.Tensor:
        b, c, h, w = x.shape
        # Segformer expects pixel_values
        outputs = self.model(pixel_values=x)
        logits = outputs.logits  # (B, 1, H/4, W/4)
        # Bilinear upsample back to input (H, W)
        upsampled = F.interpolate(logits, size=(h, w), mode="bilinear", align_corners=False)
        return upsampled


def get_model(model_name: str, pretrained: bool = True) -> nn.Module:
    """Factory function returning one of the 3 benchmark models:
    
    1. 'unet_scratch': U-Net with MobileNetV2 encoder, randomly initialized.
    2. 'unet_mobilenetv2': U-Net with ImageNet pretrained MobileNetV2 encoder.
    3. 'segformer_b0': SegFormer mit-b0 transformer architecture.
    """
    name = model_name.lower().strip()
    if name == "unet_scratch":
        return smp.Unet(
            encoder_name="mobilenet_v2",
            encoder_weights=None,
            in_channels=3,
            classes=1,
        )
    elif name == "unet_mobilenetv2":
        weights = "imagenet" if pretrained else None
        return smp.Unet(
            encoder_name="mobilenet_v2",
            encoder_weights=weights,
            in_channels=3,
            classes=1,
        )
    elif name == "segformer_b0":
        return SegFormerB0(pretrained=pretrained)
    else:
        raise ValueError(f"Unknown model name: '{model_name}'. Choose from 'unet_scratch', 'unet_mobilenetv2', 'segformer_b0'.")


def get_device(device_setting: str = "auto") -> torch.device:
    """Select best compute device: CUDA -> MPS (Apple Silicon) -> CPU."""
    if device_setting == "auto":
        if torch.cuda.is_available():
            return torch.device("cuda")
        elif hasattr(torch.backends, "mps") and torch.backends.mps.is_available():
            return torch.device("mps")
        else:
            return torch.device("cpu")
    return torch.device(device_setting)
