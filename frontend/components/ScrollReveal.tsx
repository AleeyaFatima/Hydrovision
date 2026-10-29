"use client";

import React, { useState, useRef, useEffect } from "react";
import { Sliders, Sparkles } from "lucide-react";

type RevealMode = "prediction" | "groundtruth" | "error";

export function ScrollReveal() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [sliderPos, setSliderPos] = useState<number>(52);
  const [mode, setMode] = useState<RevealMode>("prediction");
  const [isHovering, setIsHovering] = useState<boolean>(false);

  // Sync with scroll if user scrolls into view
  useEffect(() => {
    let ticking = false;
    const handleScroll = () => {
      if (!containerRef.current || isHovering) return;
      if (!ticking) {
        window.requestAnimationFrame(() => {
          const rect = containerRef.current?.getBoundingClientRect();
          if (rect) {
            const windowHeight = window.innerHeight;
            const visibleFraction = (windowHeight - rect.top) / (windowHeight + rect.height);
            const clamped = Math.max(0, Math.min(1, visibleFraction));
            const targetPos = Math.round(15 + clamped * 65);
            setSliderPos(targetPos);
          }
          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [isHovering]);

  const handleSliderMove = (e: React.MouseEvent<HTMLDivElement> | React.TouchEvent<HTMLDivElement>) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const clientX = "touches" in e ? e.touches[0].clientX : e.clientX;
    const x = clientX - rect.left;
    const pct = Math.max(0, Math.min(100, (x / rect.width) * 100));
    setSliderPos(Math.round(pct));
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowLeft") {
      e.preventDefault();
      setSliderPos((p) => Math.max(0, p - 5));
    } else if (e.key === "ArrowRight") {
      e.preventDefault();
      setSliderPos((p) => Math.min(100, p + 5));
    }
  };

  const getOverlayWebp = () => {
    if (mode === "groundtruth") return "/reveal/hero_groundtruth.webp";
    if (mode === "error") return "/reveal/hero_error.webp";
    return "/reveal/hero_overlay.webp";
  };

  const getOverlayPng = () => {
    if (mode === "groundtruth") return "/reveal/hero_groundtruth.png";
    if (mode === "error") return "/reveal/hero_error.png";
    return "/reveal/hero_overlay.png";
  };

  const getModeLabel = () => {
    if (mode === "groundtruth") return "GROUND TRUTH ANNOTATION";
    if (mode === "error") return "ERROR MAP (FN: CORAL / FP: AMBER)";
    return "HYDROVISION U-NET PREDICTION";
  };

  return (
    <div className="w-full space-y-3">
      {/* 3-Way Mode Toggle Controls - 100% Mobile Responsive */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 px-0.5">
        <div className="flex items-center gap-1 p-1 rounded-xl bg-[#0A1424] border border-[#1E334B] w-full sm:w-auto">
          {(
            [
              { id: "prediction", label: "Prediction (Cyan + Violet)" },
              { id: "groundtruth", label: "Ground Truth" },
              { id: "error", label: "Error Map" },
            ] as const
          ).map((t) => (
            <button
              key={t.id}
              onClick={() => setMode(t.id)}
              className={`flex-1 sm:flex-initial text-center rounded-lg px-3 py-1.5 text-xs font-semibold whitespace-nowrap transition-all ${
                mode === t.id
                  ? "bg-[#101D30] text-cyan-300 border border-cyan-400/50 shadow-[0_0_12px_rgba(168,85,247,0.3)]"
                  : "text-slate-400 hover:text-white border border-transparent"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        <div className="hidden sm:flex items-center gap-2.5 text-xs font-mono text-slate-400">
          <span className="flex items-center gap-1.5 text-cyan-300">
            <Sparkles className="h-3.5 w-3.5 text-violet-400" />
            Held-Out Test Sample #3079
          </span>
          <span>•</span>
          <span className="text-cyan-400 font-bold">54.4% Water Coverage</span>
          <span>•</span>
          <span className="text-slate-400">2048×1152 Ultra-HD</span>
        </div>
      </div>

      {/* Container with scanline & frame */}
      <div
        ref={containerRef}
        onMouseMove={(e) => {
          setIsHovering(true);
          handleSliderMove(e);
        }}
        onTouchStart={(e) => {
          setIsHovering(true);
          handleSliderMove(e);
        }}
        onTouchMove={(e) => {
          setIsHovering(true);
          handleSliderMove(e);
        }}
        onTouchEnd={() => setIsHovering(false)}
        onMouseLeave={() => setIsHovering(false)}
        onKeyDown={handleKeyDown}
        tabIndex={0}
        role="slider"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={sliderPos}
        aria-label="Before and after comparison slider"
        className="group relative h-[360px] sm:h-[480px] md:h-[560px] w-full cursor-ew-resize select-none overflow-hidden rounded-2xl border border-[#1E334B] bg-[#0A1424] shadow-2xl focus:outline-none focus:ring-2 focus:ring-cyan-400"
      >
        {/* Layer 1: Base raw drone image (2048x1152 high-resolution) */}
        <div className="absolute inset-0">
          <picture>
            <source srcSet="/reveal/hero_raw.webp" type="image/webp" />
            <img
              src="/reveal/hero_raw.jpg"
              alt="High-resolution raw drone aerial flood photography (2048x1152)"
              className="h-full w-full object-cover"
              loading="eager"
            />
          </picture>
          <div className="absolute bottom-4 left-4 rounded-lg bg-[#050914]/85 px-3 py-1.5 backdrop-blur-md border border-[#1E334B]">
            <span className="font-mono text-xs text-slate-300">RAW AERIAL CAPTURE</span>
          </div>
        </div>

        {/* Layer 2: Predicted / GT / Error overlay clipped by sliderPos (2048x1152) */}
        <div
          className="absolute inset-0 transition-none"
          style={{
            clipPath: `inset(0 ${100 - sliderPos}% 0 0)`,
          }}
        >
          <picture>
            <source srcSet={getOverlayWebp()} type="image/webp" />
            <img
              src={getOverlayPng()}
              alt={getModeLabel()}
              className="h-full w-full object-cover"
              loading="eager"
            />
          </picture>
          <div className="absolute bottom-4 left-4 rounded-lg bg-[#0A1424]/90 px-3 py-1.5 backdrop-blur-md border border-cyan-400/40 shadow-lg">
            <div className="flex items-center gap-2">
              <div
                className={`h-2 w-2 rounded-full ${
                  mode === "error"
                    ? "bg-rose-400"
                    : mode === "groundtruth"
                    ? "bg-emerald-400"
                    : "bg-cyan-400 animate-pulse shadow-[0_0_8px_rgba(34,211,238,0.9)]"
                }`}
              />
              <span className="font-mono text-xs font-semibold text-white">
                {getModeLabel()}
              </span>
            </div>
          </div>
        </div>

        {/* Laser Divider Line with Cyan + Violet Aura */}
        <div
          className="pointer-events-none absolute bottom-0 top-0 w-0.5 bg-cyan-400 shadow-[0_0_15px_3px_rgba(34,211,238,0.85),0_0_30px_6px_rgba(168,85,247,0.45)]"
          style={{ left: `${sliderPos}%` }}
        >
          {/* Laser Handle Thumb */}
          <div className="absolute top-1/2 -translate-x-1/2 -translate-y-1/2 flex h-9 w-9 items-center justify-center rounded-full border-2 border-cyan-400 bg-[#0A1424] shadow-[0_0_20px_rgba(168,85,247,0.8),0_0_35px_rgba(34,211,238,0.7)] backdrop-blur-md">
            <Sliders className="h-4 w-4 text-cyan-400 rotate-90" />
          </div>
        </div>

        {/* Top Floating Telemetry Overlay HUD - Mobile Responsive */}
        <div className="pointer-events-none absolute top-2.5 sm:top-4 left-2.5 sm:left-4 right-2.5 sm:right-4 flex flex-wrap items-center justify-between gap-1.5 sm:gap-2">
          {/* Left Water Metric Badge */}
          <div className="flex items-center gap-1.5 sm:gap-2 rounded-lg sm:rounded-xl bg-[#0A1424]/90 px-2.5 sm:px-3.5 py-1 sm:py-1.5 backdrop-blur-md border border-[#1E334B] shadow-lg">
            <span className="h-1.5 sm:h-2 w-1.5 sm:w-2 rounded-full bg-cyan-400 animate-pulse" />
            <span className="text-[10px] sm:text-xs text-slate-300">Water pixels:</span>
            <span className="font-mono text-xs sm:text-sm font-bold text-cyan-400">
              54.4%
            </span>
          </div>

          {/* Right Accuracy Badges */}
          <div className="flex items-center gap-1 sm:gap-2 font-mono text-[10px] sm:text-[11px]">
            <div className="rounded-lg sm:rounded-xl bg-[#0A1424]/90 px-2 sm:px-2.5 py-1 sm:py-1.5 backdrop-blur-md border border-[#1E334B] text-slate-300 shadow-lg">
              IoU: <span className="text-cyan-400 font-bold">0.889</span>
            </div>
            <div className="rounded-lg sm:rounded-xl bg-[#0A1424]/90 px-2 sm:px-2.5 py-1 sm:py-1.5 backdrop-blur-md border border-[#1E334B] text-slate-300 shadow-lg">
              Dice: <span className="text-emerald-400 font-bold">0.941</span>
            </div>
            <div className="hidden sm:flex rounded-xl bg-[#0A1424]/90 px-2.5 py-1.5 backdrop-blur-md border border-[#1E334B] text-slate-300 shadow-lg">
              Latency: <span className="text-purple-400 font-bold">31ms ONNX</span>
            </div>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between text-xs text-slate-400 px-1 font-mono">
        <span>← Drag or use arrow keys (← / →) to wipe comparison</span>
        <span className="text-cyan-400 font-semibold">Divider: {sliderPos}%</span>
      </div>
    </div>
  );
}
