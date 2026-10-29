"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  UploadCloud,
  Layers,
  Eye,
  Download,
  FileText,
  Sliders,
  RefreshCw,
  AlertTriangle,
  X,
} from "lucide-react";
import {
  predictImage,
  downloadReport,
  fetchSamples,
  PredictResponse,
  SampleItem,
} from "@/lib/api";

type ActiveLayer = "overlay" | "mask" | "uncertainty" | "gradcam";

const LAYER_LABELS: Record<ActiveLayer, string> = {
  overlay: "Flood overlay",
  mask: "Water mask",
  uncertainty: "Uncertainty",
  gradcam: "Grad-CAM",
};

export default function AnalyzePage() {
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [samples, setSamples] = useState<SampleItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [reportLoading, setReportLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<PredictResponse | null>(null);

  const [explain, setExplain] = useState(true);
  const [uncertainty, setUncertainty] = useState(true);
  const [useOnnx, setUseOnnx] = useState(false);

  const [activeLayer, setActiveLayer] = useState<ActiveLayer>("overlay");
  const [opacity, setOpacity] = useState(0.8);
  const [sliderPos, setSliderPos] = useState(50);
  const containerRef = useRef<HTMLDivElement>(null);
  const dragging = useRef(false);

  // Load samples & auto-load first on mount
  useEffect(() => {
    async function loadSamples() {
      const data = await fetchSamples();
      setSamples(data);
      if (data.length > 0) {
        doSelectSample(data[0]);
      }
    }
    loadSamples();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const doSelectSample = async (sample: SampleItem) => {
    try {
      setLoading(true);
      setError(null);
      setPreviewUrl(sample.url);

      if (sample.prediction) {
        setResult(sample.prediction);
        setLoading(false);
        return;
      }

      const res = await fetch(sample.url);
      const blob = await res.blob();
      const sampleFile = new File([blob], sample.filename || "sample.jpg", { type: "image/jpeg" });
      setFile(sampleFile);
      const pred = await predictImage(sampleFile, sampleFile.name, explain, uncertainty, useOnnx);
      setResult(pred);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to analyze sample";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = (f: File) => {
    setFile(f);
    setPreviewUrl(URL.createObjectURL(f));
    runInference(f);
  };

  const runInference = async (targetFile?: File) => {
    const f = targetFile || file;
    if (!f) return;
    try {
      setLoading(true);
      setError(null);
      const pred = await predictImage(f, f.name, explain, uncertainty, useOnnx);
      setResult(pred);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Inference failed";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadReport = async () => {
    if (!file) return;
    try {
      setReportLoading(true);
      const blob = await downloadReport(file, file.name, explain, uncertainty);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `hydrovision_report_${Date.now()}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Report failed";
      alert("Failed to download PDF report: " + msg);
    } finally {
      setReportLoading(false);
    }
  };

  const handleDownloadOverlay = () => {
    if (!result) return;
    const a = document.createElement("a");
    a.href = `data:image/png;base64,${result.overlay_png_base64}`;
    a.download = `hydrovision_overlay_${Date.now()}.png`;
    a.click();
  };

  const updateSlider = (clientX: number) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const pct = Math.round(Math.max(0, Math.min(100, ((clientX - rect.left) / rect.width) * 100)));
    setSliderPos(pct);
  };

  const handleKeySlider = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowLeft") setSliderPos((p) => Math.max(0, p - 5));
    if (e.key === "ArrowRight") setSliderPos((p) => Math.min(100, p + 5));
  };

  const getActiveLayerSrc = () => {
    if (!result) return null;
    if (activeLayer === "mask") return `data:image/png;base64,${result.mask_png_base64}`;
    if (activeLayer === "uncertainty" && result.uncertainty_png_base64)
      return `data:image/png;base64,${result.uncertainty_png_base64}`;
    if (activeLayer === "gradcam" && result.gradcam_png_base64)
      return `data:image/png;base64,${result.gradcam_png_base64}`;
    return `data:image/png;base64,${result.overlay_png_base64}`;
  };

  const getRiskStyle = (pct: number) => {
    if (pct > 40) return { color: "var(--alert)" };
    if (pct > 15) return { color: "var(--uncertain)" };
    return { color: "var(--ok)" };
  };

  const getRiskLabel = (pct: number) => {
    if (pct > 40) return "High water coverage";
    if (pct > 15) return "Moderate water coverage";
    return "Low water coverage";
  };

  const highUncertainty = result?.mean_uncertainty && result.mean_uncertainty > 0.2;

  return (
    <div className="container-workspace py-8 space-y-8">
      {/* Header */}
      <div
        className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6"
        style={{ borderBottom: "1px solid var(--border)" }}
      >
        <div>
          <span
            className="inline-block rounded px-2 py-0.5 text-xs font-semibold mb-2"
            style={{ background: "rgba(34,211,238,0.1)", color: "var(--water)", border: "1px solid rgba(34,211,238,0.25)" }}
          >
            Inference workspace
          </span>
          <h1 className="text-h2" style={{ color: "var(--text)" }}>
            Analyze an aerial image
          </h1>
          <p className="text-small mt-1" style={{ color: "var(--text-2)" }}>
            Model: U-Net MobileNetV2 · Test Dice 0.884 · 44 held-out test images
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleDownloadReport}
            disabled={!result || reportLoading}
            className="flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition-all disabled:opacity-50"
            style={{
              border: "1px solid var(--border)",
              background: "var(--surface-1)",
              color: "var(--text-2)",
            }}
          >
            <FileText className="h-4 w-4" />
            <span>{reportLoading ? "Generating…" : "Download PDF report"}</span>
          </button>
          <button
            onClick={handleDownloadOverlay}
            disabled={!result}
            className="flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition-all disabled:opacity-50"
            style={{
              border: "1px solid rgba(34,211,238,0.3)",
              background: "rgba(34,211,238,0.08)",
              color: "var(--water)",
            }}
          >
            <Download className="h-4 w-4" />
            <span>Download PNG</span>
          </button>
        </div>
      </div>

      {/* High uncertainty banner */}
      {highUncertainty && (
        <div
          className="flex items-start gap-3 rounded-xl px-4 py-3 text-sm"
          style={{
            background: "rgba(251,191,36,0.1)",
            border: "1px solid rgba(251,191,36,0.3)",
            color: "var(--uncertain)",
          }}
        >
          <AlertTriangle className="h-5 w-5 flex-shrink-0 mt-0.5" />
          <p>
            <strong>High uncertainty detected</strong> — mean uncertainty {result?.mean_uncertainty?.toFixed(3)}.
            The model is less confident on this image; predictions at edges or shadowed regions may be less reliable.
          </p>
        </div>
      )}

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left: Upload + Samples + Options */}
        <div className="lg:col-span-5 space-y-5">
          {/* Upload Zone */}
          <div
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault();
              if (e.dataTransfer.files?.[0]) handleFileUpload(e.dataTransfer.files[0]);
            }}
            className="relative flex flex-col items-center justify-center rounded-xl text-center transition-all cursor-pointer"
            style={{
              border: "2px dashed var(--border-strong)",
              background: "var(--surface-1)",
              padding: "2rem 1rem",
              minHeight: 130,
            }}
          >
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={(e) => { if (e.target.files?.[0]) handleFileUpload(e.target.files[0]); }}
              className="absolute inset-0 cursor-pointer opacity-0"
              aria-label="Upload aerial image"
            />
            <div
              className="flex h-11 w-11 items-center justify-center rounded-xl mb-3"
              style={{ background: "rgba(34,211,238,0.1)", border: "1px solid rgba(34,211,238,0.3)", color: "var(--water)" }}
            >
              <UploadCloud className="h-5 w-5" />
            </div>
            <p className="text-sm font-semibold" style={{ color: "var(--text)" }}>
              Drop drone or aerial imagery here
            </p>
            <p className="mt-1 text-small" style={{ color: "var(--text-muted)" }}>
              JPEG or PNG · up to 10 MB
            </p>
          </div>

          {/* Test Sample Grid */}
          <div
            className="rounded-xl p-4 space-y-3"
            style={{ border: "1px solid var(--border)", background: "var(--surface-1)" }}
          >
            <div className="flex items-center justify-between">
              <span className="text-label">Or pick a test sample</span>
              <span className="text-xs font-medium" style={{ color: "var(--water)" }}>
                {samples.length} available
              </span>
            </div>
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
              {samples.map((s, idx) => (
                <button
                  key={s.id ?? idx}
                  onClick={() => doSelectSample(s)}
                  className="group relative overflow-hidden rounded-lg transition-all"
                  style={{
                    border: `1px solid ${previewUrl === s.url ? "var(--water)" : "var(--border)"}`,
                    boxShadow: previewUrl === s.url ? "var(--glow)" : "none",
                  }}
                  aria-label={`Load sample ${idx + 1}: ${s.water_percentage}% water`}
                >
                  <img
                    src={s.url}
                    alt={`Test sample ${idx + 1}`}
                    className="h-16 w-full object-cover"
                  />
                  <div
                    className="absolute bottom-0 left-0 right-0 px-1 py-1 text-center"
                    style={{ background: "rgba(0,0,0,0.65)" }}
                  >
                    <span
                      className="block font-mono text-xs"
                      style={{ color: "var(--water)", fontSize: "11px" }}
                    >
                      {s.water_percentage ? `${s.water_percentage}%` : "—"}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Options */}
          <div
            className="rounded-xl p-4 space-y-4"
            style={{ border: "1px solid var(--border)", background: "var(--surface-1)" }}
          >
            <span className="text-label block">Options</span>
            {[
              {
                label: "Grad-CAM explainability",
                desc: "Backprop activation gradients from decoder",
                val: explain,
                set: setExplain,
              },
              {
                label: "TTA uncertainty map",
                desc: "4-pass test-time augmentation (slower)",
                val: uncertainty,
                set: setUncertainty,
              },
              {
                label: "ONNX Runtime",
                desc: "~31 ms vs ~80 ms PyTorch CPU",
                val: useOnnx,
                set: setUseOnnx,
              },
            ].map((item) => (
              <label key={item.label} className="flex items-center justify-between cursor-pointer gap-3">
                <div>
                  <div className="text-sm font-medium" style={{ color: "var(--text)" }}>
                    {item.label}
                  </div>
                  <div className="text-xs" style={{ color: "var(--text-muted)" }}>
                    {item.desc}
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={item.val}
                  onChange={(e) => item.set(e.target.checked)}
                  className="h-4 w-4 rounded"
                  style={{ accentColor: "var(--water)" }}
                />
              </label>
            ))}

            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium" style={{ color: "var(--text)" }}>
                  Overlay opacity
                </span>
                <span className="font-mono text-sm" style={{ color: "var(--water)" }}>
                  {Math.round(opacity * 100)}%
                </span>
              </div>
              <input
                type="range"
                min={0.2}
                max={1}
                step={0.05}
                value={opacity}
                onChange={(e) => setOpacity(Number(e.target.value))}
                className="w-full"
                style={{ accentColor: "var(--water)" }}
                aria-label="Overlay opacity"
              />
            </div>

            <button
              onClick={() => runInference()}
              disabled={!file || loading}
              className="flex w-full items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-semibold transition-all disabled:opacity-50"
              style={{ background: "var(--btn-primary-bg)", color: "var(--btn-primary-fg)" }}
            >
              <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
              <span>{loading ? "Running U-Net…" : "Re-run inference"}</span>
            </button>
          </div>
        </div>

        {/* Right: Viewer */}
        <div className="lg:col-span-7 space-y-5">
          {/* Layer toggles - Mobile Responsive */}
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex flex-wrap gap-1.5 sm:gap-2">
              {(["overlay", "mask", "uncertainty", "gradcam"] as ActiveLayer[]).map((layer) => (
                <button
                  key={layer}
                  onClick={() => setActiveLayer(layer)}
                  className="rounded-full px-3 sm:px-4 py-1.5 text-xs sm:text-sm font-medium transition-all"
                  style={{
                    background: activeLayer === layer ? "rgba(34,211,238,0.15)" : "var(--surface-1)",
                    color: activeLayer === layer ? "var(--water)" : "var(--text-2)",
                    border: `1px solid ${activeLayer === layer ? "rgba(34,211,238,0.3)" : "var(--border)"}`,
                  }}
                >
                  {LAYER_LABELS[layer]}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-3 text-xs" style={{ color: "var(--text-muted)" }}>
              <span className="flex items-center gap-1">
                <span className="inline-block h-2.5 w-2.5 rounded-sm" style={{ background: "var(--water)" }} />
                Water mask
              </span>
              <span className="flex items-center gap-1">
                <span className="inline-block h-2.5 w-2.5 rounded-sm" style={{ background: "var(--uncertain)" }} />
                Uncertain
              </span>
            </div>
          </div>

          {/* Image viewer */}
          <div
            ref={containerRef}
            className="relative rounded-xl overflow-hidden select-none"
            style={{
              aspectRatio: "16/9",
              background: "var(--surface-2)",
              border: "1px solid var(--border)",
              cursor: "col-resize",
            }}
            onMouseDown={() => { dragging.current = true; }}
            onMouseUp={() => { dragging.current = false; }}
            onMouseLeave={() => { dragging.current = false; }}
            onMouseMove={(e) => { if (dragging.current) updateSlider(e.clientX); }}
            onTouchStart={() => { dragging.current = true; }}
            onTouchEnd={() => { dragging.current = false; }}
            onTouchMove={(e) => updateSlider(e.touches[0].clientX)}
            onKeyDown={handleKeySlider}
            tabIndex={0}
            role="slider"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={sliderPos}
            aria-label="Before/after comparison slider"
          >
            {/* Loading overlay */}
            {loading && (
              <div className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-3"
                style={{ background: "rgba(5,11,24,0.85)" }}>
                <div
                  className="absolute top-0 left-0 h-1 animate-pulse"
                  style={{ width: "60%", background: "var(--water)", boxShadow: "var(--glow)" }}
                />
                <div
                  className="h-10 w-10 rounded-full border-2 animate-spin"
                  style={{ borderColor: "var(--water)", borderTopColor: "transparent" }}
                />
                <p className="text-sm font-medium" style={{ color: "var(--water)" }}>Running U-Net…</p>
              </div>
            )}

            {/* Idle state */}
            {!loading && !previewUrl && (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-3"
                style={{ color: "var(--text-muted)" }}>
                <Layers className="h-12 w-12 opacity-30" />
                <p className="text-sm">Select a test sample or upload an image</p>
              </div>
            )}

            {/* Base image */}
            {previewUrl && (
              <img
                src={previewUrl}
                alt="Input aerial image"
                className="absolute inset-0 h-full w-full object-contain"
              />
            )}

            {/* Active layer (clipped) */}
            {getActiveLayerSrc() && (
              <div
                className="absolute inset-0"
                style={{ clipPath: `inset(0 ${100 - sliderPos}% 0 0)`, opacity }}
              >
                <img
                  src={getActiveLayerSrc()!}
                  alt={`${LAYER_LABELS[activeLayer]} layer`}
                  className="h-full w-full object-contain"
                />
              </div>
            )}

            {/* Divider */}
            {previewUrl && (
              <div
                className="pointer-events-none absolute inset-y-0"
                style={{ left: `${sliderPos}%`, width: 2, background: "var(--water)", boxShadow: "var(--glow)" }}
              >
                <div
                  className="absolute top-1/2 -translate-x-1/2 -translate-y-1/2 flex h-8 w-8 items-center justify-center rounded-full"
                  style={{ border: "2px solid var(--water)", background: "var(--surface-1)", boxShadow: "var(--glow)" }}
                >
                  <Sliders className="h-3.5 w-3.5 rotate-90" style={{ color: "var(--water)" }} />
                </div>
              </div>
            )}

            {/* Corner labels */}
            {previewUrl && (
              <>
                <div className="pointer-events-none absolute bottom-3 left-3 rounded-lg px-2.5 py-1 text-xs font-medium backdrop-blur-md"
                  style={{ background: "rgba(0,0,0,0.7)", color: "var(--text)" }}>
                  {LAYER_LABELS[activeLayer]}
                </div>
                <div className="pointer-events-none absolute bottom-3 right-3 rounded-lg px-2.5 py-1 text-xs backdrop-blur-md"
                  style={{ background: "rgba(0,0,0,0.7)", color: "var(--text-muted)" }}>
                  Raw image
                </div>
              </>
            )}
          </div>

          <p className="text-xs" style={{ color: "var(--text-muted)" }}>
            ← Drag or use arrow keys to compare raw vs {LAYER_LABELS[activeLayer]} · {sliderPos}% revealed
          </p>

          {/* Error state */}
          {error && (
            <div
              className="flex items-center gap-3 rounded-xl px-4 py-3 text-sm"
              style={{ background: "rgba(248,113,113,0.1)", border: "1px solid rgba(248,113,113,0.3)", color: "var(--alert)" }}
            >
              <X className="h-5 w-5 flex-shrink-0" />
              <div>
                <p className="font-semibold">Analysis failed</p>
                <p className="text-xs mt-0.5" style={{ color: "var(--text-2)" }}>{error}</p>
              </div>
              <button onClick={() => { setError(null); runInference(); }} className="ml-auto flex items-center gap-1 text-xs underline">
                Retry
              </button>
            </div>
          )}

          {/* Stat Cards */}
          {result && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="rounded-xl p-4 space-y-1" style={{ border: "1px solid var(--border)", background: "var(--surface-1)" }}>
                <span className="text-label block">Water pixels</span>
                <div className="text-2xl font-mono font-semibold tabular-nums" style={getRiskStyle(result.water_pixel_percentage)}>
                  {result.water_pixel_percentage}%
                </div>
                <span className="text-xs" style={{ color: "var(--text-muted)" }}>
                  {getRiskLabel(result.water_pixel_percentage)}
                </span>
              </div>

              <div className="rounded-xl p-4 space-y-1" style={{ border: "1px solid var(--border)", background: "var(--surface-1)" }}>
                <span className="text-label block">TTA Uncertainty</span>
                <div className="text-2xl font-mono font-semibold tabular-nums" style={{ color: highUncertainty ? "var(--uncertain)" : "var(--ok)" }}>
                  {result.mean_uncertainty !== null ? result.mean_uncertainty : "N/A"}
                </div>
                <span className="text-xs" style={{ color: "var(--text-muted)" }}>Pixel std dev</span>
              </div>

              <div className="rounded-xl p-4 space-y-1" style={{ border: "1px solid var(--border)", background: "var(--surface-1)" }}>
                <span className="text-label block">Inference time</span>
                <div className="text-2xl font-mono font-semibold tabular-nums" style={{ color: "var(--water)" }}>
                  {result.inference_ms} ms
                </div>
                <span className="text-xs" style={{ color: "var(--text-muted)" }}>
                  {useOnnx ? "ONNX Runtime CPU" : "PyTorch CPU"}
                </span>
              </div>

              <div className="rounded-xl p-4 space-y-1" style={{ border: "1px solid var(--border)", background: "var(--surface-1)" }}>
                <span className="text-label block">Sigmoid cutoff</span>
                <div className="text-2xl font-mono font-semibold tabular-nums" style={{ color: "var(--text)" }}>
                  {result.threshold}
                </div>
                <span className="text-xs" style={{ color: "var(--text-muted)" }}>Optimal F1 threshold</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
