"""Uncertainty quantification via Test-Time Augmentation (TTA)."""
import numpy as np
import torch
import torch.nn.functional as F
from PIL import Image
import matplotlib.cm as cm


def predict_with_tta(
    model: torch.nn.Module,
    tensor_img: torch.Tensor,
    device: torch.device,
) -> tuple[np.ndarray, np.ndarray, float]:
    """Runs Test-Time Augmentation (Identity, HFlip, VFlip, Rot90).
    
    Returns:
        mean_prob: (H, W) array of ensemble probabilities [0, 1]
        std_map: (H, W) array of per-pixel standard deviations (uncertainty)
        mean_uncertainty: float mean of std_map
    """
    model.eval()
    if tensor_img.dim() == 3:
        tensor_img = tensor_img.unsqueeze(0)  # (1, 3, H, W)
    tensor_img = tensor_img.to(device)

    # Transform list: (transform_fn, inverse_fn)
    transforms = [
        (lambda x: x, lambda x: x),
        (lambda x: torch.flip(x, dims=[3]), lambda x: torch.flip(x, dims=[3])),
        (lambda x: torch.flip(x, dims=[2]), lambda x: torch.flip(x, dims=[2])),
        (lambda x: torch.rot90(x, k=1, dims=[2, 3]), lambda x: torch.rot90(x, k=-1, dims=[2, 3])),
    ]

    probs_list = []
    with torch.no_grad():
        for forward_fn, inverse_fn in transforms:
            aug_input = forward_fn(tensor_img)
            logits = model(aug_input)
            probs = torch.sigmoid(logits)
            restored = inverse_fn(probs)
            probs_list.append(restored.cpu().numpy()[0, 0])

    probs_stack = np.stack(probs_list, axis=0)  # (N, H, W)
    mean_prob = np.mean(probs_stack, axis=0)
    std_map = np.std(probs_stack, axis=0)
    mean_uncertainty = float(np.mean(std_map))

    return mean_prob, std_map, mean_uncertainty


def create_uncertainty_heatmap(std_map: np.ndarray) -> np.ndarray:
    """Renders the uncertainty map into an RGB heatmap (amber/orange to bright white)."""
    # Normalize std_map (theoretical max std for Bernoulli is 0.5)
    norm_std = np.clip(std_map / 0.5, 0.0, 1.0)
    # Using 'inferno' or 'magma' or custom amber colormap
    try:
        from matplotlib import colormaps
        colormap = colormaps["inferno"]
    except Exception:
        import matplotlib.pyplot as plt
        colormap = plt.get_cmap("inferno")
    heatmap_rgba = colormap(norm_std)
    heatmap_rgb = (heatmap_rgba[:, :, :3] * 255.0).astype(np.uint8)
    return heatmap_rgb
