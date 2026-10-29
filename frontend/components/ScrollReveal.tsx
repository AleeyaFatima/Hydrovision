"use client";

import React, { useState, useRef, useEffect } from "react";
import Image from "next/image";
import { Droplets, Cpu, Sparkles, Layers, Sliders } from "lucide-react";

export function ScrollReveal() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [sliderPos, setSliderPos] = useState<number>(55); // percentage 0 - 100
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
            // When container enters viewport, animate slider from 15% to 75%
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

  const calculatedWater = (48.3 * (sliderPos / 100)).toFixed(1);

  return (
    <div className="w-full">
      {/* Container with scanline & frame */}
      <div
        ref={containerRef}
        onMouseMove={(e) => {
          setIsHovering(true);
          handleSliderMove(e);
        }}
        onTouchMove={(e) => {
          setIsHovering(true);
          handleSliderMove(e);
        }}
        onMouseLeave={() => setIsHovering(false)}
        className="group relative h-[360px] sm:h-[480px] md:h-[540px] w-full cursor-ew-resize select-none overflow-hidden rounded-2xl border border-white/10 bg-surface shadow-2xl"
      >
        {/* Layer 1: Base raw drone image */}
        <div className="absolute inset-0">
          <img
            src="/reveal/hero_raw.jpg"
            alt="Raw Drone Aerial Photography"
            className="h-full w-full object-cover"
          />
          <div className="absolute bottom-4 left-4 rounded-lg bg-black/70 px-3 py-1.5 backdrop-blur-md border border-white/10">
            <span className="font-mono text-xs text-slate-300">RAW AERIAL CAPTURE</span>
          </div>
        </div>

        {/* Layer 2: Predicted Cyan Water Segmentation Overlay clipped by sliderPos */}
        <div
          className="absolute inset-0 transition-none"
          style={{
            clipPath: `inset(0 ${100 - sliderPos}% 0 0)`,
          }}
        >
          <img
            src="/reveal/hero_overlay.png"
            alt="AquaMap Cyan Flood Mask"
            className="h-full w-full object-cover"
          />
          <div className="absolute bottom-4 left-4 rounded-lg bg-[#050B18]/85 px-3 py-1.5 backdrop-blur-md border border-accent-cyan/40 shadow-cyan-glow">
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-accent-cyan animate-pulse" />
              <span className="font-mono text-xs font-semibold text-accent-cyan">
                AQUAMAP INFERENCE (UNET-MOBILENETV2)
              </span>
            </div>
          </div>
        </div>

        {/* Laser Divider Line */}
        <div
          className="pointer-events-none absolute bottom-0 top-0 w-0.5 bg-accent-cyan shadow-[0_0_15px_3px_rgba(34,211,238,0.8)]"
          style={{ left: `${sliderPos}%` }}
        >
          {/* Laser Handle Thumb */}
          <div className="absolute top-1/2 -translate-x-1/2 -translate-y-1/2 flex h-9 w-9 items-center justify-center rounded-full border-2 border-accent-cyan bg-surface/90 shadow-[0_0_20px_rgba(34,211,238,0.9)] backdrop-blur-md">
            <Sliders className="h-4 w-4 text-accent-cyan rotate-90" />
          </div>
        </div>

        {/* Top Floating Telemetry Overlay HUD */}
        <div className="pointer-events-none absolute top-4 left-4 right-4 flex flex-wrap items-center justify-between gap-2">
          {/* Left Water Metric Badge */}
          <div className="flex items-center gap-2 rounded-xl bg-surface/85 px-3 py-1.5 backdrop-blur-md border border-white/10">
            <Droplets className="h-4 w-4 text-accent-cyan" />
            <span className="text-xs text-slate-400">Flood Inundation:</span>
            <span className="font-mono text-sm font-bold text-accent-cyan">
              {calculatedWater}%
            </span>
          </div>

          {/* Right Speed & Accuracy Badges */}
          <div className="flex items-center gap-2 font-mono text-[11px]">
            <div className="rounded-xl bg-surface/85 px-2.5 py-1.5 backdrop-blur-md border border-white/10 text-slate-300">
              IoU: <span className="text-accent-cyan font-bold">0.792</span>
            </div>
            <div className="rounded-xl bg-surface/85 px-2.5 py-1.5 backdrop-blur-md border border-white/10 text-slate-300">
              Dice: <span className="text-accent-emerald font-bold">0.884</span>
            </div>
            <div className="hidden sm:flex rounded-xl bg-surface/85 px-2.5 py-1.5 backdrop-blur-md border border-white/10 text-slate-300">
              Latency: <span className="text-accent-cyan font-bold">31ms ONNX</span>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-2 flex items-center justify-between text-[11px] text-slate-400 px-1 font-mono">
        <span>← Drag or hover horizontally to inspect segmentation mask</span>
        <span className="text-accent-cyan">Scan line: {sliderPos}%</span>
      </div>
    </div>
  );
}

