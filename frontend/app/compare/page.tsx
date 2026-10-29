"use client";

import React, { useState, useEffect } from "react";
import {
  Activity,
  ArrowRight,
  UploadCloud,
  CheckCircle2,
  AlertCircle,
  Info,
  AlertTriangle,
} from "lucide-react";
import { compareImages, CompareResponse, fetchSamples, SampleItem } from "@/lib/api";

export default function ComparePage() {
  const [beforeFile, setBeforeFile] = useState<File | null>(null);
  const [afterFile, setAfterFile] = useState<File | null>(null);
  const [beforePreview, setBeforePreview] = useState<string | null>(null);
  const [afterPreview, setAfterPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<CompareResponse | null>(null);

  useEffect(() => {
    async function loadSamples() {
      const data = await fetchSamples();
      if (data.length >= 2) {
        doLoadPair(data[1], data[5] || data[0]);
      }
    }
    loadSamples();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const doLoadPair = async (beforeItem: SampleItem, afterItem: SampleItem) => {
    try {
      setLoading(true);
      setError(null);
      const [bBlob, aBlob] = await Promise.all([
        fetch(beforeItem.url).then((r) => r.blob()),
        fetch(afterItem.url).then((r) => r.blob()),
      ]);
      const fileB = new File([bBlob], beforeItem.filename || "before.jpg", { type: "image/jpeg" });
      const fileA = new File([aBlob], afterItem.filename || "after.jpg", { type: "image/jpeg" });
      setBeforeFile(fileB);
      setAfterFile(fileA);
      setBeforePreview(beforeItem.url);
      setAfterPreview(afterItem.url);
      const comp = await compareImages(fileB, fileA, fileB.name, fileA.name);
      setResult(comp);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Comparison failed";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleRunComparison = async () => {
    if (!beforeFile || !afterFile) return;
    try {
      setLoading(true);
      setError(null);
      const comp = await compareImages(beforeFile, afterFile, beforeFile.name, afterFile.name);
      setResult(comp);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Comparison failed";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container-workspace py-8 space-y-8">
      {/* Header */}
      <div style={{ borderBottom: "1px solid var(--border)" }} className="pb-6">
        <span
          className="inline-block rounded px-2 py-0.5 text-xs font-semibold mb-2"
          style={{ background: "rgba(34,211,238,0.1)", color: "var(--water)", border: "1px solid rgba(34,211,238,0.25)" }}
        >
          Temporal change detection
        </span>
        <h1 className="text-h2" style={{ color: "var(--text)" }}>
          Compare two aerial images
        </h1>
        <p className="text-body mt-2" style={{ color: "var(--text-2)", maxWidth: "65ch" }}>
          Upload a before and after image from the same area to detect where water coverage changed.
          HydroVision runs independent segmentation on each image and computes a pixel-level change mask.
        </p>
        {/* Caveat */}
        <div
          className="mt-4 flex items-start gap-2 rounded-xl px-4 py-3 text-sm max-w-2xl"
          style={{ background: "rgba(251,191,36,0.08)", border: "1px solid rgba(251,191,36,0.25)", color: "var(--uncertain)" }}
        >
          <AlertTriangle className="h-4 w-4 flex-shrink-0 mt-0.5" />
          <p>
            <strong>Best results:</strong> both images should show the same area from a similar angle and altitude.
            Large perspective differences reduce alignment quality.
          </p>
        </div>
      </div>

      {/* Upload Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {[
          {
            label: "Image A — baseline",
            preview: beforePreview,
            setFile: setBeforeFile,
            setPreview: setBeforePreview,
            fileName: beforeFile?.name,
            placeholder: "Before / pre-event image",
          },
          {
            label: "Image B — event / after",
            preview: afterPreview,
            setFile: setAfterFile,
            setPreview: setAfterPreview,
            fileName: afterFile?.name,
            placeholder: "After / peak flood image",
          },
        ].map(({ label, preview, setFile, setPreview, fileName, placeholder }) => (
          <div
            key={label}
            className="rounded-xl p-5 space-y-3"
            style={{ border: "1px solid var(--border)", background: "var(--surface-1)" }}
          >
            <div className="flex items-center justify-between">
              <span className="text-label">{label}</span>
              {fileName && (
                <span className="text-xs truncate max-w-[140px]" style={{ color: "var(--water)" }}>
                  {fileName}
                </span>
              )}
            </div>
            <div
              className="relative flex flex-col items-center justify-center rounded-xl overflow-hidden"
              style={{
                height: 180,
                border: "2px dashed var(--border-strong)",
                background: "var(--surface-2)",
                cursor: "pointer",
              }}
            >
              {preview ? (
                <img src={preview} alt={label} className="h-full w-full object-contain" />
              ) : (
                <div className="text-center p-4">
                  <UploadCloud className="mx-auto h-8 w-8 mb-2" style={{ color: "var(--text-muted)" }} />
                  <p className="text-sm" style={{ color: "var(--text-2)" }}>{placeholder}</p>
                </div>
              )}
              <input
                type="file"
                accept="image/*"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) {
                    setFile(f);
                    setPreview(URL.createObjectURL(f));
                  }
                }}
                className="absolute inset-0 cursor-pointer opacity-0"
                aria-label={`Upload ${label}`}
              />
            </div>
          </div>
        ))}
      </div>

      {/* Action bar */}
      <div
        className="flex flex-wrap items-center justify-between gap-4 rounded-xl p-4"
        style={{ background: "var(--surface-1)", border: "1px solid var(--border)" }}
      >
        <div className="flex items-center gap-2 text-sm" style={{ color: "var(--text-muted)" }}>
          <Info className="h-4 w-4" style={{ color: "var(--water)" }} />
          <span>Pre-loaded: sample 2 (9.9%) vs sample 6 (55.0%). Upload your own images to override.</span>
        </div>
        <button
          onClick={handleRunComparison}
          disabled={!beforeFile || !afterFile || loading}
          className="flex items-center gap-2 rounded-xl px-6 py-2.5 text-sm font-semibold transition-all disabled:opacity-50"
          style={{ background: "var(--btn-primary-bg)", color: "var(--btn-primary-fg)" }}
        >
          {loading ? (
            <>
              <div className="h-4 w-4 rounded-full border-2 border-current border-t-transparent animate-spin" />
              <span>Running detection…</span>
            </>
          ) : (
            <>
              <Activity className="h-4 w-4" />
              <span>Run change detection</span>
              <ArrowRight className="h-4 w-4" />
            </>
          )}
        </button>
      </div>

      {/* Error */}
      {error && (
        <div
          className="rounded-xl px-4 py-3 text-sm"
          style={{ background: "rgba(248,113,113,0.1)", border: "1px solid rgba(248,113,113,0.3)", color: "var(--alert)" }}
        >
          {error}
        </div>
      )}

      {/* Results */}
      {result && (
        <div className="space-y-6">
          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              {
                label: "Image A water pixels",
                value: `${result.before_water_percentage}%`,
                style: {},
              },
              {
                label: "Image B water pixels",
                value: `${result.after_water_percentage}%`,
                style: {},
              },
              {
                label: "Water pixel change",
                value: `${result.delta_percentage_points >= 0 ? "+" : ""}${result.delta_percentage_points}%`,
                sub: result.delta_percentage_points >= 0 ? "Increase" : "Decrease",
                style: { color: result.delta_percentage_points >= 0 ? "var(--alert)" : "var(--ok)" },
              },
              {
                label: "Alignment",
                value: result.alignment_success ? "ORB aligned" : "Direct overlay",
                icon: result.alignment_success ? (
                  <CheckCircle2 className="h-5 w-5" style={{ color: "var(--ok)" }} />
                ) : (
                  <AlertCircle className="h-5 w-5" style={{ color: "var(--uncertain)" }} />
                ),
                style: { color: result.alignment_success ? "var(--ok)" : "var(--uncertain)" },
              },
            ].map((card) => (
              <div
                key={card.label}
                className="rounded-xl p-4 space-y-1"
                style={{ border: "1px solid var(--border)", background: "var(--surface-1)" }}
              >
                <span className="text-label block">{card.label}</span>
                <div className="flex items-center gap-2">
                  {card.icon}
                  <div className="text-xl font-mono font-semibold tabular-nums" style={{ color: "var(--text)", ...card.style }}>
                    {card.value}
                  </div>
                </div>
                {card.sub && <span className="text-xs" style={{ color: "var(--text-muted)" }}>{card.sub}</span>}
                {result.notes && card.label === "Alignment" && (
                  <span className="text-xs" style={{ color: "var(--text-muted)" }}>{result.notes}</span>
                )}
              </div>
            ))}
          </div>

          {/* Visual panels */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {[
              {
                label: "Image A — water pixels",
                stat: `${result.before_water_percentage}%`,
                src: `data:image/png;base64,${result.before_overlay_png_base64}`,
                alt: "Before overlay",
              },
              {
                label: "Image B — water pixels",
                stat: `${result.after_water_percentage}%`,
                src: `data:image/png;base64,${result.after_overlay_png_base64}`,
                alt: "After overlay",
              },
              {
                label: "Change map",
                stat: `${result.delta_percentage_points >= 0 ? "+" : ""}${result.delta_percentage_points} pts`,
                src: `data:image/png;base64,${result.change_mask_png_base64}`,
                alt: "Change mask",
              },
            ].map((panel) => (
              <div
                key={panel.label}
                className="rounded-xl p-4 space-y-3"
                style={{ border: "1px solid var(--border)", background: "var(--surface-1)" }}
              >
                <div className="flex items-center justify-between text-sm">
                  <span style={{ color: "var(--text-2)" }}>{panel.label}</span>
                  <span className="font-mono font-semibold" style={{ color: "var(--water)" }}>
                    {panel.stat}
                  </span>
                </div>
                <div
                  className="overflow-hidden rounded-lg"
                  style={{ height: 220, background: "var(--surface-2)", border: "1px solid var(--border)" }}
                >
                  <img src={panel.src} alt={panel.alt} className="h-full w-full object-contain" />
                </div>
              </div>
            ))}
          </div>

          {/* Legend */}
          <div
            className="flex flex-wrap items-center justify-center gap-6 rounded-xl p-4 text-sm"
            style={{ border: "1px solid var(--border)", background: "var(--surface-1)" }}
          >
            <div className="flex items-center gap-2">
              <div className="h-3 w-3 rounded-sm" style={{ background: "var(--alert)" }} />
              <span style={{ color: "var(--text-2)" }}>Newly inundated (expansion)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-3 w-3 rounded-sm" style={{ background: "var(--ok)" }} />
              <span style={{ color: "var(--text-2)" }}>Receded water (recovery)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-3 w-3 rounded-sm" style={{ background: "var(--water)" }} />
              <span style={{ color: "var(--text-2)" }}>Persistent water</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
