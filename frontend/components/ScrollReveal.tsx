"use client";

import React, { useState, useRef, useEffect } from "react";
import { Sliders, CheckCircle2, AlertTriangle, Layers } from "lucide-react";

type RevealMode = "prediction" | "groundtruth" | "error";

export function ScrollReveal() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [sliderPos, setSliderPos] = useState<number>(55);
  const [mode, setMode] = useState<RevealMode>("prediction");
  const [isHovering, setIsHovering] = useState<boolean>(false);

  // Auto-wiggle or sync with scroll if user scrolls into view
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

  const getOverlaySrc = () => {
    if (mode === "groundtruth") return "/reveal/hero_groundtruth.png";
    if (mode === "error") return "/reveal/hero_error.png";
    return "/reveal/hero_overlay.png";
  };

  const getModeLabel = () => {
    if (mode === "groundtruth") return "GROUND TRUTH ANNOTATION";
    if (mode === "error") return "ERROR MAP (FN: RED / FP: AMBER)";
    return "HYDROVISION U-NET PREDICTION";
  };

  return (
    <div className="w-full space-y-3">
      {/* 3-Way Mode Toggle Controls */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-1">
        <div className="flex items-center gap-1.5 p-1 rounded-xl bg-[#07101E] border border-white/10">
          {(
            [
              { id: "prediction", label: "Prediction (U-Net)", color: "text-cyan-400" },
              { id: "groundtruth", label: "Ground Truth", color: "text-emerald-400" },
              { id: "error", label: "Error Map", color: "text-rose-400" },
            ] as const
          ).map((t) => (
            <button
              key={t.id}
              onClick={() => setMode(t.id)}
              className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
                mode === t.id
                  ? "bg-cyan-500/20 text-cyan-400 border border-cyan-500/40 shadow-sm"
                  : "text-slate-400 hover:text-white border border-transparent"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        <div className="hidden sm:flex items-center gap-3 text-xs font-mono text-slate-400">
          <span>Held-Out Test Sample #1</span>
          <span>•</span>
          <span className="text-cyan-400 font-bold">26.6% Water Coverage</span>
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
        className="group relative h-[360px] sm:h-[480px] md:h-[540px] w-full cursor-ew-resize select-none overflow-hidden rounded-2xl border border-white/10 bg-[#07101E] shadow-2xl focus:outline-none focus:ring-2 focus:ring-cyan-400"
      >
        {/* Layer 1: Base raw drone image */}
        <div className="absolute inset-0">
          <img
            src="/reveal/hero_raw.jpg"
            alt="Raw Drone Aerial Photography"
            className="h-full w-full object-cover"
          />
          <div className="absolute bottom-4 left-4 rounded-lg bg-black/80 px-3 py-1.5 backdrop-blur-md border border-white/10">
            <span className="font-mono text-xs text-slate-300">RAW AERIAL CAPTURE</span>
          </div>
        </div>

        {/* Layer 2: Predicted / GT / Error overlay clipped by sliderPos */}
        <div
          className="absolute inset-0 transition-none"
          style={{
            clipPath: `inset(0 ${100 - sliderPos}% 0 0)`,
          }}
        >
          <img
            src={getOverlaySrc()}
            alt={getModeLabel()}
            className="h-full w-full object-cover"
          />
          <div className="absolute bottom-4 left-4 rounded-lg bg-[#07101E]/90 px-3 py-1.5 backdrop-blur-md border border-cyan-400/40 shadow-lg">
            <div className="flex items-center gap-2">
              <div
                className={`h-2 w-2 rounded-full ${
                  mode === "error"
                    ? "bg-rose-400"
                    : mode === "groundtruth"
                    ? "bg-emerald-400"
                    : "bg-cyan-400 animate-pulse"
                }`}
              />
              <span className="font-mono text-xs font-semibold text-white">
                {getModeLabel()}
              </span>
            </div>
          </div>
        </div>

        {/* Laser Divider Line */}
        <div
          className="pointer-events-none absolute bottom-0 top-0 w-0.5 bg-cyan-400 shadow-[0_0_15px_3px_rgba(34,211,238,0.85)]"
          style={{ left: `${sliderPos}%` }}
        >
          {/* Laser Handle Thumb */}
          <div className="absolute top-1/2 -translate-x-1/2 -translate-y-1/2 flex h-9 w-9 items-center justify-center rounded-full border-2 border-cyan-400 bg-[#07101E] shadow-[0_0_20px_rgba(34,211,238,0.9)] backdrop-blur-md">
            <Sliders className="h-4 w-4 text-cyan-400 rotate-90" />
          </div>
        </div>

        {/* Top Floating Telemetry Overlay HUD */}
        <div className="pointer-events-none absolute top-4 left-4 right-4 flex flex-wrap items-center justify-between gap-2">
          {/* Left Water Metric Badge */}
          <div className="flex items-center gap-2 rounded-xl bg-[#07101E]/90 px-3.5 py-1.5 backdrop-blur-md border border-white/10 shadow-lg">
            <span className="h-2 w-2 rounded-full bg-cyan-400 animate-pulse" />
            <span className="text-xs text-slate-300">Water pixels:</span>
            <span className="font-mono text-sm font-bold text-cyan-400">
              26.6%
            </span>
          </div>

          {/* Right Accuracy Badges */}
          <div className="flex items-center gap-2 font-mono text-[11px]">
            <div className="rounded-xl bg-[#07101E]/90 px-2.5 py-1.5 backdrop-blur-md border border-white/10 text-slate-300 shadow-lg">
              Test IoU: <span className="text-cyan-400 font-bold">0.792</span>
            </div>
            <div className="rounded-xl bg-[#07101E]/90 px-2.5 py-1.5 backdrop-blur-md border border-white/10 text-slate-300 shadow-lg">
              Test Dice: <span className="text-emerald-400 font-bold">0.884</span>
            </div>
            <div className="hidden sm:flex rounded-xl bg-[#07101E]/90 px-2.5 py-1.5 backdrop-blur-md border border-white/10 text-slate-300 shadow-lg">
              Latency: <span className="text-cyan-400 font-bold">31ms ONNX</span>
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
