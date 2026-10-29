"""Loss functions for AquaMap flood segmentation."""
import torch
import torch.nn as nn
import torch.nn.functional as F


class DiceLoss(nn.Module):
    """Soft Dice Loss for binary segmentation.
    
    Dice = (2 * |P ∩ G| + smooth) / (|P| + |G| + smooth)
    Loss = 1 - Dice
    """
    def __init__(self, smooth: float = 1.0, eps: float = 1e-7):
        super().__init__()
        self.smooth = smooth
        self.eps = eps

    def forward(self, logits: torch.Tensor, targets: torch.Tensor) -> torch.Tensor:
        """
        logits: (B, 1, H, W) or (B, H, W) - unnormalized logits
        targets: (B, 1, H, W) or (B, H, W) - binary ground truth {0, 1}
        """
        if logits.dim() == 4 and targets.dim() == 3:
            targets = targets.unsqueeze(1)
        elif logits.dim() == 3 and targets.dim() == 4:
            logits = logits.unsqueeze(1)

        probs = torch.sigmoid(logits)

        # Flatten batch-wise or spatial-wise
        probs = probs.contiguous().view(probs.shape[0], -1)
        targets = targets.contiguous().view(targets.shape[0], -1)

        intersection = (probs * targets).sum(dim=1)
        cardinality = probs.sum(dim=1) + targets.sum(dim=1)

        dice = (2.0 * intersection + self.smooth) / (cardinality + self.smooth + self.eps)
        return (1.0 - dice).mean()


class CombinedBCEDiceLoss(nn.Module):
    """Combined 0.5 * BCEWithLogits + 0.5 * Dice Loss.
    
    BCE penalizes individual pixel classification errors stably.
    Dice directly optimizes spatial overlap (IoU/F1), balancing class imbalance.
    """
    def __init__(self, bce_weight: float = 0.5, dice_weight: float = 0.5, pos_weight: torch.Tensor | None = None):
        super().__init__()
        self.bce_weight = bce_weight
        self.dice_weight = dice_weight
        self.bce = nn.BCEWithLogitsLoss(pos_weight=pos_weight)
        self.dice = DiceLoss()

    def forward(self, logits: torch.Tensor, targets: torch.Tensor) -> torch.Tensor:
        if logits.dim() == 4 and targets.dim() == 3:
            targets = targets.unsqueeze(1)
        elif logits.dim() == 3 and targets.dim() == 4:
            logits = logits.unsqueeze(1)

        bce_loss = self.bce(logits, targets.float())
        dice_loss = self.dice(logits, targets.float())
        return self.bce_weight * bce_loss + self.dice_weight * dice_loss
