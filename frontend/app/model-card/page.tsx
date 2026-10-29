import Link from "next/link";

export default function ModelCardPage() {
  return (
    <div className="container-landing py-12">
      <div style={{ maxWidth: 760, margin: "0 auto" }} className="space-y-10">
        {/* Header */}
        <div>
          <p className="text-label mb-2">Responsible AI</p>
          <h1 className="text-h2" style={{ color: "var(--text)" }}>Model Card — HydroVision</h1>
          <p className="text-body mt-3" style={{ color: "var(--text-2)" }}>
            A model card documents the intended use, limitations, and ethical considerations for a machine learning model.
            Following practice from{" "}
            <Link
              href="https://arxiv.org/abs/1810.03993"
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: "var(--link)" }}
              className="hover:underline"
            >
              Mitchell et al. (2019)
            </Link>
            .
          </p>
        </div>

        {[
          {
            heading: "Model details",
            content: (
              <ul className="space-y-2 text-body" style={{ color: "var(--text-2)" }}>
                <li><strong style={{ color: "var(--text)" }}>Name:</strong> HydroVision — U-Net MobileNetV2</li>
                <li><strong style={{ color: "var(--text)" }}>Version:</strong> 2.0 (research prototype)</li>
                <li><strong style={{ color: "var(--text)" }}>Type:</strong> Binary semantic segmentation (water / non-water), pixel-level</li>
                <li><strong style={{ color: "var(--text)" }}>Architecture:</strong> U-Net decoder with MobileNetV2 encoder pre-trained on ImageNet-1k</li>
                <li><strong style={{ color: "var(--text)" }}>Input:</strong> RGB aerial or drone image, resized to 256×256</li>
                <li><strong style={{ color: "var(--text)" }}>Output:</strong> Binary mask (water = 1, non-water = 0) + uncertainty map (TTA std dev)</li>
                <li>
                  <strong style={{ color: "var(--text)" }}>Dataset:</strong>{" "}
                  <Link
                    href="https://www.kaggle.com/datasets/faizalkarim/flood-area-segmentation"
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ color: "var(--link)" }}
                    className="hover:underline"
                  >
                    Flood Area Segmentation by Faizal Karim (Kaggle)
                  </Link>
                  {" "}— 290 RGB aerial images with binary water masks
                </li>
              </ul>
            ),
          },
          {
            heading: "Intended use",
            content: (
              <div className="space-y-3 text-body" style={{ color: "var(--text-2)" }}>
                <p>HydroVision is designed for:</p>
                <ul className="list-disc list-inside space-y-1 pl-2">
                  <li>Research and education in aerial image segmentation and flood mapping.</li>
                  <li>Rapid visual screening of drone or satellite RGB imagery to identify approximate water coverage.</li>
                  <li>Demonstrating explainability techniques (TTA uncertainty, Grad-CAM) in computer vision.</li>
                </ul>
              </div>
            ),
          },
          {
            heading: "Out-of-scope use",
            content: (
              <div className="space-y-3">
                <div
                  className="rounded-xl px-4 py-3 text-sm"
                  style={{ background: "rgba(248,113,113,0.08)", border: "1px solid rgba(248,113,113,0.25)", color: "var(--alert)" }}
                >
                  <strong>HydroVision must not be used for:</strong>
                </div>
                <ul className="list-disc list-inside space-y-1 pl-2 text-body" style={{ color: "var(--text-2)" }}>
                  <li>Any safety-critical or emergency-response decision (e.g., evacuation routing, infrastructure risk assessment).</li>
                  <li>Official or legal flood mapping products.</li>
                  <li>Night-time imagery, SAR/radar imagery, or any non-RGB modality.</li>
                  <li>Real-time operational flood monitoring without human review of each prediction.</li>
                </ul>
              </div>
            ),
          },
          {
            heading: "Training and evaluation",
            content: (
              <ul className="space-y-2 text-body" style={{ color: "var(--text-2)" }}>
                <li><strong style={{ color: "var(--text)" }}>Split:</strong> 203 train / 43 val / 44 test (leakage-controlled via perceptual hash grouping)</li>
                <li><strong style={{ color: "var(--text)" }}>Loss:</strong> 0.5 × BCE + 0.5 × Dice</li>
                <li><strong style={{ color: "var(--text)" }}>Optimizer:</strong> Adam, lr = 1e-4, 50 epochs</li>
                <li><strong style={{ color: "var(--text)" }}>Test Dice:</strong> 0.8840</li>
                <li><strong style={{ color: "var(--text)" }}>Test IoU:</strong> 0.7922</li>
                <li><strong style={{ color: "var(--text)" }}>Precision:</strong> 0.8869 · <strong style={{ color: "var(--text)" }}>Recall:</strong> 0.8812</li>
                <li><strong style={{ color: "var(--text)" }}>ONNX inference latency:</strong> 30.96 ms (±0.80 ms) on CPU (same device as PyTorch 79.83 ms)</li>
              </ul>
            ),
          },
          {
            heading: "Limitations and failure modes",
            content: (
              <ul className="list-disc list-inside space-y-2 pl-2 text-body" style={{ color: "var(--text-2)" }}>
                <li><strong style={{ color: "var(--text)" }}>Modality:</strong> RGB only. Cannot see through cloud, canopy, or in darkness (unlike SAR Sentinel-1).</li>
                <li><strong style={{ color: "var(--text)" }}>Turbid water:</strong> Highly silt-laden floodwater (brown-orange) may be misclassified as dry soil.</li>
                <li><strong style={{ color: "var(--text)" }}>Shadows:</strong> Building and tree shadows share a similar appearance to shallow water.</li>
                <li><strong style={{ color: "var(--text)" }}>Urban surfaces:</strong> Wet asphalt and metal rooftops can trigger false positives.</li>
                <li><strong style={{ color: "var(--text)" }}>Scale:</strong> Tested only on the Kaggle dataset distribution. Performance on other geographic regions is unverified.</li>
              </ul>
            ),
          },
          {
            heading: "Uncertainty quantification",
            content: (
              <p className="text-body" style={{ color: "var(--text-2)" }}>
                Test-Time Augmentation (TTA) applies 4 geometric transforms (identity, H-flip, V-flip, transpose),
                runs inference on each, and computes the pixel-wise standard deviation. High-uncertainty regions
                (&gt;0.25 std dev) should be reviewed by a human analyst. This does not constitute a calibrated
                probability; it is an empirical confidence signal.
              </p>
            ),
          },
          {
            heading: "Ethical considerations",
            content: (
              <ul className="list-disc list-inside space-y-2 pl-2 text-body" style={{ color: "var(--text-2)" }}>
                <li>Flood mapping errors can affect disaster response decisions. Human review is always required.</li>
                <li>The model was trained on one dataset from one geographic context. Bias toward that context is expected.</li>
                <li>HydroVision is a research prototype and is provided as-is, with no warranty of fitness for any purpose.</li>
              </ul>
            ),
          },
          {
            heading: "Citation and credits",
            content: (
              <ul className="space-y-2 text-body" style={{ color: "var(--text-2)" }}>
                <li>
                  <strong style={{ color: "var(--text)" }}>Dataset:</strong>{" "}
                  Faizal Karim, <em>Flood Area Segmentation</em>, Kaggle, 2022.{" "}
                  <Link href="https://www.kaggle.com/datasets/faizalkarim/flood-area-segmentation" target="_blank" rel="noopener noreferrer" style={{ color: "var(--link)" }} className="hover:underline">
                    Link
                  </Link>
                </li>
                <li>
                  <strong style={{ color: "var(--text)" }}>Architecture:</strong>{" "}
                  Ronneberger et al., "U-Net: Convolutional Networks for Biomedical Image Segmentation", MICCAI 2015.
                </li>
                <li>
                  <strong style={{ color: "var(--text)" }}>Encoder:</strong>{" "}
                  Sandler et al., "MobileNetV2: Inverted Residuals and Linear Bottlenecks", CVPR 2018.
                </li>
                <li>
                  <strong style={{ color: "var(--text)" }}>Model card format:</strong>{" "}
                  Mitchell et al., "Model Cards for Model Reporting", FAccT 2019.
                </li>
              </ul>
            ),
          },
        ].map((section) => (
          <section
            key={section.heading}
            className="rounded-xl p-6 space-y-4"
            style={{ border: "1px solid var(--border)", background: "var(--surface-1)" }}
          >
            <h2 className="text-h3" style={{ color: "var(--text)" }}>{section.heading}</h2>
            <div>{section.content}</div>
          </section>
        ))}

        {/* Back link */}
        <div className="text-center pt-4 pb-12">
          <Link href="/" className="text-sm hover:underline" style={{ color: "var(--link)" }}>
            ← Back to HydroVision
          </Link>
        </div>
      </div>
    </div>
  );
}

