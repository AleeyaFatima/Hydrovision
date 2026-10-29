# AquaMap 3-Model Benchmark Comparison

Evaluation conducted strictly on the unseen **test split**.

| Model | Architecture | IoU | Dice / F1 | Precision | Recall | Pixel Acc | Latency (Mean) |
|---|---|---|---|---|---|---|---|
| **segformer_b0** | best_segformer_b0.pth | 0.7932 | 0.8847 | 0.8773 | 0.8922 | 0.9021 | 73.1 ms |
| **unet_mobilenetv2** | best_unet_mobilenetv2.pth | 0.7922 | 0.8840 | 0.8869 | 0.8812 | 0.9027 | 85.1 ms |
| **unet_scratch** | best_unet_scratch.pth | 0.7252 | 0.8407 | 0.8505 | 0.8311 | 0.8674 | 84.9 ms |

## Key Observations & Viva Notes
- **Transfer Learning Advantage:** MobileNetV2 pretrained on ImageNet converges faster and extracts superior low-level edge features for water boundaries.
- **Recall vs Precision:** In flood response, high Recall is critical (minimizing false negatives / missed flood zones).
- **Transformer vs CNN:** SegFormer captures global contextual dependencies across the landscape via self-attention.
