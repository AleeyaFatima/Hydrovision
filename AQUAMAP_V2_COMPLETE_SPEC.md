# AquaMap v2 — Complete Project Specification (Upgraded Edition)

> **To the coding agent (Antigravity):** You are the lead full-stack AI engineer on AquaMap. This file replaces any earlier AquaMap spec. Read the whole file before writing code. Build in the phase order of Section 14, verify each phase, and obey the rules in Section 15.
>
> **To Aleeya (the student):** Every major feature has a short **🎓 Learn** note explaining what it is, why it impresses an examiner, and what to say about it in your viva. Read those notes as you build; they are your study guide.

---

## 0. What changed from v1 (and why)

Your instructor said the idea is good but needs more depth. v1 was "train a model + show a website". v2 turns AquaMap into a **trustworthy, explainable, optimized AI system** — that is what "advanced" really means in AI engineering. Concretely, v2 adds:

| Upgrade | What it adds | Why it stands out |
|---|---|---|
| **Model benchmark (3 models)** | Scratch U-Net vs MobileNetV2 U-Net vs SegFormer | Shows scientific comparison, not one lucky model |
| **Uncertainty map** | Per-pixel "how sure is the model" heatmap | Most student projects only show a prediction; you show *confidence* |
| **Explainability (Grad-CAM)** | Heatmap of what the network looked at | Explainable AI (XAI) is a hot, examinable topic |
| **Flood change detection** | Compare a before and after image | Turns segmentation into a real decision tool |
| **Robustness stress test** | Accuracy under blur, darkness, noise, JPEG compression | Proves you tested failure, not just success |
| **ONNX optimization** | Export + faster inference, measured | Real deployment engineering |
| **Analysis report** | Downloadable PDF per analysis | Feels like a real product |
| **Docker + CI** | One-command run, automatic tests on GitHub | Professional software engineering |
| **Model card** | Honest documentation of data, limits, metrics | Responsible AI practice |
| **Cinematic landing page** | Watermelon UI blocks + Motion scroll storytelling + 3D Earth | First impression for the examiner |

### Corrections to earlier notes
- **"ANN" vs U-Net:** U-Net is a **Convolutional Neural Network (CNN)**, and a CNN is a type of Artificial Neural Network. Say: *"AquaMap uses a CNN-based ANN called U-Net for semantic segmentation."*
- **AquaMap is flood segmentation**, not water-quality prediction. One earlier note mixed these up; ignore the water-quality material.
- **"30% water" = 30% of image pixels**, not 30% of land area. Real area needs georeferenced, calibrated imagery.
- **The dataset is small (~290 images).** Don't promise a specific accuracy. Report what the test set actually gives and explain the limits honestly — examiners respect that far more than inflated numbers.
- **No fake content on the landing page.** No invented testimonials, users, partners or statistics. Every number either comes from your own model runs or has a cited source.

---

## 1. Product overview

**AquaMap — AI floodwater segmentation from aerial imagery.**

1. The user lands on a cinematic 3D landing page that explains the project through scroll animations.
2. In the **Analyze** workspace, they upload an aerial/drone image (or pick a sample).
3. The model returns: the water mask, a colored overlay, water-pixel %, an **uncertainty map**, a **Grad-CAM explanation**, and the inference time.
4. In **Compare** mode, they upload a before and an after image and see the change in water coverage.
5. The **Performance** page shows real test metrics, the 3-model benchmark, and the robustness results.
6. Any analysis can be downloaded as a **PDF report**.

AquaMap is a **screening / decision-support tool**, not an official flood assessment. Show this disclaimer in the UI.

---

## 2. Technology stack

| Layer | Technology |
|---|---|
| Frontend | Next.js (App Router), React, TypeScript |
| Styling | Tailwind CSS v4 |
| UI blocks/components | **Watermelon UI** (via shadcn CLI and Watermelon MCP) |
| Animation | **Motion** (`motion` package, import from `motion/react`) |
| 3D | Three.js, React Three Fiber, Drei |
| Charts | Recharts (or Watermelon chart/dashboard components if suitable) |
| AI | Python 3.10+, PyTorch, `segmentation-models-pytorch`, Hugging Face `transformers` (SegFormer) |
| Augmentation | Albumentations |
| Explainability | `grad-cam` (pytorch-grad-cam) |
| Optimization | ONNX, ONNX Runtime |
| Image processing | Pillow, NumPy, OpenCV |
| Dataset download | `kagglehub` (primary), Kaggle CLI (fallback) |
| API | FastAPI + Uvicorn |
| Reports | ReportLab (PDF) |
| Tracking | MLflow |
| Testing | pytest, Vitest / Playwright |
| DevOps | Docker, docker-compose, GitHub Actions |
| Deployment | Vercel (frontend), Render / Railway / Hugging Face Spaces (backend) |

---

## 3. Repository structure

If a repository already exists, **inspect it and preserve its structure**, adding what's missing. Otherwise scaffold:

```text
AquaMap/
├── README.md
├── MODEL_CARD.md
├── AQUAMAP_V2_COMPLETE_SPEC.md
├── docker-compose.yml
├── .github/workflows/ci.yml
├── frontend/
│   ├── app/
│   │   ├── page.tsx                 # landing page
│   │   ├── analyze/page.tsx         # single-image workspace
│   │   ├── compare/page.tsx         # before/after change detection
│   │   └── performance/page.tsx     # metrics, benchmark, robustness
│   ├── components/
│   │   ├── landing/                 # hero, scroll story, bento, stats, faq, cta
│   │   ├── three/                   # Earth scene + non-WebGL fallback
│   │   ├── analysis/                # uploader, compare slider, layer toggles, stats
│   │   ├── motion/                  # shared Motion variants & wrappers
│   │   └── ui/                      # Watermelon / shadcn components
│   ├── lib/api.ts
│   ├── public/samples/              # test-set sample images
│   └── .env.local.example
└── backend/
    ├── Dockerfile
    ├── requirements.txt
    ├── .env.example
    ├── scripts/
    │   ├── download_dataset.py
    │   └── verify_dataset.py
    ├── app/
    │   ├── main.py
    │   ├── config.py
    │   ├── dataset.py
    │   ├── transforms.py
    │   ├── models.py
    │   ├── losses.py
    │   ├── metrics.py
    │   ├── train.py
    │   ├── evaluate.py
    │   ├── robustness.py
    │   ├── uncertainty.py
    │   ├── explain.py
    │   ├── export_onnx.py
    │   ├── inference.py
    │   └── report.py
    ├── data/        # git-ignored
    ├── models/      # git-ignored
    ├── reports/
    └── tests/
```

Git-ignore: `data/`, `models/`, `mlruns/`, `.venv/`, `node_modules/`, `.env`, `kaggle.json`.

---

## 4. Dataset — real Kaggle data

### 4.1 Flood Area Segmentation (primary)

- **URL:** https://www.kaggle.com/datasets/faizalkarim/flood-area-segmentation
- **Handle:** `faizalkarim/flood-area-segmentation`
- **Contents:** ~290 real flood-scene aerial/drone RGB images with hand-annotated binary water masks.

| Item | Contains | Role in AquaMap |
|---|---|---|
| `Image/` | Flood photos (`.jpg`) | Model **input** |
| `Mask/` | `.png` masks (white ≈ water, black = background) | **Ground truth** the model learns from and is scored against |
| `metadata.csv` | Image → mask mapping | Correct pairing |

How each split is used: **train** teaches the model, **validation** chooses the best epoch, threshold and model, and **test** produces the final honest numbers for the Performance page. A few test images go into `frontend/public/samples/` for the demo.

> 🎓 **Learn:** *Ground truth* means the human-drawn correct answer. The model never sees test images during training, so test scores show how it handles new images. That's called **generalization**.

### 4.2 Kaggle credentials (the student does this once)

1. kaggle.com → **Settings** → **API** → **Create New Token**. This downloads `kaggle.json`.
2. Save it to `C:\Users\<you>\.kaggle\kaggle.json` (Windows) or `~/.kaggle/kaggle.json` (macOS/Linux, then `chmod 600`).
3. Or put `KAGGLE_USERNAME` and `KAGGLE_KEY` in `backend/.env` (git-ignored).

Never commit or print credentials. On a 401/403 error, tell the user to check the token and accept the dataset's terms on its Kaggle page.

### 4.3 `backend/scripts/download_dataset.py`

```python
"""Download Flood Area Segmentation from Kaggle into backend/data/."""
import shutil
import subprocess
import sys
from pathlib import Path

DATASET = "faizalkarim/flood-area-segmentation"
DATA_DIR = Path(__file__).resolve().parents[1] / "data"


def via_kagglehub() -> Path:
    import kagglehub
    return Path(kagglehub.dataset_download(DATASET))


def via_cli() -> Path:
    raw = DATA_DIR / "_raw"
    raw.mkdir(parents=True, exist_ok=True)
    subprocess.run(["kaggle", "datasets", "download", "-d", DATASET,
                    "-p", str(raw), "--unzip"], check=True)
    return raw


def find_dir(root: Path, name: str) -> Path:
    for p in root.rglob("*"):
        if p.is_dir() and p.name.lower() == name.lower():
            return p
    raise FileNotFoundError(f"No '{name}' folder under {root}")


def main() -> None:
    try:
        src = via_kagglehub()
    except Exception as e:  # noqa: BLE001
        print(f"kagglehub failed ({e}); trying Kaggle CLI...", file=sys.stderr)
        src = via_cli()
    DATA_DIR.mkdir(parents=True, exist_ok=True)
    for folder in ("Image", "Mask"):
        dst = DATA_DIR / folder
        if dst.exists():
            shutil.rmtree(dst)
        shutil.copytree(find_dir(src, folder), dst)
    meta = next(src.rglob("metadata.csv"), None)
    if meta:
        shutil.copy(meta, DATA_DIR / "metadata.csv")
    print(f"Done: {len(list((DATA_DIR/'Image').iterdir()))} images, "
          f"{len(list((DATA_DIR/'Mask').iterdir()))} masks")


if __name__ == "__main__":
    main()
```

```bash
cd backend
python scripts/download_dataset.py
python scripts/verify_dataset.py
```

### 4.4 `verify_dataset.py` must

1. Pair images and masks via `metadata.csv` (fallback: filename stem). Report unmatched or corrupt files.
2. Report unique mask values and confirm the binarization `mask > 127`.
3. Report the image-size distribution and the water fraction per image (min / mean / max).
4. Find exact duplicates (hash) and near-duplicates (`imagehash`), and group them so each group stays inside one split.
5. Save `reports/dataset_preview.png`, a 12-sample grid of image / mask / overlay.
6. Exit non-zero if pairing is broken.

### 4.5 Optional extra data (only after everything else works)

**Sen1Floods11** (https://github.com/cloudtostreet/Sen1Floods11) holds satellite flood labels. It's hosted on GitHub/Google Cloud, not Kaggle, and it's multi-band, so it needs a separate pipeline. Before using any other Kaggle dataset, open its page and confirm the exact handle, licence and mask format. Never invent dataset handles.

---

## 5. Preprocessing and splits

- Resize to **256×256**. Masks use nearest-neighbour interpolation.
- Normalize with ImageNet mean/std, and use exactly the same normalization at inference.
- Binarize masks to {0,1}, shape 1×H×W, float32.
- Split **70/15/15** with seed 42, keeping near-duplicate groups in the same split. Save the split to `data/splits.json`.
- Training-only augmentation (Albumentations, applied jointly to image and mask): flips, random rotate 90, light shift-scale-rotate, random resized crop, brightness/contrast, mild hue/saturation.

> 🎓 **Learn:** *Data leakage* happens when near-identical images land in both train and test, so the model "recognizes" test images instead of truly learning. Grouping duplicates prevents this. Mention it in your viva; it shows maturity.

---

## 6. Models — the 3-model benchmark

| `--model` | Architecture | Role |
|---|---|---|
| `unet_scratch` | `smp.Unet(encoder_name="mobilenet_v2", encoder_weights=None, classes=1)` | Baseline (no pretraining) |
| `unet_mobilenetv2` | `smp.Unet("mobilenet_v2", encoder_weights="imagenet", classes=1)` | **Primary model** (transfer learning) |
| `segformer_b0` | Hugging Face SegFormer `nvidia/mit-b0`, fine-tuned for 1 class; upsample logits to input size | Transformer-based comparison |

All three are trained with the same split, augmentation, loss and epochs budget, so the comparison is fair. The production model is chosen by **validation Dice**, never by test score.

> 🎓 **Learn:**
> - **U-Net**: an encoder shrinks the image into features, a decoder grows it back into a mask, and **skip connections** pass fine details across so water edges stay sharp.
> - **Transfer learning**: MobileNetV2 already learned edges and textures from ImageNet (millions of images). We fine-tune it, which helps when our dataset is small.
> - **SegFormer**: uses **self-attention** (the transformer idea) to look at the whole image at once, not just local patches.
> - Comparing all three with the same setup is called an **ablation / benchmark study**, and it's the core of a scientific project.

---

## 7. Training and evaluation

### 7.1 Training

```bash
python -m app.train --model unet_scratch     --epochs 40 --batch-size 8 --img-size 256 --lr 1e-3
python -m app.train --model unet_mobilenetv2 --epochs 40 --batch-size 8 --img-size 256 --lr 1e-4
python -m app.train --model segformer_b0     --epochs 40 --batch-size 8 --img-size 256 --lr 6e-5
```

| Setting | Value |
|---|---|
| Optimizer | AdamW |
| Scheduler | ReduceLROnPlateau on val Dice |
| Loss | 0.5 × BCEWithLogits + 0.5 × Dice loss |
| Early stopping | patience 8 (val Dice) |
| Mixed precision | on with CUDA |
| Device | auto: CUDA → MPS → CPU |
| Seed | 42 everywhere |

Each checkpoint (`models/best_<model>.pth`) stores the weights, model name, image size, normalization, best validation threshold and git commit. Copy the chosen model to `models/best_model.pth`.

If the user has no GPU, create `notebooks/train_colab.ipynb`. It should download the data with `kagglehub` (credentials from Colab Secrets), train all three models, and let the user download the checkpoints and MLflow runs.

> 🎓 **Learn:** **Dice loss** directly rewards overlap between predicted and true water, which helps when water covers only part of the image. **BCE** scores each pixel separately. Combining the two gives stable training *and* good overlap.

### 7.2 MLflow

Log params, per-epoch loss, IoU, Dice and learning rate, plus the best checkpoint and sample predictions as artifacts. View them with `mlflow ui --backend-store-uri backend/mlruns`. Screenshot the run comparison for the report.

### 7.3 Evaluation (`app/evaluate.py`)

On the **test split only**, compute IoU, Dice/F1, Precision, Recall, Pixel Accuracy, a confusion matrix, and the mean/p95 latency (record the device). Write `reports/metrics_<model>.json` and `reports/model_comparison.md`. Save the best and worst predictions to `reports/examples/`, and write a short error analysis (e.g. "fails on shadows / dark rooftops / muddy water").

> 🎓 **Learn:** **IoU** = overlap ÷ union of predicted and true water. **Precision** = of the pixels we called water, how many really were. **Recall** = of the real water pixels, how many we found. In flood response, low recall (missed water) is usually the more dangerous error.

---

## 8. Advanced features (the "stand out" layer)

### 8.1 Uncertainty map (`app/uncertainty.py`)
Use **test-time augmentation (TTA)**. Predict on the original image plus its horizontal flip, vertical flip and 90° rotations, undo each transform, and then:
- the **mean** probability is the final, more stable mask;
- the **per-pixel standard deviation** is the uncertainty map (bright = unsure).

Return the mean uncertainty value and the uncertainty heatmap PNG. Also measure on the test set whether high-uncertainty pixels are more often wrong, and report it.

> 🎓 **Learn:** A model that says *"I'm unsure here"* is far more useful to a flood responder than one that is silently wrong. This is called **uncertainty quantification**.

### 8.2 Explainability — Grad-CAM (`app/explain.py`)
Use `pytorch-grad-cam` with its `SemanticSegmentationTarget` on the water class, targeting a late encoder/decoder layer of the U-Net. Return the Grad-CAM heatmap overlay. Only the U-Net models need it.

> 🎓 **Learn:** Grad-CAM uses gradients to highlight which regions most influenced the prediction. It's **Explainable AI (XAI)**: you can show the model is looking at water, not at sky or roads.

### 8.3 Flood change detection (`/compare` endpoint and page)
The user uploads a **before** and an **after** image of the same area from a similar viewpoint. Segment both, resize to a common size, and report:
- water % before, water % after, and the change in percentage points;
- a change mask: **new water** (after AND NOT before) in red, **receded water** in green.

Show a clear note that the images must be roughly aligned. Optionally align them with OpenCV ORB feature matching + homography, and report whether the alignment succeeded.

> 🎓 **Learn:** This turns a single prediction into **change analysis**, which is how real disaster-monitoring systems work.

### 8.4 Robustness stress test (`app/robustness.py`)
Re-evaluate the test set with corruptions at 3 severities each: Gaussian blur, darkness (brightness ↓), Gaussian noise, JPEG compression, fog/haze (Albumentations `RandomFog`). Save `reports/robustness_<model>.json` and show it as a chart on the Performance page.

> 🎓 **Learn:** Real drone images are blurry, dark or compressed. Testing under these conditions is called **robustness evaluation** and shows you understand real-world deployment.

### 8.5 ONNX optimization (`app/export_onnx.py`)
Export the production model to ONNX with a dynamic batch size, check that its outputs match PyTorch (max abs diff < 1e-4), and benchmark PyTorch vs ONNX Runtime latency on CPU. Save the results to `reports/onnx_benchmark.json`. The API can serve the ONNX model via `INFERENCE_BACKEND=onnx`.

> 🎓 **Learn:** ONNX is a standard model format that runs fast on many devices. It's how models get **deployed efficiently**.

*Stretch only:* run the ONNX model in the browser with `onnxruntime-web` as an "offline mode".

### 8.6 PDF analysis report (`app/report.py`)
Build it with ReportLab. Include the original image, the overlay, the uncertainty and Grad-CAM images, water %, mean uncertainty, model name, timestamp, and the disclaimer.

### 8.7 Model card (`MODEL_CARD.md`)
Cover the intended use, out-of-scope use, the dataset and its limits, the training setup, test metrics, robustness results, known failure cases, and ethical notes.

---

## 9. Backend API (FastAPI)

| Method | Route | Returns |
|---|---|---|
| GET | `/health` | `status, model_loaded, model_name, device, inference_backend` |
| POST | `/predict` | multipart `file`, optional `explain=true`, `uncertainty=true` |
| POST | `/compare` | multipart `before`, `after` |
| POST | `/report` | the same input as `/predict` → PDF file |
| GET | `/metrics` | all `metrics_*.json`, `robustness_*.json`, `onnx_benchmark.json`; 404 if absent |
| GET | `/samples` | list of sample images |

`/predict` response:

```json
{
  "mask_png_base64": "...",
  "overlay_png_base64": "...",
  "uncertainty_png_base64": "... (if requested)",
  "gradcam_png_base64": "... (if requested)",
  "water_pixel_percentage": 31.4,
  "mean_uncertainty": 0.06,
  "threshold": 0.5,
  "inference_ms": 42.7,
  "model_name": "unet_mobilenetv2",
  "image_size": [1024, 768]
}
```

Rules:
- Load the model once at startup.
- With no checkpoint, `/health` shows `model_loaded:false` and `/predict` returns **503** with a clear message. Never return fake output.
- Validate the MIME type, actually decode the image, and cap uploads at 10 MB. Bad files get 400.
- Resize outputs back to the original image size.
- CORS allows `http://localhost:3000` in development and the Vercel domain from an env var in production, with no wildcard.
- Use Pydantic models; docs live at `/docs`.

---

## 10. Frontend — design and animation specification

### 10.1 Design direction: "Mission Control for Floods"

A cinematic, scientific, climate-tech look:
- **Palette (CSS tokens on `:root`):** `--bg` deep navy `#050B18`, `--surface` `#0B1626`, glass panels `rgba(255,255,255,0.04)` with a 1px `rgba(255,255,255,0.08)` border and backdrop blur, `--accent` electric cyan `#22D3EE`, `--accent-2` deep water blue `#2563EB`, `--danger` flood-alert coral `#FB7185` (new water, warnings), `--ok` `#34D399` (receded water), text `#E6EEF8` / muted `#8AA0B8`.
- **Typography:** "Space Grotesk" for headings, "Inter" for body, "JetBrains Mono" for metrics and numbers (via `next/font/google`).
- **Texture:** a subtle grid / topographic-contour background pattern and a soft cyan radial glow behind the hero. Use restraint, with one strong visual moment per section.
- **Mask colour language (consistent everywhere):** water = cyan, uncertainty = amber→white heat, Grad-CAM = standard jet/inferno, new water = coral, receded = green.

### 10.2 Getting Watermelon UI components (do it the reliable way)

1. Initialize shadcn in `frontend/`:
   ```bash
   npx shadcn@latest init
   ```
2. **Preferred:** connect the Watermelon MCP server in Antigravity's MCP settings:
   - URL: `https://mcp.watermelon.sh/mcp` (HTTP transport, no API key)
   - Use its tools (`search`, `get_inspiration`, `get_component`, `compose_page`, `list_categories`) to find real blocks and get their install commands.
3. **Fallback:** browse the category pages and copy each block's exact install command (format: `npx shadcn@latest add https://registry.watermelon.sh/r/<name>.json`):
   - Navbars: https://ui.watermelon.sh/blocks/navigation
   - Heroes: https://ui.watermelon.sh/blocks/hero
   - Features: https://ui.watermelon.sh/blocks/feature
   - Bento grids: https://ui.watermelon.sh/blocks/bento
   - Stats: https://ui.watermelon.sh/blocks/stats
   - FAQ: https://ui.watermelon.sh/blocks/faq
   - CTA: https://ui.watermelon.sh/blocks/cta
   - Footers: https://ui.watermelon.sh/blocks/footer
   - Animated components: https://ui.watermelon.sh/animated-components
   - Full template for reference: https://ui.watermelon.sh/template/landing-01
4. **Never invent component names.** Pick a real block, install it, then restyle it to the AquaMap tokens. **Skip pricing and testimonial blocks**, because they'd mean fake content.

### 10.3 Motion setup

```bash
npm install motion
```

Import from `motion/react`. Create `components/motion/variants.ts` with shared variants (`fadeUp`, `staggerContainer`, `scaleIn`) and timings (ease `[0.22, 1, 0.36, 1]`, durations 0.4–0.8s) so every animation feels consistent.

Which Motion feature goes where:

| Motion feature | Use in AquaMap |
|---|---|
| `whileInView` + `viewport={{ once: true }}` | Section entrance reveals |
| `staggerChildren` variants | Hero headline words, bento cards, metric cards |
| `useScroll` + `useTransform` | Navbar shrink/blur, scroll-driven mask reveal, pipeline storytelling |
| `useSpring` | Smooth the scroll values; magnetic CTA button |
| `useInView` + `animate()` | Count-up numbers in stats and metrics |
| `AnimatePresence` | Upload → analyzing → result state transitions; toast errors |
| `layout` / `layoutId` | Layer toggle pills (Overlay / Mask / Uncertainty / Grad-CAM) with a sliding active indicator |
| `useReducedMotion` | Disable scroll effects and 3D rotation for users who prefer reduced motion |
| `LazyMotion` + `domAnimation` | Keep the bundle small |

Animate only `transform`, `opacity` and `clip-path`; never animate layout-heavy properties in loops.

### 10.4 Landing page (`/`) — section by section

1. **Navbar** (Watermelon navigation block). Transparent at the top; on scroll it becomes a glass bar with blur and shrinks (driven by `useScroll`). Links: How it works · Features · Performance · Analyze (primary button).

2. **Hero** (Watermelon hero block as the layout base, with a custom 3D layer).
   - Left: eyebrow "AI Flood Segmentation", headline **"See the flood. Pixel by pixel."**, a subhead about the U-Net from aerial imagery, and two CTAs: "Try the model" (magnetic hover via `useSpring`) and "How it works".
   - Right/background: **React Three Fiber Earth** with a slow auto-rotation, a cyan atmosphere glow (fresnel shader) and a few pulsing points marking flood-prone regions. It rotates slightly with the mouse, and scrolling down zooms the camera toward the surface (scroll-linked), handing off into section 3.
   - The headline words stagger in; the Earth fades and scales in.
   - Show a static image fallback when there's no WebGL or with reduced motion. Lazy-load the canvas with `next/dynamic` and `ssr:false`.

3. **Signature moment: scroll-driven segmentation reveal** (custom). A sticky full-width aerial flood image (from the test set). As the user scrolls, a cyan "scan line" sweeps across it, and behind the line the **real predicted mask** from the model fades in (`useScroll` → `clip-path: inset()`). A live counter beside it climbs to the real water % for that image. Caption: "Actual AquaMap output on an unseen test image." Prerender the mask from the trained model and save it as a static asset; never draw it by hand.

4. **The problem** (Watermelon stats block). Three to four count-up stats on floods. **Each one needs a cited real source** (e.g. a UN / World Bank / NDMA page) shown as a small footnote. If the agent can't verify a statistic, leave it out.

5. **How it works: pinned scroll story** (custom with Motion). A sticky panel on the left with steps on the right: **Upload → Preprocess → Encoder → Decoder + skip connections → Mask + Uncertainty**. An animated SVG U-Net diagram lights up the active stage as each step scrolls into view, and the skip-connection lines draw themselves (`pathLength` animation).

6. **Features bento** (Watermelon bento block). Cards: Pixel-level segmentation · Uncertainty map · Explainable AI (Grad-CAM) · Flood change detection · Robustness tested · ONNX-optimized · PDF reports. Each card has a small looping micro-animation (e.g. the uncertainty card shimmers, the change card toggles before/after). Hover lifts the card with a cyan border glow.

7. **Model performance teaser** (custom). Fetches `/metrics`. Animated bars compare the 3 models on IoU and Dice, and the numbers count up. If `/metrics` is unavailable, show "Model evaluation pending". **Never placeholder numbers.** The link goes to `/performance`.

8. **Tech stack marquee** (Watermelon animated component if a suitable marquee exists, otherwise custom). Logos as text/icons: PyTorch, U-Net, SegFormer, FastAPI, ONNX, Next.js, Three.js, Motion. Pause on hover.

9. **FAQ / limitations** (Watermelon FAQ block). Questions: Is this an official flood map? What does water % mean? What data was it trained on? Where does it fail? How accurate is it? (Answer with the real test metrics.)

10. **CTA** (Watermelon CTA block). "Upload an aerial image and see AquaMap work," with a button to `/analyze`.

11. **Footer** (Watermelon footer block). Project name, student name, course, GitHub link, dataset credit (Kaggle dataset author), and the disclaimer.

### 10.5 Analyze page (`/analyze`)

- Two-column workspace (stacked on mobile). Left: the uploader (drag & drop, validation, sample-image picker). Right: results.
- States animated with `AnimatePresence`: **idle → uploading → analyzing → result / error**. While analyzing, a cyan scan line sweeps the uploaded image as a *loading indicator only*; it must not imply progress percentages that aren't real.
- **Before/after slider** comparing the original with the overlay.
- **Layer pills** (`layoutId` sliding indicator): Overlay · Mask · Uncertainty · Grad-CAM, plus an opacity slider.
- **Stat cards** (count-up): water %, mean uncertainty, inference time, model name.
- Buttons: Download overlay PNG · Download PDF report.
- Error states: API offline, model not trained (503), invalid file, each with a friendly message.

### 10.6 Compare page (`/compare`)
Two upload slots (Before / After) → the result shows both overlays side by side, the change mask (coral = new water, green = receded), and a big animated delta number ("+18.2 percentage points water coverage"). Show the alignment-status badge and the caveat.

### 10.7 Performance page (`/performance`)
Data comes only from `/metrics`:
- metric cards for the production model;
- a 3-model comparison table + bar chart;
- a robustness line chart (score vs corruption severity);
- an ONNX vs PyTorch latency chart;
- a confusion matrix;
- a best/worst prediction gallery and an error-analysis notes panel;
- a link to the model card.

### 10.8 Quality bar
- Lighthouse performance ≥ 85 on the landing page (lazy 3D, optimized images with `next/image`).
- Responsive from 360px wide upward, with no horizontal scroll.
- Keyboard accessible, visible focus, alt text on all images, colour contrast AA.
- `prefers-reduced-motion` respected everywhere.

---

## 11. Testing

**Backend (pytest):** dataset pairing, mask binarization, joint image/mask transform alignment, metric functions on known arrays, TTA un-flip correctness, the ONNX-vs-PyTorch output match, and `/health`, `/predict`, `/compare`, `/report` happy paths plus the 400/503 paths. Use a tiny randomly-initialized model when no checkpoint exists.

**Frontend:** `npm run lint` and `npm run build` pass; a Playwright smoke test checks that the landing page renders, analyze handles an API error, and the layer pills switch.

---

## 12. DevOps

- `backend/Dockerfile` (python-slim, CPU torch, uvicorn).
- `docker-compose.yml` runs backend + frontend with one command: `docker compose up`.
- `.github/workflows/ci.yml` runs pytest, frontend lint and build on every push.

> 🎓 **Learn:** **CI (Continuous Integration)** automatically tests every change, and **Docker** makes "it works on my laptop" true on every machine.

---

## 13. Deployment

- **Frontend → Vercel**, with `NEXT_PUBLIC_API_URL` set to the backend URL.
- **Backend → Render / Railway / Hugging Face Spaces (Docker).** Ship the ONNX model (smaller, CPU-friendly). Load it from Git LFS or download it at startup from a GitHub Release / Hugging Face Hub.
- Set the CORS env var to the Vercel domain.

---

## 14. Build phases (in order, verify each, tell the user what to run and what they should see)

1. Inspect the repo + this spec and list the gaps.
2. Backend scaffold: venv, requirements, `/health`.
3. Dataset: Kaggle token → download → verify → show the preview.
4. Train the 3 models; MLflow logging.
5. Evaluate: metrics JSON, comparison, error analysis.
6. Core API: `/predict`, `/metrics`, `/samples`.
7. Frontend functionality: analyze page wired to the real API.
8. Advanced AI: uncertainty → Grad-CAM → compare → robustness → ONNX → PDF report.
9. Landing page with Watermelon blocks + Motion + 3D (Section 10.4), including the real-mask scroll reveal.
10. Compare and Performance pages.
11. Tests, Docker, CI, README, MODEL_CARD.
12. Deployment.

**If time runs short**, the priority order is: phases 1–7 (must have) → uncertainty + landing page + performance page (high impact) → Grad-CAM + compare + robustness → ONNX + PDF + Docker/CI → SegFormer.

---

## 15. Rules for the agent

- Never fabricate metrics, predictions, statistics, testimonials or users. Every number shown comes from a real run or a cited source.
- Never claim a command or test passed unless it actually ran.
- Never commit or print secrets.
- Don't invent dataset handles, library APIs or Watermelon component names; check the MCP or official pages first.
- Make small, verifiable changes; don't delete working code silently.
- On errors, report the exact message and a targeted fix.
- Keep the code commented so a student can explain it in a viva.

---

## 16. 🎓 Viva cheat sheet (for Aleeya)

**One-line pitch:** "AquaMap is an explainable, uncertainty-aware flood segmentation system. A transfer-learning U-Net labels floodwater pixel by pixel in aerial images. I benchmarked it against a scratch U-Net and a transformer (SegFormer), stress-tested its robustness, optimized it with ONNX, and deployed it as a full-stack web app."

**Likely questions and what to cover:**
- *Why U-Net?* It's built for pixel-level segmentation, and its skip connections preserve edges.
- *Why transfer learning?* The dataset is small, and pretrained features generalize better. Point to your benchmark result.
- *How do you know it's not overfitting?* Separate validation/test splits, duplicate grouping, early stopping, and the gap between train and test scores.
- *What is IoU / Dice?* Overlap measures (Section 7.3).
- *When does it fail?* Use your error analysis + robustness results.
- *Why uncertainty and Grad-CAM?* Trust and transparency for real-world decisions.
- *Is "30% water" the flooded land area?* No, it's image pixels; real area needs georeferencing.
- *What would you do next?* Satellite (Sentinel-1) data so it works through clouds, georeferenced area estimation, and a larger dataset.

---

## 17. Final checklist

- [ ] Dataset downloaded by script and verified
- [ ] 3 models trained, MLflow tracked, fair comparison
- [ ] Test metrics + error analysis
- [ ] API: predict, compare, report, metrics, samples
- [ ] Uncertainty map + Grad-CAM
- [ ] Robustness report + ONNX benchmark
- [ ] Landing page: Watermelon blocks + Motion + 3D Earth + real-mask scroll reveal
- [ ] Analyze, Compare, Performance pages
- [ ] Tests, Docker, CI, README, MODEL_CARD
- [ ] Deployed frontend + backend
