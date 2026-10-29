# HydroVision — UI Polish & Page Upgrade Spec (v2.1)

> **To the coding agent (Antigravity):** This file is an **add-on** to `AQUAMAP_V2_COMPLETE_SPEC.md`. The project is already built and deployed at https://aquamap-chi.vercel.app under its old name, AquaMap. **The project is being renamed to HydroVision (Section R).** Do **not** rebuild it from scratch. Apply the changes below on top of the existing code, page by page, in the order of Section 9. Where this file conflicts with the v2 spec's Section 10 (design), **this file wins**. Wherever the v2 spec says "AquaMap", read "HydroVision". Rule 15 of the v2 spec still applies: never invent numbers, statistics or component names.
>
> **To Aleeya:** The goal of this pass is that someone who saw the old version can *immediately* tell it's better. The three big visible changes are: (1) a clearer, higher-contrast theme with real hierarchy, (2) a hero and demo that show your real model working within the first scroll, and (3) two new pages (Dataset Explorer and Model Card) that make the project feel scientific, not just pretty.

---

## R. Rename: AquaMap → HydroVision (do this first)

**New name:** HydroVision
**Tagline:** "See the flood. Pixel by pixel."
**One-line description:** "Explainable AI floodwater segmentation for aerial and drone imagery."

### R.1 Where to change it
Search the whole repo, case-insensitively, for `aquamap`, `aqua map` and `aqua-map`, and update every user-facing occurrence:

| Place | Change to |
|---|---|
| Browser tab title / `metadata.title` in `app/layout.tsx` | `HydroVision — Explainable Flood Segmentation` |
| `metadata.description` + Open Graph / Twitter tags | the one-line description above |
| Navbar logo text + the "v2.0" badge | `HydroVision` (drop the version badge from the navbar) |
| Footer, CTA text, hero subhead, FAQ answers, all page copy | `HydroVision` |
| Favicon + OG image | new logo (R.2); regenerate `og.png` at 1200×630 with the new name |
| FastAPI `title=` in `main.py` and the `/docs` page | `HydroVision API` |
| PDF report header and filename | `HydroVision Report`, file `hydrovision_report_<timestamp>.pdf` |
| Downloaded PNG filename | `hydrovision_overlay_<timestamp>.png` |
| `README.md`, `MODEL_CARD.md` titles and text | `HydroVision` |
| `package.json` `"name"` | `hydrovision` |
| MLflow experiment name | `hydrovision` (old runs can stay under the old name) |
| Docker image / compose service names | `hydrovision-api`, `hydrovision-web` |

### R.2 Logo
A simple mark: a **droplet outline whose inside is an eye / camera aperture**, which reads as "water + vision". Use a single-colour SVG in `--water` on dark and `--text` on light, at 24px in the navbar. The wordmark is "HydroVision" in Space Grotesk 600, with "Vision" in `--text-2` so the two halves read clearly. Export `icon.svg`, `favicon.ico` (32px) and `apple-icon.png` (180px).

### R.3 What NOT to rename (to avoid breaking things)
- Don't rename the GitHub repo, folder names or Python package paths unless the user asks. Breaking imports isn't worth it for a rename.
- Keep `AQUAMAP_V2_COMPLETE_SPEC.md` as is; it's just a reference file.
- **Vercel URL:** the current URL is `aquamap-chi.vercel.app`. In Vercel → Project → Settings → General, rename the project to `hydrovision` (the agent should tell the user how to do this, since it needs their account), or add a new domain under Settings → Domains. Then update `NEXT_PUBLIC_API_URL` / the backend CORS env var if the frontend domain changes. The old URL should keep working or redirect.

### R.4 Check
After renaming, run `grep -ri "aquamap" frontend/app frontend/components backend/app README.md MODEL_CARD.md`. The only matches allowed are in code comments or the spec filename.

---

## 0. Verdict on the current theme

**Keep the direction: dark navy + cyan.** It fits a water/AI project perfectly, and changing to a totally new palette now would waste time and make the project look less consistent.

What's actually wrong is not the colours, it's how they're used:

| Problem now | Why it hurts | Fix |
|---|---|---|
| Cyan is used for everything (buttons, badges, numbers, headings, borders, charts, mask) | Nothing stands out, and cyan stops meaning "water" | **Reserve cyan for water and live model output.** Use a separate blue for links/focus, and one solid style for primary buttons |
| Lots of 10–11px monospace text in grey | Hard to read, looks cramped, examiners on a projector won't read it | Minimum 14px body, 12px only for true labels; monospace only for numbers |
| Many surfaces are almost the same shade as the background | Cards blend into the page, no depth | 3 distinct surface levels + visible borders (tokens below) |
| Content column is narrow (~730px) on a wide screen | Page feels empty and small | Container `max-width: 1200px` for landing, `1320px` for workspaces |
| Too many pill badges per section | Visual noise | Max **one** eyebrow badge per section |

The new tokens below keep the same mood but every pairing has been contrast-checked (WCAG AA needs 4.5:1 for body text; all body pairings here are above 5.9:1).

---

## 1. Design tokens (replace the current ones)

Put these in `app/globals.css`. The site already has a light/dark toggle in the navbar, so both themes are defined. **Dark is the default.**

```css
:root,
:root[data-theme="dark"] {
  /* Surfaces — 3 clear levels */
  --bg:          #060B16;  /* page background */
  --surface-1:   #0C1526;  /* cards, panels */
  --surface-2:   #121D33;  /* raised: popovers, active tabs, inputs */
  --border:      #22304A;
  --border-strong:#2F4163;

  /* Text — contrast on --bg in brackets */
  --text:        #EEF4FB;  /* 17.8:1  headings, body */
  --text-2:      #B6C4D6;  /* 11.1:1  secondary body */
  --text-muted:  #8A9BB2;  /*  6.9:1  captions, labels (never below 12px) */

  /* Semantic colour — each has ONE job */
  --water:       #22D3EE;  /* 10.9:1  water mask, live model output, water % */
  --link:        #60A5FA;  /*  7.7:1  links, focus rings, secondary actions */
  --alert:       #FF7A85;  /*  7.8:1  new water (compare), errors, warnings */
  --ok:          #34D399;  /* 10.2:1  receded water, success, "model loaded" */
  --uncertain:   #FBBF24;  /* 11.8:1  uncertainty map, "low confidence" */

  /* Primary button: solid water-cyan with dark text (10.5:1) */
  --btn-primary-bg:   #22D3EE;
  --btn-primary-fg:   #04121A;
  --btn-primary-hover:#67E8F9;

  --glow: 0 0 0 1px rgba(34,211,238,.25), 0 8px 40px -8px rgba(34,211,238,.35);
  --radius: 14px;
}

:root[data-theme="light"] {
  --bg:          #F6F9FC;
  --surface-1:   #FFFFFF;
  --surface-2:   #EEF3F8;
  --border:      #D6E0EB;
  --border-strong:#B9C7D8;

  --text:        #0B1424;  /* 17.4:1 */
  --text-2:      #334155;  /*  9.8:1 */
  --text-muted:  #5B6B80;  /*  5.1:1 */

  --water:       #0E7490;  /*  5.1:1 (darker cyan so it's readable as text) */
  --link:        #1D4ED8;
  --alert:       #BE123C;
  --ok:          #047857;
  --uncertain:   #B45309;

  --btn-primary-bg:   #0E7490;
  --btn-primary-fg:   #FFFFFF; /* 5.4:1 */
  --btn-primary-hover:#155E75;

  --glow: 0 0 0 1px rgba(14,116,144,.2), 0 8px 30px -10px rgba(14,116,144,.3);
}

@media (prefers-color-scheme: light) {
  :root:not([data-theme]) { /* same values as [data-theme="light"] */ }
}

body { background: var(--bg); color: var(--text); }
```

**Mask colours on images stay the same in both themes** (the overlay sits on a photo, not on the page): water `#22D3EE` at 55% opacity, new water `#FF7A85`, receded `#34D399`, uncertainty amber→white heat, Grad-CAM `inferno`.

### 1.1 Colour rules (the agent must follow these)
- `--water` is **only** for: the mask, water %, the live-model status dot, and the primary button. Not for section headings, not for random badges.
- Headings are `--text`. The single highlighted word in the hero headline may use a cyan→blue gradient; nowhere else.
- Charts use the semantic colours by meaning, not decoration (see Section 5.3).
- Never use opacity below 0.7 on text. Use `--text-muted` instead.

### 1.2 Typography

Keep the fonts (Space Grotesk / Inter / JetBrains Mono). Fix the scale:

| Token | Size / line-height | Font | Use |
|---|---|---|---|
| `display` | clamp(40px, 5.5vw, 72px) / 1.05, weight 700, tracking -0.02em | Space Grotesk | Hero headline only |
| `h2` | clamp(28px, 3.2vw, 44px) / 1.15, 700 | Space Grotesk | Section titles |
| `h3` | 20px / 1.3, 600 | Space Grotesk | Card titles |
| `body-lg` | 18px / 1.6 | Inter | Hero subhead, section intros |
| `body` | 16px / 1.6 | Inter | All paragraphs |
| `small` | 14px / 1.5 | Inter | Card descriptions, captions |
| `label` | 12px / 1.4, 600, uppercase, tracking 0.08em | Inter (not mono) | Eyebrows, table headers |
| `metric` | 32–56px, 600, tabular-nums | JetBrains Mono | Big numbers only |

Rule: **monospace is for numbers and code only.** Labels like "OPERATIONAL REALITY" switch to Inter `label`.

### 1.3 Layout
- Container: `max-width: 1200px` (landing), `1320px` (Analyze/Compare/Benchmark), side padding 24px (16px on mobile).
- Section spacing: 128px top/bottom on desktop, 80px on mobile.
- Cards: `--surface-1`, 1px `--border`, `--radius`, padding 24–32px. Hover: border `--border-strong` + `--glow`, lift 2px.
- Background texture: keep the subtle grid, but at 4% opacity, and fade it out toward the bottom of the hero with a radial mask.

---

## 2. Global fixes (every page)

### 2.1 Navigation
- Rename nav items: **Overview · Analyze · Compare · Benchmark · Dataset · Model Card**.
  - "Benchmark & Viva" → **"Benchmark"**. Viva material should not be visible in the product UI; keep it in your own notes.
- Remove the "ONNX 31ms • Dice 0.888" pill from the navbar (it repeats the hero, and 0.888 doesn't match the real 0.884 shown everywhere else). Replace it with a small **model status dot**: green "Model online" or grey "Model offline", read from `/health`.
- One primary button in the navbar: **"Analyze an image"**.
- Navbar: transparent at the top, glass (`--surface-1` at 70% + blur 12px + bottom border) after 40px of scroll, using Motion `useScroll`.
- Mobile: hamburger → full-height sheet menu.

### 2.2 Footer (currently missing on the landing page)
Add on every page:
- HydroVision logo + one-line description.
- **Built by** Aleeya (name, course, university, semester) — fill in real details.
- Links: GitHub repo · Model Card · Dataset (Kaggle: *Flood Area Segmentation* by Faizal Karim, with link).
- Disclaimer: *"HydroVision is a research prototype for screening aerial images. It is not an official flood map or emergency service."*

### 2.3 Copy honesty pass — exact replacements

Search the codebase for each "Current" string and replace it.

| Current | Replace with | Why |
|---|---|---|
| "Explainable Aerial Flood Intelligence at Sub-Pixel Precision" | **"See the flood. Pixel by pixel."** (sub-line: "Explainable floodwater segmentation for aerial imagery") | Model works at pixel level, not sub-pixel |
| "calibrated flood inundation boundaries in 31ms" | "pixel-level water masks in about 31 ms on CPU (ONNX Runtime)" | Not calibrated to real-world area |
| "zero data leakage" / "0% Leakage" / "leak-free" | "Leakage-controlled split (perceptual-hash grouping)" | Can't prove zero |
| "BENCHMARK VERIFIED" | remove | Verified by whom? |
| "Flood Inundation: 26.6%" | "Water pixels: 26.6%" | It's % of image pixels |
| "+4.3% higher than scratch" / "+4.33%" | "+4.3 points Dice vs. scratch (0.884 vs 0.841)" | It's percentage *points* |
| "enabling 32+ FPS edge inference on portable rescue laptops" | "≈31 ms per 256×256 image on [CPU model]" — fill in the real CPU | Untested claim |
| "publication-ready disaster assessment dossiers … legal disclaimers" | "Downloadable PDF report with the overlay, uncertainty, Grad-CAM and metrics" | Overclaim |
| "Export PDF Dossier" | "Download PDF report" | Plain language |
| "Aerial Drone Segmentation & Forensics" | "Analyze an aerial image" | "Forensics" is the wrong field |
| "Engineered for High-Stakes Disaster Telemetry" | "What HydroVision can do" | Overclaim |
| "Laser-Sharp Flood Boundary Demarcation" | "Real model output on an unseen test image" | Says what it actually is |
| "Viva-Grade Pedagogical Architecture" | remove the line | Homework language |
| "Why Classical Remote Sensing Fails First Responders" | "Why pixel-level flood mapping matters" | Unsourced claim |
| "Supports JPEG, PNG up to 25MB" | match the backend's real limit (v2 spec says 10 MB) | Must match the API |

### 2.4 Hero globe "event chips" and "38.4% inundation"
**Remove the Valencia / Storm / Hurricane / Kerala chips and the "38.4% inundation" card** unless each one shows a real HydroVision prediction on a real image from that event, with the image credited. If you want to keep the idea, replace it with the Section 3.2 "live sample strip".

### 2.5 Disaster case cards (Valencia, Derna, Houston)
Each card needs a **source link** shown as a small footnote ("Source: …"). The agent must web-search and cite a reputable source (UN OCHA, WMO, NOAA, Reuters, AP, or similar) for every number. If a number can't be verified, remove it. Death tolls for Derna vary a lot between sources, so state the source next to the number. Delete sentences that claim what a specific method "failed" to do unless they're cited.

### 2.6 Accessibility & polish
- Visible focus ring on everything: `outline: 2px solid var(--link); outline-offset: 2px`.
- All images have alt text; the before/after slider is keyboard-operable (← → keys move it 5%).
- `prefers-reduced-motion`: no auto-rotating globe, no scroll-scrubbed animations, and instant state changes.
- Lighthouse: Performance ≥ 85, Accessibility ≥ 95 on `/`.

---

## 3. Landing page (`/`) — upgraded layout

Order of sections. Things marked **NEW** are the visible differences.

### 3.1 Hero (rebuilt)
- Two columns on desktop (55/45), stacked on mobile.
- **Left:**
  - One eyebrow: `AI FLOOD SEGMENTATION` (label style, `--text-muted`).
  - Headline (`display`): **See the flood.** / **Pixel by pixel.** — "Pixel by pixel." gets the cyan→blue gradient. Words stagger in with Motion (0.06s each).
  - Subhead (`body-lg`, `--text-2`, max 56ch): "HydroVision uses a transfer-learning U-Net to label floodwater in drone and aerial photos, then shows how confident it is and what it looked at."
  - Buttons: **Analyze an image** (primary, magnetic hover) · **See how it works** (ghost, scrolls to 3.4).
  - **Proof row** (3 metrics, count-up on view, `metric` style, values fetched from `/metrics`, never hard-coded): `0.884` Test Dice · `0.792` Test IoU · `31 ms` CPU latency (ONNX). Under each, a 12px caption saying where it came from: "44 held-out test images".
- **Right — upgraded globe:**
  - 1.4× larger than now and slightly cropped by the column edge so it feels immersive.
  - Replace the plain dot-sphere with: a dark ocean sphere + a land texture (e.g. NASA Blue Marble / Black Marble, which is public domain, credited in the footer), a fresnel atmosphere glow in `--water`, and thin animated "scan rings" orbiting it.
  - Slow auto-rotation (0.05 rad/s), slight mouse parallax, lazy-loaded with `next/dynamic({ ssr:false })`.
  - Fallback: a static rendered PNG of the same globe.
- Background: soft radial cyan glow behind the globe at 12% opacity.

### 3.2 NEW — Live sample strip (directly under the hero)
A horizontal row of 5 real test-set thumbnails. Hovering (or tapping) a thumbnail **instantly swaps in its real predicted mask** with a 300ms clip-path wipe, and shows its water % and IoU underneath. Masks are pre-rendered from the trained model into `public/samples/`. Caption: "Hover to see HydroVision's prediction on images it never saw during training." This shows the model working within 2 seconds of landing.

### 3.3 Signature demo: before/after slider (keep, upgrade)
- Keep the drag slider; it's the best thing on the site.
- Make it **full container width** (1200px) and taller (aspect 16:9).
- Add a **3-way toggle** above it: Prediction · Ground truth · Error map. Error map colours: correct = no tint, missed water (false negative) = `--alert`, false alarm (false positive) = `--uncertain`. This is visibly new and very convincing for an examiner.
- Stats chips on the image: "Water pixels 26.6%" · "IoU 0.792 on this image" (per-image IoU, not the test average, so compute it).
- Add keyboard support and a "Try your own image →" link under it.

### 3.4 How it works (keep the U-Net diagram, make it scroll-driven)
- Convert the "Step 1–4" buttons into a **pinned scroll story**: the diagram stays sticky on the left, the 4 steps scroll on the right, and the active stage lights up as each step enters view (`useScroll` + `useTransform`). Skip-connection lines draw themselves with `pathLength`.
- Steps: 1) Encoder (MobileNetV2, pretrained) → 2) Bottleneck → 3) Decoder + skip connections → 4) Outputs: mask, uncertainty, Grad-CAM.
- Each step shows a **real intermediate image** from the same sample (input, a feature-map thumbnail, the mask, the uncertainty map), so it isn't just boxes.
- Fix the diagram labels so the sizes are consistent (E1 says 128² and D1 says 128², but E3 and the bottleneck have no size; either show all sizes or none).

### 3.5 Why it matters (cited cards)
Keep the 3 event cards, restyled, each with a source footnote (Section 2.5). Use `--alert` only for the small location label.

### 3.6 Features bento (restyle)
- Bento grid, 6 cells, two of them large: **Uncertainty map** (large, with a looping amber shimmer over a real uncertainty image) and **Before/after change detection** (large, auto-toggling between the two real images every 3s).
- Small cells: Transfer learning · Grad-CAM · ONNX speed-up · PDF report.
- Each card: icon, `h3`, one `small` sentence. No numbers unless from `/metrics`.

### 3.7 Benchmark teaser (restyle)
- 3 model cards side by side. The production model card is raised and has a "Production model" tag.
- **Be honest that SegFormer is marginally higher on Dice (0.8847 vs 0.8840)**, and explain the choice in one line: "We ship U-Net because it's within 0.001 Dice of SegFormer and runs faster on CPU." Only keep that sentence if the latency comparison is done on the **same device and runtime** (see 5.3); otherwise say "comparable accuracy, smaller ONNX export".
- Button: "Full benchmark →".

### 3.8 FAQ (rename from "Viva Cheat Sheet")
Title: **"Questions & limitations"**. Questions:
1. Is this an official flood map? (No.)
2. What does "water %" mean? (% of image pixels.)
3. What data was it trained on? (Kaggle dataset, 290 images, split 70/15/15.)
4. Where does it fail? (From the error analysis: e.g. shadows, muddy water that looks like roads, reflections.)
5. Why U-Net and not just SegFormer?
6. How did you prevent data leakage?

### 3.9 CTA + Footer
CTA panel on `--surface-2` with a faint globe image: "Upload an aerial image and see HydroVision work" + two buttons (Analyze · Compare). Then the footer (2.2).

---

## 4. Analyze page (`/analyze`)

What's wrong now: on first load the result panel is a **big black empty box**, and "Select unseen test sample (0)" shows **zero samples**, so a visitor sees nothing working.

Fixes:
1. **Fix the sample loader** so the test samples actually appear (expect 6–8). Thumbnails in a 4-column grid with water % under each.
2. **Auto-load the first sample on page load**, so the result panel always shows a real prediction. Never show an empty black box.
3. **Empty/idle state** (only if samples fail to load): an illustration of a drone over water + "Drop an image or pick a sample to begin."
4. Layout: left column 380px (upload, samples, options), right column the viewer (fills the rest). On mobile the viewer goes first.
5. **Loading state**: a cyan scan line sweeps the image + text "Running U-Net…". No fake percentage progress bar.
6. **Result panel** under the viewer, 4 stat cards with count-up: Water pixels % · Mean uncertainty (with a "low / medium / high" chip in `--ok` / `--uncertain` / `--alert`) · Inference time · Model + runtime (e.g. "U-Net MobileNetV2 · ONNX CPU").
7. **NEW — Uncertainty callout**: if mean uncertainty is high, show an amber banner: "The model is unsure about parts of this image. Check the highlighted areas before relying on it."
8. Layer pills (Overlay · Mask · Uncertainty · Grad-CAM) with a Motion `layoutId` sliding highlight. Each layer gets a small **legend** under the viewer (e.g. the uncertainty gradient bar labelled "certain → unsure").
9. Rename "Diagnostic toggles" to **"Options"**. Plain labels: "Show Grad-CAM", "Show uncertainty", "Use ONNX (faster)".
10. Buttons in the header: **Download PNG** · **Download PDF report**. Disabled (with a tooltip) until there's a result.
11. Error states, each with an icon, one sentence and a retry button: API offline · Model not loaded (503) · File too large / not an image.

---

## 5. Compare page (`/compare`)

### 5.1 Bug
`/compare` currently **redirects to `/analyze`**, and the "Flood Change" nav link shows the Analyze page. Fix the route so `/compare` renders its own page.

### 5.2 Layout
- Two upload slots side by side: **Before** and **After**, each with a sample-pair picker. Ship at least 2 real before/after pairs if available; if the dataset has no true pairs, say so honestly and let users upload their own.
- Result: three panels: Before overlay · After overlay · **Change map** (new water `--alert`, receded `--ok`, unchanged water `--water` at 30%).
- Big delta number (count-up): "**+18.2** percentage points of water" with a small "Before 12.1% → After 30.3%" line.
- Alignment badge: "Images aligned ✓" or "Alignment failed — results may be unreliable" (from the ORB alignment step in the v2 spec).
- Caveat line: "Both images must show the same area from a similar angle."

---

## 6. Benchmark page (`/performance` → rename route label to "Benchmark")

### 6.1 Fixes
1. **Bar chart y-axis starts at 0.65.** That makes small differences look huge and is a classic chart mistake examiners notice. Either start bars at 0, or (better for close scores) switch to a **dot plot**: one row per metric, a dot per model on a 0.70–0.95 axis, with the axis range clearly labelled.
2. **Latency numbers disagree.** The table says U-Net 85.1 ms, the cards say 79.8 ms PyTorch and 30.9 ms ONNX, and SegFormer is "73.1 ms (MPS)". Every latency must show **device + runtime** (e.g. "Apple M2 · PyTorch MPS"), and the comparison table must use the **same device and runtime for all three models**. Re-run the benchmark if needed.
3. "TOP TEST DICE 0.8847 SegFormer" card is fine, but rename "TRANSFER ADVANTAGE +4.33%" to "Transfer learning gain: +4.3 Dice points", and "TEST SPLIT PARITY 0% Leakage" to "Split: leakage-controlled".
4. Rename the "Viva Study Sheet" tab to **"Error analysis"** and fill it with real content (6.2).
5. Header: "Benchmark" (h2) + "3 models · 44 held-out test images · same split, same training budget".

### 6.2 NEW — Error analysis tab
- **Best 3 / worst 3 predictions** gallery: image, ground truth, prediction, error map, per-image IoU.
- A short written list of **failure patterns** observed in the worst cases (the agent writes these from the actual images, e.g. "dark shadows labelled as water").
- **Uncertainty vs error** chart: % of wrong pixels in low / medium / high uncertainty bins. If high-uncertainty pixels really are wrong more often, this proves the uncertainty map is useful, which is a strong viva point.

### 6.3 Robustness tab
Line chart: Dice (y, 0–1) vs corruption severity (x: 0, 1, 2, 3), one line per corruption (blur, dark, noise, JPEG, fog). Below it, one example image at severity 3 per corruption with its prediction.

### 6.4 ONNX tab
Two bars (PyTorch CPU vs ONNX CPU) on the **same CPU**, plus the "max output difference" number (e.g. "max |Δ| = 3e-6", from the real export check).

---

## 7. NEW pages (the "visible difference")

### 7.1 Dataset Explorer (`/dataset`)
Shows that you understand your data, not just your model.
- Top stats (from `verify_dataset.py` output): total images, train/val/test counts, mean water % per image, number of near-duplicate groups found.
- **Water % histogram** across the dataset.
- **Browsable grid** of test images with filter chips: "All · Best predictions · Worst predictions · High uncertainty". Clicking an image opens a side sheet with image / ground truth / prediction / error map / uncertainty and its per-image metrics.
- A **"How we split the data"** mini-diagram: 290 images → perceptual-hash groups → 70/15/15 split, with near-duplicates kept together.

### 7.2 Model Card (`/model-card`)
Render `MODEL_CARD.md` as a clean, readable page (Inter, max-width 760px): intended use, out-of-scope use, data, training setup, metrics, robustness, known failure cases, ethical considerations. Link it in the nav and footer. Model cards are standard practice in responsible AI, and having one as a real page is rare in student projects.

---

## 8. Motion guidelines (polish level)

- One shared easing: `[0.22, 1, 0.36, 1]`. Durations: 0.2s (hover), 0.4s (UI state), 0.6–0.8s (section entrance).
- Section entrance: fade + 16px rise, `whileInView`, `viewport={{ once: true, amount: 0.3 }}`. Stagger children at 0.06s.
- **One "wow" per section, not five.** Hero = globe + word stagger. Demo = slider. How it works = scroll story. Bento = the 2 large card loops. Everything else stays calm.
- Count-up numbers: 1.2s, ease-out, start when 50% visible, `tabular-nums` so they don't jitter.
- Page transitions between routes: 0.25s fade (Motion `AnimatePresence` in the layout).
- Wrap all scroll-linked and looping animations in `useReducedMotion()` checks.
- Use `LazyMotion` + `domAnimation`; animate only `transform`, `opacity`, `clip-path`.

### Watermelon UI
Use the Watermelon MCP (`https://mcp.watermelon.sh/mcp`) to find real blocks for: navbar, bento grid, FAQ accordion, CTA, footer, stats, and a tabs component for the Benchmark page. **Restyle every installed block to the tokens in Section 1**, since unstyled blocks will clash. Don't install pricing or testimonial blocks.

---

## 9. Order of work (verify after each step and screenshot before/after)

0. Rename to HydroVision + new logo (Section R).
1. Tokens + typography + layout container (Section 1). *Biggest visible change for the least effort.*
2. Global fixes: nav, footer, copy honesty pass, remove the globe chips (Section 2).
3. Fix bugs: `/compare` redirect, Analyze sample loader + auto-load (4, 5.1).
4. Benchmark page fixes: chart axis, consistent latency, tab renames (6.1).
5. Landing: hero rebuild + live sample strip + slider upgrade (3.1–3.3).
6. Landing: scroll-story U-Net, bento, FAQ, CTA (3.4–3.9).
7. Analyze page polish (4).
8. Compare page (5.2).
9. Error analysis + robustness + ONNX tabs (6.2–6.4).
10. New pages: Dataset Explorer, Model Card (7).
11. Accessibility + Lighthouse pass, mobile check at 360px, light theme check (2.6).
12. Redeploy to Vercel.

---

## 10. Acceptance checklist

- [ ] Renamed to HydroVision everywhere users can see it (title, logo, footer, API docs, PDF, README); new favicon + OG image
- [ ] No body text under 14px; no text below 0.7 opacity
- [ ] Cyan only used for water/model output/primary button
- [ ] Every number on the site comes from `/metrics` or has a cited source
- [ ] All copy replacements in 2.3 done; no "sub-pixel", "zero leakage", "viva", "dossier", "forensics" left
- [ ] Footer with name, dataset credit, disclaimer on every page
- [ ] `/compare` works; Analyze shows samples and auto-loads one
- [ ] Benchmark chart axis honest; latencies on the same device/runtime and labelled
- [ ] Live sample strip + 3-way slider (prediction / ground truth / error) on landing
- [ ] Dataset Explorer and Model Card pages live
- [ ] Light theme readable; reduced-motion respected; Lighthouse Perf ≥ 85, A11y ≥ 95
- [ ] Mobile (360px) has no horizontal scroll
