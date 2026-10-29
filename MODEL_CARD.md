# Model Card: AquaMap v2 Floodwater Segmentation Engine

## 1. Model Details

- **Model Name:** AquaMap v2 Aerial Flood Segmentation Engine
- **Model Version:** 2.0.0
- **Model Types Benchmarked:**
  1. `unet_mobilenetv2`: U-Net architecture with pre-trained MobileNetV2 encoder (Default Production Model)
  2. `segformer_b0`: Lightweight Vision Transformer with `mit-b0` encoder
  3. `unet_scratch`: 4-stage symmetrical U-Net initialized with random weights (Ablation Baseline)
- **Frameworks:** PyTorch 2.x, Albumentations, ONNX Runtime 1.20+, FastAPI, Next.js 14
- **License:** Apache 2.0 / Educational Academic Use
- **Primary Contact / Author:** Aleeya (AquaMap Disaster AI Research)

---

## 2. Intended Use & Target Application

### In-Scope Use Cases
- **Post-Disaster Aerial Reconnaissance:** Automated segmentation of standing water, flooded streets, overflowed retention basins, and submerged infrastructure from drone (UAV) or high-altitude aerial photography.
- **Evacuation Corridor Risk Assessment:** Distinguishing dry passable roadways from inundated transportation arteries.
- **Temporal Flood Tracking:** Comparing pre-disaster baseline imagery with post-disaster flood passes to calculate net change in water volume and identify newly flooded vs receded ground.
- **Uncertainty-Aware Decision Support:** Highlighting low-confidence boundary predictions using Test-Time Augmentation (TTA) standard deviation heatmaps to alert human analysts.

### Out-of-Scope & Restricted Uses
- **Autonomous Unpiloted Navigation:** Must NOT be used as the sole navigational sensor for uncrewed surface vehicles or autonomous rescue vessels without human verification.
- **Nighttime or Thick Cloud Cover Operations:** Optical RGB sensors cannot penetrate clouds or operate in zero-lux night environments; Synthetic Aperture Radar (SAR Sentinel-1) must be used instead.
- **Dense Forest Sub-Canopy Detection:** Water beneath closed tree canopies is occluded in RGB imagery and will not be detected.

---

## 3. Dataset & Data Leakage Prevention

### Training Data
- **Source:** Kaggle `faizalkarim/flood-area-segmentation`
- **Total Imagery:** 290 high-resolution aerial images and corresponding binary pixel masks.
- **Water Fraction Distribution:**
  - Minimum Water Percentage: 4.25%
  - Mean Water Percentage: 40.70%
  - Maximum Water Percentage: 87.87%

### Leak-Free Split Methodology (Perceptual Hashing)
Aerial survey datasets frequently contain consecutive video frames or overlapping flight strips. Random train/test splitting causes near-identical scenes to contaminate both sets, causing severe data snooping / metric inflation.
- **Technique:** 64-bit difference hashing (`dHash`) with a Hamming distance threshold of $\le 8$.
- **Duplicate Detection:** Identified 8 exact duplicate pairs and 11 perceptual cluster groups.
- **Split Distribution:**
  - **Train:** 203 images (70%)
  - **Validation:** 43 images (15%)
  - **Test (Unseen):** 44 images (15%)
  - **Contamination Guarantee:** All duplicate variants within a cluster were strictly confined to a single split partition.

---

## 4. Quantitative Scientific Benchmark

All models were evaluated on the held-out 44-image test split using their optimal validation F1 thresholds:

| Model Architecture | Backbone | Parameters | Test IoU | Test Dice | Precision | Recall | Accuracy | Latency (MPS) | Latency (ONNX CPU) |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **SegFormer-B0** | `mit-b0` Transformer | 3.7M | **0.7932** | **0.8847** | 0.8773 | **0.8922** | 0.9021 | **73.1 ms** | — |
| **U-Net MobileNetV2** | `mobilenet_v2` | 6.6M | 0.7922 | 0.8840 | **0.8869** | 0.8812 | **0.9027** | 85.1 ms | **30.9 ms** |
| **U-Net Scratch** | Custom CNN | 7.8M | 0.7252 | 0.8407 | 0.8505 | 0.8311 | 0.8674 | 84.9 ms | — |

### Key Scientific Findings
1. **Transfer Learning Advantage:** Transferring ImageNet-1k pre-trained weights (`unet_mobilenetv2`) yields a **+4.33 percentage point increase in Dice score** (0.8840 vs 0.8407) compared to training from scratch, proving that pre-trained low-level edge and texture filters are critical for small aerial datasets.
2. **Attention vs Convolution:** `segformer_b0` achieves the highest recall (0.8922) due to self-attention capturing broad contextual connectivity across winding river channels. However, `unet_mobilenetv2` achieves higher boundary precision (0.8869) due to lateral skip connections preserving high-frequency edge gradients.
3. **ONNX Optimization:** Exporting `unet_mobilenetv2` to ONNX Runtime achieves a **2.58x CPU acceleration** (30.9ms vs 79.8ms PyTorch CPU) with numerical bit-level parity ($< 1.41 \times 10^{-5}$ max difference).

---

## 5. Uncertainty Quantification & Explainability

### Test-Time Augmentation (TTA)
- **Method:** 4-pass geometric ensemble during inference (Identity, Horizontal Flip, Vertical Flip, Diagonal Transpose).
- **Metric:** Standard deviation $\sigma(x, y)$ computed across de-augmented probability predictions:
  $$\sigma = \sqrt{\frac{1}{K}\sum_{k=1}^K (p_k - \bar{p})^2}$$
- **Interpretation:** Deep water interiors exhibit low variance ($\sigma < 0.05$). Shallow marsh margins, muddy sediment boundaries, and partial tree shadows exhibit elevated variance ($\sigma > 0.25$), providing calibrated spatial confidence bounds to emergency dispatchers.

### Grad-CAM Spatial Explainability
- **Method:** Backpropagation of the predicted water score into the feature maps of the final convolutional decoder block ($D_1$).
- **Output:** Colormap heatmap highlighting spatial regions that contributed positively to the segmentation decision, providing transparent verification for viva examiners and forensic audits.

---

## 6. Environmental Robustness Stress-Testing

Models were subjected to 5 synthetic environmental corruptions across 3 severity levels:

| Environmental Corruption | Mild Dice | Moderate Dice | Severe Dice | Retention % (Severe) |
| :--- | :--- | :--- | :--- | :--- |
| **Baseline (Clean)** | 0.8840 | 0.8840 | 0.8840 | 100.0% |
| **Gaussian Blur** | 0.8781 | 0.8614 | 0.8240 | 93.2% |
| **Darkness / Cloud Cover** | 0.8792 | 0.8680 | 0.8412 | 95.2% |
| **Gaussian Sensor Noise** | 0.8690 | 0.8451 | 0.7963 | 90.1% |
| **JPEG Compression** | 0.8812 | 0.8740 | 0.8591 | 97.2% |
| **Fog / Haze Simulation**| 0.8724 | 0.8521 | 0.8150 | 92.2% |

---

## 7. Known Failure Modes & Mitigation

1. **High Sediment Turbidity:** Extremely muddy water matching the color profile of surrounding saturated soil can cause localized under-segmentation.
   - *Mitigation:* TTA uncertainty maps flag these regions with high variance.
2. **Dense Cloud Shadows on Dark Asphalt:** Wet roads obscured by cloud shadows can occasionally trigger false positives.
   - *Mitigation:* The optimal sigmoid threshold (0.45) balances precision and recall to suppress shadow noise.
3. **Specular Sun Glint:** Direct solar reflection off calm water creates white hot spots.
   - *Mitigation:* Albumentations ColorJitter and RandomBrightnessContrast augmentations applied during training prevent saturation bias.

