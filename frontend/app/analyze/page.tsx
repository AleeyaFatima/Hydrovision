"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  UploadCloud,
  Layers,
  ShieldAlert,
  Eye,
  Download,
  FileText,
  Sliders,
  CheckCircle2,
  RefreshCw,
  Cpu,
  Zap,
  Info,
} from "lucide-react";
import {
  predictImage,
  downloadReport,
  fetchSamples,
  PredictResponse,
  SampleItem,
} from "@/lib/api";

type ActiveLayer = "overlay" | "mask" | "uncertainty" | "gradcam";

export default function AnalyzePage() {
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [samples, setSamples] = useState<SampleItem[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [reportLoading, setReportLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<PredictResponse | null>(null);

  // Settings
  const [explain, setExplain] = useState<boolean>(true);
  const [uncertainty, setUncertainty] = useState<boolean>(true);
  const [useOnnx, setUseOnnx] = useState<boolean>(false);

  // Display state
  const [activeLayer, setActiveLayer] = useState<ActiveLayer>("overlay");
  const [opacity, setOpacity] = useState<number>(0.8);
  const [sliderPos, setSliderPos] = useState<number>(50); // for before/after comparison slider
  const containerRef = useRef<HTMLDivElement>(null);

  // Load sample images on mount
  useEffect(() => {
    async function loadSamples() {
      const data = await fetchSamples();
      setSamples(data);
      // Auto-load sample 1 if available
      if (data.length > 0) {
        selectSample(data[0]);
      }
    }
    loadSamples();
  }, []);

  const selectSample = async (sample: SampleItem) => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch(sample.url);
      const blob = await res.blob();
      const sampleFile = new File([blob], sample.name, { type: "image/jpeg" });
      setFile(sampleFile);
      setPreviewUrl(sample.url);

      // Run initial inference on selected sample
      const pred = await predictImage(sampleFile, sample.name, explain, uncertainty, useOnnx);
      setResult(pred);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Failed to analyze sample");
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = (uploadedFile: File) => {
    setFile(uploadedFile);
    const url = URL.createObjectURL(uploadedFile);
    setPreviewUrl(url);
    runInference(uploadedFile);
  };

  const runInference = async (targetFile?: File) => {
    const f = targetFile || file;
    if (!f) return;

    try {
      setLoading(true);
      setError(null);
      const pred = await predictImage(f, f.name, explain, uncertainty, useOnnx);
      setResult(pred);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Inference failed");
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadReport = async () => {
    if (!file) return;
    try {
      setReportLoading(true);
      const pdfBlob = await downloadReport(file, file.name, explain, uncertainty);
      const url = window.URL.createObjectURL(pdfBlob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `aquamap_report_${Date.now()}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err: any) {
      console.error(err);
      alert("Failed to download PDF report: " + err.message);
    } finally {
      setReportLoading(false);
    }
  };

  const handleDownloadOverlay = () => {
    if (!result) return;
    const a = document.createElement("a");
    a.href = `data:image/png;base64,${result.overlay_png_base64}`;
    a.download = `aquamap_overlay_${Date.now()}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handleSliderMove = (e: React.MouseEvent<HTMLDivElement> | React.TouchEvent<HTMLDivElement>) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const clientX = "touches" in e ? e.touches[0].clientX : e.clientX;
    const x = clientX - rect.left;
    const pct = Math.max(0, Math.min(100, (x / rect.width) * 100));
    setSliderPos(Math.round(pct));
  };

  // Determine current active image source
  const getActiveLayerSrc = () => {
    if (!result) return null;
    if (activeLayer === "mask") {
      return `data:image/png;base64,${result.mask_png_base64}`;
    }
    if (activeLayer === "uncertainty" && result.uncertainty_png_base64) {
      return `data:image/png;base64,${result.uncertainty_png_base64}`;
    }
    if (activeLayer === "gradcam" && result.gradcam_png_base64) {
      return `data:image/png;base64,${result.gradcam_png_base64}`;
    }
    return `data:image/png;base64,${result.overlay_png_base64}`;
  };

  const getRiskColor = (pct: number) => {
    if (pct > 40) return "text-accent-coral";
    if (pct > 15) return "text-accent-amber";
    return "text-accent-emerald";
  };

  const getRiskLabel = (pct: number) => {
    if (pct > 40) return "Severe Inundation";
    if (pct > 15) return "Moderate Flooding";
    return "Localized Water";
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/10 pb-6">
        <div>
          <div className="flex items-center gap-2">
            <span className="rounded bg-accent-cyan/15 px-2 py-0.5 font-mono text-xs font-semibold text-accent-cyan border border-accent-cyan/30">
              LIVE INFERENCE WORKSPACE
            </span>
            <span className="text-xs text-slate-400">Model: U-Net MobileNetV2 (Dice 0.884)</span>
          </div>
          <h1 className="mt-2 text-2xl sm:text-3xl font-bold text-white">
            Aerial Drone Segmentation & Forensics
          </h1>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-3">
          <button
            onClick={handleDownloadReport}
            disabled={!result || reportLoading}
            className="flex items-center gap-2 rounded-xl bg-purple-600/20 border border-purple-500/40 px-4 py-2 text-xs font-semibold text-purple-300 hover:bg-purple-600/30 transition-all disabled:opacity-50"
          >
            <FileText className="h-4 w-4" />
            <span>{reportLoading ? "Compiling PDF..." : "Export PDF Dossier"}</span>
          </button>
          <button
            onClick={handleDownloadOverlay}
            disabled={!result}
            className="flex items-center gap-2 rounded-xl bg-accent-cyan/15 border border-accent-cyan/30 px-4 py-2 text-xs font-semibold text-accent-cyan hover:bg-accent-cyan/25 transition-all disabled:opacity-50"
          >
            <Download className="h-4 w-4" />
            <span>Download PNG</span>
          </button>
        </div>
      </div>

      {/* Main Workspace Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Upload, Settings & Test Samples (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          {/* Drag & Drop Upload Zone */}
          <div
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault();
              if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                handleFileUpload(e.dataTransfer.files[0]);
              }
            }}
            className="relative flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-white/20 bg-surface/60 p-8 text-center transition-all hover:border-accent-cyan/60 hover:bg-surface-elevated/40"
          >
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={(e) => {
                if (e.target.files && e.target.files[0]) {
                  handleFileUpload(e.target.files[0]);
                }
              }}
              className="absolute inset-0 cursor-pointer opacity-0"
            />
            <div className="h-12 w-12 rounded-xl bg-accent-cyan/10 border border-accent-cyan/30 flex items-center justify-center text-accent-cyan mb-3">
              <UploadCloud className="h-6 w-6" />
            </div>
            <p className="text-sm font-semibold text-white">Drop drone imagery here</p>
            <p className="mt-1 text-xs text-slate-400">
              Supports JPEG, PNG up to 25MB • Automatically scaled for neural inference
            </p>
          </div>

          {/* Test Set Sample Picker */}
          <div className="rounded-2xl border border-white/10 bg-surface/80 p-5 backdrop-blur-md space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono font-semibold text-slate-300">
                OR SELECT UNSEEN TEST SAMPLE ({samples.length})
              </span>
              <span className="text-[10px] text-accent-cyan font-mono">Real Kaggle Split</span>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {samples.map((s, idx) => (
                <button
                  key={s.id || idx}
                  onClick={() => selectSample(s)}
                  className={`group relative overflow-hidden rounded-lg border text-left transition-all ${
                    previewUrl === s.url
                      ? "border-accent-cyan shadow-cyan-glow"
                      : "border-white/10 hover:border-white/30"
                  }`}
                >
                  <img
                    src={s.url}
                    alt={s.name}
                    className="h-16 w-full object-cover group-hover:scale-105 transition-transform"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex items-end p-1.5">
                    <span className="font-mono text-[9px] text-slate-200 truncate">
                      {s.water_percentage ? `${s.water_percentage}%` : s.name}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Inference Settings */}
          <div className="rounded-2xl border border-white/10 bg-surface/80 p-5 backdrop-blur-md space-y-4">
            <span className="text-xs font-mono font-semibold text-slate-300 block">
              DIAGNOSTIC TOGGLES
            </span>

            <div className="space-y-3">
              <label className="flex items-center justify-between cursor-pointer">
                <div>
                  <div className="text-xs font-medium text-white">Grad-CAM Spatial Explainability</div>
                  <div className="text-[11px] text-slate-400">Backprop activation gradients from decoder</div>
                </div>
                <input
                  type="checkbox"
                  checked={explain}
                  onChange={(e) => {
                    setExplain(e.target.checked);
                    if (file) runInference();
                  }}
                  className="rounded border-white/20 bg-surface-elevated text-accent-cyan focus:ring-accent-cyan"
                />
              </label>

              <label className="flex items-center justify-between cursor-pointer">
                <div>
                  <div className="text-xs font-medium text-white">Test-Time Uncertainty (TTA)</div>
                  <div className="text-[11px] text-slate-400">Standard deviation across 4 geometric flips</div>
                </div>
                <input
                  type="checkbox"
                  checked={uncertainty}
                  onChange={(e) => {
                    setUncertainty(e.target.checked);
                    if (file) runInference();
                  }}
                  className="rounded border-white/20 bg-surface-elevated text-accent-cyan focus:ring-accent-cyan"
                />
              </label>

              <label className="flex items-center justify-between cursor-pointer border-t border-white/5 pt-3">
                <div>
                  <div className="text-xs font-medium text-white flex items-center gap-1.5">
                    <Zap className="h-3.5 w-3.5 text-accent-emerald" />
                    <span>ONNX Runtime Engine</span>
                  </div>
                  <div className="text-[11px] text-slate-400">30.9ms optimized CPU inference</div>
                </div>
                <input
                  type="checkbox"
                  checked={useOnnx}
                  onChange={(e) => {
                    setUseOnnx(e.target.checked);
                    if (file) runInference();
                  }}
                  className="rounded border-white/20 bg-surface-elevated text-accent-cyan focus:ring-accent-cyan"
                />
              </label>
            </div>
          </div>
        </div>

        {/* Right Column: Interactive Diagnostic Viewer & Telemetry (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          {/* Main Visual Display Card */}
          <div className="rounded-2xl border border-white/10 bg-surface/80 p-5 backdrop-blur-md space-y-4">
            {/* Top Toolbar: Layer Selector & Opacity */}
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-4">
              <div className="flex flex-wrap gap-1.5">
                {(
                  [
                    { id: "overlay", label: "Cyan Overlay" },
                    { id: "mask", label: "Binary Mask" },
                    { id: "uncertainty", label: "TTA Uncertainty" },
                    { id: "gradcam", label: "Grad-CAM" },
                  ] as const
                ).map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveLayer(tab.id)}
                    className={`rounded-lg px-3 py-1 text-xs font-medium transition-all ${
                      activeLayer === tab.id
                        ? "bg-accent-cyan text-black font-semibold shadow-cyan-glow"
                        : "bg-surface-elevated text-slate-400 hover:text-white border border-white/5"
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              {/* Opacity Slider */}
              <div className="flex items-center gap-2">
                <span className="text-[11px] text-slate-400 font-mono">Opacity:</span>
                <input
                  type="range"
                  min="0.1"
                  max="1.0"
                  step="0.05"
                  value={opacity}
                  onChange={(e) => setOpacity(parseFloat(e.target.value))}
                  className="w-20 accent-accent-cyan"
                />
                <span className="text-[11px] font-mono text-white w-7">
                  {Math.round(opacity * 100)}%
                </span>
              </div>
            </div>

            {/* Interactive Image Frame */}
            <div
              ref={containerRef}
              onMouseMove={handleSliderMove}
              onTouchMove={handleSliderMove}
              className="relative h-[360px] sm:h-[460px] w-full cursor-ew-resize select-none overflow-hidden rounded-xl border border-white/10 bg-black"
            >
              {loading && (
                <div className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-black/70 backdrop-blur-sm space-y-3">
                  <div className="h-8 w-8 rounded-full border-2 border-accent-cyan border-t-transparent animate-spin" />
                  <span className="font-mono text-xs text-accent-cyan">
                    Executing neural segmentation...
                  </span>
                </div>
              )}

              {error && (
                <div className="absolute inset-0 z-30 flex items-center justify-center bg-black/85 p-6 text-center text-accent-coral text-xs">
                  {error}
                </div>
              )}

              {/* Base Raw Image */}
              {previewUrl && (
                <img
                  src={previewUrl}
                  alt="Raw Aerial Drone"
                  className="absolute inset-0 h-full w-full object-contain"
                />
              )}

              {/* Active Diagnostic Layer (Clipped by Before/After Slider) */}
              {getActiveLayerSrc() && (
                <div
                  className="absolute inset-0 transition-none"
                  style={{
                    clipPath: `inset(0 ${100 - sliderPos}% 0 0)`,
                    opacity: opacity,
                  }}
                >
                  <img
                    src={getActiveLayerSrc()!}
                    alt="Active Layer"
                    className="h-full w-full object-contain"
                  />
                </div>
              )}

              {/* Laser Wipe Divider Line */}
              <div
                className="pointer-events-none absolute bottom-0 top-0 w-0.5 bg-accent-cyan shadow-[0_0_12px_2px_rgba(34,211,238,0.7)]"
                style={{ left: `${sliderPos}%` }}
              >
                <div className="absolute top-1/2 -translate-x-1/2 -translate-y-1/2 flex h-8 w-8 items-center justify-center rounded-full border-2 border-accent-cyan bg-surface/90 shadow-cyan-glow">
                  <Sliders className="h-3.5 w-3.5 text-accent-cyan rotate-90" />
                </div>
              </div>

              {/* Bottom Labels */}
              <div className="pointer-events-none absolute bottom-3 left-3 rounded-lg bg-black/80 px-2.5 py-1 text-[10px] font-mono text-slate-300 backdrop-blur-md border border-white/10">
                ACTIVE: {activeLayer.toUpperCase()}
              </div>
              <div className="pointer-events-none absolute bottom-3 right-3 rounded-lg bg-black/80 px-2.5 py-1 text-[10px] font-mono text-slate-400 backdrop-blur-md border border-white/10">
                RAW CAPTURE
              </div>
            </div>

            <div className="flex items-center justify-between text-[11px] text-slate-400 font-mono">
              <span>← Wipe to compare raw image vs {activeLayer}</span>
              <span className="text-accent-cyan">Divider: {sliderPos}%</span>
            </div>
          </div>

          {/* Telemetry Stat Cards */}
          {result && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {/* Stat 1: Water Percentage */}
              <div className="rounded-xl border border-white/10 bg-surface/80 p-4 backdrop-blur-md space-y-1">
                <span className="text-[10px] font-mono text-slate-400 block uppercase">
                  Flood Inundation
                </span>
                <div className={`text-2xl font-mono font-bold ${getRiskColor(result.water_pixel_percentage)}`}>
                  {result.water_pixel_percentage}%
                </div>
                <span className="text-[10px] text-slate-400 block">
                  {getRiskLabel(result.water_pixel_percentage)}
                </span>
              </div>

              {/* Stat 2: Mean Uncertainty */}
              <div className="rounded-xl border border-white/10 bg-surface/80 p-4 backdrop-blur-md space-y-1">
                <span className="text-[10px] font-mono text-slate-400 block uppercase">
                  TTA Uncertainty
                </span>
                <div className="text-2xl font-mono font-bold text-accent-amber">
                  {result.mean_uncertainty !== null ? result.mean_uncertainty : "N/A"}
                </div>
                <span className="text-[10px] text-slate-400 block">
                  Boundary Std Dev
                </span>
              </div>

              {/* Stat 3: Latency */}
              <div className="rounded-xl border border-white/10 bg-surface/80 p-4 backdrop-blur-md space-y-1">
                <span className="text-[10px] font-mono text-slate-400 block uppercase">
                  Inference Time
                </span>
                <div className="text-2xl font-mono font-bold text-accent-cyan">
                  {result.inference_ms} ms
                </div>
                <span className="text-[10px] text-slate-400 block font-mono">
                  {useOnnx ? "ONNX Runtime" : "PyTorch MPS"}
                </span>
              </div>

              {/* Stat 4: Threshold */}
              <div className="rounded-xl border border-white/10 bg-surface/80 p-4 backdrop-blur-md space-y-1">
                <span className="text-[10px] font-mono text-slate-400 block uppercase">
                  Sigmoid Cutoff
                </span>
                <div className="text-2xl font-mono font-bold text-white">
                  {result.threshold}
                </div>
                <span className="text-[10px] text-slate-400 block">
                  Optimal F1 Cutoff
                </span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

