"""Unit tests for Dice and combined BCE+Dice losses."""
import torch
import pytest
from app.losses import DiceLoss, CombinedBCEDiceLoss


def test_dice_loss_bounds():
    loss_fn = DiceLoss()
    logits = torch.randn(2, 1, 32, 32)
    targets = torch.randint(0, 2, (2, 1, 32, 32)).float()
    loss = loss_fn(logits, targets)
    assert 0.0 <= loss.item() <= 1.0


def test_combined_loss():
    loss_fn = CombinedBCEDiceLoss(bce_weight=0.5, dice_weight=0.5)
    logits = torch.zeros(2, 1, 16, 16, requires_grad=True)
    targets = torch.ones(2, 1, 16, 16)
    loss = loss_fn(logits, targets)
    assert loss.item() > 0.0
    loss.backward()
    assert logits.grad is not None
