"use client";

import React, { useState, useEffect } from "react";
import {
  Activity,
  ArrowRight,
  UploadCloud,
  CheckCircle2,
  AlertCircle,
  Layers,
  Sparkles,
  Info,
} from "lucide-react";
import { compareImages, CompareResponse, fetchSamples, SampleItem } from "@/lib/api";

export default function ComparePage() {
  const [beforeFile, setBeforeFile] = useState<File | null>(null);
  const [afterFile, setAfterFile] = useState<File | null>(null);
  const [beforePreview, setBeforePreview] = useState<string | null>(null);
  const [afterPreview, setAfterPreview] = useState<string | null>(null);
  const [samples, setSamples] = useState<SampleItem[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<CompareResponse | null>(null);

  useEffect(() => {
    async function loadSamples() {
      const data = await fetchSamples();
      setSamples(data);
      if (data.length >= 2) {
        // Auto-select sample 2 (9.9% water) as Before and sample 6 (55.0% water) as After
        loadPairedSamples(data[1], data[5] || data[0]);
      }
    }
    loadSamples();
  }, []);

  const loadPairedSamples = async (beforeItem: SampleItem, afterItem: SampleItem) => {
    try {
      setLoading(true);
      setError(null);
      const [resB, resA] = await Promise.all([
        fetch(beforeItem.url).then((r) => r.blob()),
        fetch(afterItem.url).then((r) => r.blob()),
      ]);

      const fileB = new File([resB], beforeItem.name, { type: "image/jpeg" });
      const fileA = new File([resA], afterItem.name, { type: "image/jpeg" });

      setBeforeFile(fileB);
      setAfterFile(fileA);
      setBeforePreview(beforeItem.url);
      setAfterPreview(afterItem.url);

      const comp = await compareImages(fileB, fileA, fileB.name, fileA.name);
      setResult(comp);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Failed to compare pair");
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
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Comparison failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 space-y-8">
      {/* Header */}
      <div className="border-b border-white/10 pb-6">
        <div className="flex items-center gap-2">
          <span className="rounded bg-accent-blue/20 px-2 py-0.5 font-mono text-xs font-semibold text-accent-cyan border border-accent-blue/30">
            TEMPORAL CHANGE DETECTION
          </span>
          <span className="text-xs text-slate-400">Pre-Flood vs Peak Inundation Differential</span>
        </div>
        <h1 className="mt-2 text-2xl sm:text-3xl font-bold text-white">
          Multi-Temporal Flood Inundation Tracking
        </h1>
        <p className="mt-1 text-xs sm:text-sm text-slate-300 max-w-3xl leading-relaxed">
          Compare aerial passes from separate flight timestamps. Identifies floodwater expansion (newly inundated areas) and floodwater recession (reclaimed dry ground).
        </p>
      </div>

      {/* Uploaders / Pair Picker Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Pass A: Before */}
        <div className="rounded-2xl border border-white/10 bg-surface/80 p-5 backdrop-blur-md space-y-3">
          <div className="flex items-center justify-between">
            <span className="font-mono text-xs font-semibold text-slate-300">PASS A (BASELINE / PRE-FLOOD)</span>
            {beforeFile && (
              <span className="font-mono text-[10px] text-accent-cyan truncate max-w-[150px]">
                {beforeFile.name}
              </span>
            )}
          </div>

          <div className="relative flex flex-col items-center justify-center rounded-xl border border-dashed border-white/20 bg-surface-elevated/40 h-44 overflow-hidden">
            {beforePreview ? (
              <img src={beforePreview} alt="Before Preview" className="h-full w-full object-contain" />
            ) : (
              <div className="text-center p-4">
                <UploadCloud className="mx-auto h-8 w-8 text-slate-500 mb-2" />
                <p className="text-xs text-slate-300">Drop baseline aerial image</p>
              </div>
            )}
            <input
              type="file"
              accept="image/*"
              onChange={(e) => {
                if (e.target.files && e.target.files[0]) {
                  const f = e.target.files[0];
                  setBeforeFile(f);
                  setBeforePreview(URL.createObjectURL(f));
                }
              }}
              className="absolute inset-0 cursor-pointer opacity-0"
            />
          </div>
        </div>

        {/* Pass B: After */}
        <div className="rounded-2xl border border-white/10 bg-surface/80 p-5 backdrop-blur-md space-y-3">
          <div className="flex items-center justify-between">
            <span className="font-mono text-xs font-semibold text-slate-300">PASS B (PEAK FLOOD / POST-EVENT)</span>
            {afterFile && (
              <span className="font-mono text-[10px] text-accent-cyan truncate max-w-[150px]">
                {afterFile.name}
              </span>
            )}
          </div>

          <div className="relative flex flex-col items-center justify-center rounded-xl border border-dashed border-white/20 bg-surface-elevated/40 h-44 overflow-hidden">
            {afterPreview ? (
              <img src={afterPreview} alt="After Preview" className="h-full w-full object-contain" />
            ) : (
              <div className="text-center p-4">
                <UploadCloud className="mx-auto h-8 w-8 text-slate-500 mb-2" />
                <p className="text-xs text-slate-300">Drop peak flood image</p>
              </div>
            )}
            <input
              type="file"
              accept="image/*"
              onChange={(e) => {
                if (e.target.files && e.target.files[0]) {
                  const f = e.target.files[0];
                  setAfterFile(f);
                  setAfterPreview(URL.createObjectURL(f));
                }
              }}
              className="absolute inset-0 cursor-pointer opacity-0"
            />
          </div>
        </div>
      </div>

      {/* Run Action Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-white/5 bg-[#050B18]/60 p-4">
        <div className="flex items-center gap-2 text-xs text-slate-400">
          <Info className="h-4 w-4 text-accent-cyan" />
          <span>Upload two images or click below to compare benchmark sample flight passes.</span>
        </div>

        <button
          onClick={handleRunComparison}
          disabled={!beforeFile || !afterFile || loading}
          className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-accent-cyan to-accent-blue px-6 py-2.5 text-xs font-bold text-black transition-all hover:scale-105 disabled:opacity-50"
        >
          {loading ? (
            <>
              <div className="h-3.5 w-3.5 rounded-full border-2 border-black border-t-transparent animate-spin" />
              <span>Analyzing Temporal Change...</span>
            </>
          ) : (
            <>
              <Activity className="h-4 w-4" />
              <span>Run Change Detection</span>
            </>
          )}
        </button>
      </div>

      {/* Comparison Results */}
      {result && (
        <div className="space-y-6">
          {/* Delta Stat Banner */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="rounded-xl border border-white/10 bg-surface/80 p-4 backdrop-blur-md">
              <span className="text-[10px] font-mono text-slate-400 block uppercase">
                Baseline Inundation
              </span>
              <div className="text-2xl font-mono font-bold text-slate-200">
                {result.before_water_percentage}%
              </div>
            </div>

            <div className="rounded-xl border border-white/10 bg-surface/80 p-4 backdrop-blur-md">
              <span className="text-[10px] font-mono text-slate-400 block uppercase">
                Post-Event Inundation
              </span>
              <div className="text-2xl font-mono font-bold text-slate-200">
                {result.after_water_percentage}%
              </div>
            </div>

            <div className="rounded-xl border border-white/10 bg-surface/80 p-4 backdrop-blur-md">
              <span className="text-[10px] font-mono text-slate-400 block uppercase">
                Net Delta Inundation
              </span>
              <div
                className={`text-2xl font-mono font-bold ${
                  result.delta_percentage_points >= 0
                    ? "text-accent-coral"
                    : "text-accent-emerald"
                }`}
              >
                {result.delta_percentage_points >= 0 ? "+" : ""}
                {result.delta_percentage_points}%
              </div>
              <span className="text-[10px] text-slate-400 block">
                {result.delta_percentage_points >= 0 ? "Flood Expansion" : "Flood Recession"}
              </span>
            </div>

            <div className="rounded-xl border border-white/10 bg-surface/80 p-4 backdrop-blur-md">
              <span className="text-[10px] font-mono text-slate-400 block uppercase">
                Alignment Status
              </span>
              <div className="flex items-center gap-1.5 mt-1">
                {result.alignment_success ? (
                  <CheckCircle2 className="h-5 w-5 text-accent-emerald" />
                ) : (
                  <AlertCircle className="h-5 w-5 text-accent-amber" />
                )}
                <span className="font-mono text-sm font-semibold text-white">
                  {result.alignment_success ? "ORB Homography Aligned" : "Direct Overlay"}
                </span>
              </div>
              <span className="text-[10px] text-slate-400 block mt-1">
                {result.notes}
              </span>
            </div>
          </div>

          {/* 3-Panel Visual Comparison: Before Mask, After Mask, and Change Diff Map */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Panel 1: Before Overlay */}
            <div className="rounded-xl border border-white/10 bg-surface/80 p-4 space-y-2">
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="text-slate-300">PASS A OVERLAY</span>
                <span className="text-accent-cyan">{result.before_water_percentage}% Water</span>
              </div>
              <div className="h-64 w-full overflow-hidden rounded-lg bg-black border border-white/5">
                <img
                  src={`data:image/png;base64,${result.before_overlay_png_base64}`}
                  alt="Before Overlay"
                  className="h-full w-full object-contain"
                />
              </div>
            </div>

            {/* Panel 2: After Overlay */}
            <div className="rounded-xl border border-white/10 bg-surface/80 p-4 space-y-2">
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="text-slate-300">PASS B OVERLAY</span>
                <span className="text-accent-cyan">{result.after_water_percentage}% Water</span>
              </div>
              <div className="h-64 w-full overflow-hidden rounded-lg bg-black border border-white/5">
                <img
                  src={`data:image/png;base64,${result.after_overlay_png_base64}`}
                  alt="After Overlay"
                  className="h-full w-full object-contain"
                />
              </div>
            </div>

            {/* Panel 3: Change Mask with Forensic Colors */}
            <div className="rounded-xl border border-white/10 bg-surface/80 p-4 space-y-2">
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="text-slate-300">CHANGE DIFFERENTIAL</span>
                <span className="text-accent-coral font-bold">
                  {result.delta_percentage_points >= 0 ? "+" : ""}
                  {result.delta_percentage_points} pts
                </span>
              </div>
              <div className="h-64 w-full overflow-hidden rounded-lg bg-black border border-white/5">
                <img
                  src={`data:image/png;base64,${result.change_mask_png_base64}`}
                  alt="Differential Change Mask"
                  className="h-full w-full object-contain"
                />
              </div>
            </div>
          </div>

          {/* Color Legend */}
          <div className="flex flex-wrap items-center justify-center gap-6 rounded-xl border border-white/5 bg-[#050B18]/70 p-4 text-xs font-mono">
            <div className="flex items-center gap-2">
              <div className="h-3 w-3 rounded bg-accent-coral shadow-coral-glow" />
              <span className="text-slate-200">Coral: Newly Inundated Land (Flood Expansion)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-3 w-3 rounded bg-accent-emerald" />
              <span className="text-slate-200">Emerald: Receded Floodwater (Recovered Ground)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-3 w-3 rounded bg-accent-cyan" />
              <span className="text-slate-200">Cyan: Persistent Water Body</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

