"use client";

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

// Dataset stats from verify_dataset.py output
const DATASET_STATS = {
  total: 290,
  train: 203,
  val: 43,
  test: 44,
  nearDuplicateGroups: 11,
  meanWaterPct: 28.4,
};

// Water % histogram bins (approx from dataset distribution)
const HISTOGRAM_DATA = [
  { bin: "0–10%", count: 42 },
  { bin: "10–20%", count: 51 },
  { bin: "20–30%", count: 68 },
  { bin: "30–40%", count: 52 },
  { bin: "40–50%", count: 38 },
  { bin: "50–60%", count: 21 },
  { bin: "60–70%", count: 11 },
  { bin: "70–80%", count: 5 },
  { bin: "80–90%", count: 2 },
];

// Test set sample thumbnails (from public/samples)
const TEST_SAMPLES = [
  { id: 1, url: "/samples/sample_1.jpg", waterPct: 26.6, label: "Flooded field" },
  { id: 2, url: "/samples/sample_2.jpg", waterPct: 9.9,  label: "Urban drainage" },
  { id: 3, url: "/samples/sample_3.jpg", waterPct: 45.1, label: "River overflow" },
  { id: 4, url: "/samples/sample_4.jpg", waterPct: 31.2, label: "Aerial flood" },
  { id: 5, url: "/samples/sample_5.jpg", waterPct: 18.7, label: "Wetlands" },
  { id: 6, url: "/samples/sample_6.jpg", waterPct: 55.0, label: "Peak inundation" },
];

export default function DatasetPage() {
  const tooltipStyle = {
    backgroundColor: "var(--surface-1)",
    borderColor: "var(--border)",
    borderRadius: "8px",
    fontSize: "12px",
    color: "var(--text)",
  };

  return (
    <div className="container-landing py-12 space-y-12">
      {/* Header */}
      <div>
        <p className="text-label mb-2">Data</p>
        <h1 className="text-h2" style={{ color: "var(--text)" }}>Dataset Explorer</h1>
        <p className="text-body-lg mt-3" style={{ color: "var(--text-2)", maxWidth: "60ch" }}>
          Flood Area Segmentation dataset by{" "}
          <Link
            href="https://www.kaggle.com/datasets/faizalkarim/flood-area-segmentation"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:underline"
            style={{ color: "var(--link)" }}
          >
            Faizal Karim (Kaggle)
          </Link>
          . RGB aerial images with binary water/non-water segmentation masks.
        </p>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: "Total images", value: DATASET_STATS.total.toString(), sub: "RGB aerial images" },
          { label: "Train / Val / Test", value: `${DATASET_STATS.train} / ${DATASET_STATS.val} / ${DATASET_STATS.test}`, sub: "70% / 15% / 15% split" },
          { label: "Near-duplicate groups", value: DATASET_STATS.nearDuplicateGroups.toString(), sub: "Found by perceptual hash (dHash)" },
          { label: "Mean water coverage", value: `${DATASET_STATS.meanWaterPct}%`, sub: "Per image, across all 290" },
        ].map((s) => (
          <div
            key={s.label}
            className="rounded-xl p-5 space-y-1"
            style={{ border: "1px solid var(--border)", background: "var(--surface-1)" }}
          >
            <p className="text-label">{s.label}</p>
            <p
              className="font-mono font-semibold text-2xl tabular-nums"
              style={{ color: "var(--water)" }}
            >
              {s.value}
            </p>
            <p className="text-small" style={{ color: "var(--text-muted)" }}>{s.sub}</p>
          </div>
        ))}
      </div>

      {/* How the split works */}
      <div
        className="rounded-xl p-6 space-y-4"
        style={{ border: "1px solid var(--border)", background: "var(--surface-1)" }}
      >
        <h2 className="text-h3" style={{ color: "var(--text)" }}>How the data split was controlled for leakage</h2>
        <p className="text-body" style={{ color: "var(--text-2)" }}>
          Aerial survey datasets often contain consecutive video frames or overlapping flight passes. Random splitting
          would allow near-identical images to appear in both train and test splits, inflating test metrics (data leakage).
        </p>
        <div className="flex flex-wrap items-center gap-3 text-sm font-medium">
          {[
            { label: "290 raw images", bg: "var(--surface-2)" },
            { label: "→ compute 64-bit dHash", bg: "transparent" },
            { label: "11 near-duplicate groups found\n(Hamming ≤ 8)", bg: "var(--surface-2)" },
            { label: "→ cluster-grouped split", bg: "transparent" },
            { label: "203 train · 43 val · 44 test\n(no cluster spans two splits)", bg: "rgba(34,211,238,0.08)", border: "var(--water)" },
          ].map((step, i) => (
            <div
              key={i}
              className="rounded-xl px-4 py-3 text-center text-xs"
              style={{
                background: step.bg,
                border: step.border ? `1px solid ${step.border}` : "1px solid var(--border)",
                color: step.border ? "var(--water)" : "var(--text-2)",
                whiteSpace: "pre-line",
                minWidth: 120,
              }}
            >
              {step.label}
            </div>
          ))}
        </div>
        <p className="text-small" style={{ color: "var(--text-muted)" }}>
          This is described as <em>leakage-controlled</em>, not zero leakage, because all images come from the same distribution.
        </p>
      </div>

      {/* Water % Histogram */}
      <div
        className="rounded-xl p-6 space-y-4"
        style={{ border: "1px solid var(--border)", background: "var(--surface-1)" }}
      >
        <h2 className="text-h3" style={{ color: "var(--text)" }}>Water percentage distribution (approx.)</h2>
        <p className="text-small" style={{ color: "var(--text-2)" }}>
          Distribution of water pixel percentage per image across all 290 images.
          The dataset is moderately imbalanced — most images are 10–40% water.
        </p>
        <div style={{ height: 240 }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={HISTOGRAM_DATA} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="bin" stroke="var(--text-muted)" fontSize={12} />
              <YAxis stroke="var(--text-muted)" fontSize={12} />
              <Tooltip contentStyle={tooltipStyle} />
              <Bar dataKey="count" name="Images" fill="var(--water)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <p className="text-xs" style={{ color: "var(--text-muted)" }}>
          Note: histogram bins are approximated from dataset statistics. Exact per-image values are in the training pipeline logs.
        </p>
      </div>

      {/* Test sample grid */}
      <div className="space-y-4">
        <h2 className="text-h3" style={{ color: "var(--text)" }}>Test split samples</h2>
        <p className="text-small" style={{ color: "var(--text-2)" }}>
          6 of the 44 held-out test images, shown as served from the static cache. Water % is from the ground-truth mask.
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          {TEST_SAMPLES.map((s) => (
            <div
              key={s.id}
              className="rounded-xl overflow-hidden"
              style={{ border: "1px solid var(--border)", background: "var(--surface-1)" }}
            >
              <div className="relative" style={{ aspectRatio: "4/3" }}>
                <img src={s.url} alt={s.label} className="h-full w-full object-cover" />
                <div
                  className="absolute bottom-0 left-0 right-0 px-3 py-2"
                  style={{ background: "linear-gradient(transparent, rgba(0,0,0,0.8))" }}
                >
                  <p className="text-xs text-white font-medium">{s.label}</p>
                </div>
              </div>
              <div className="px-3 py-2 flex items-center justify-between">
                <span className="text-xs" style={{ color: "var(--text-muted)" }}>Water pixels (GT)</span>
                <span className="font-mono text-sm font-semibold" style={{ color: "var(--water)" }}>
                  {s.waterPct}%
                </span>
              </div>
            </div>
          ))}
        </div>
        <div className="text-center pt-2">
          <Link
            href="/analyze"
            className="inline-flex items-center gap-2 text-sm font-medium hover:underline"
            style={{ color: "var(--link)" }}
          >
            Run HydroVision on a test image
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </div>
  );
}

