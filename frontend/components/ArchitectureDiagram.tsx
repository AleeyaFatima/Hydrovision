"use client";

import React, { useState } from "react";
import {
  Cpu,
  GitBranch,
  Layers,
  Crosshair,
  ChevronRight,
  BarChart2,
} from "lucide-react";

export function ArchitectureDiagram() {
  const [activeStep, setActiveStep] = useState<number>(1);

  const steps = [
    {
      id: 1,
      title: "1. MobileNetV2 Encoder",
      icon: Cpu,
      desc: "Pre-trained on ImageNet. Inverted residual blocks extract hierarchical features across 5 downsampling stages.",
    },
    {
      id: 2,
      title: "2. Skip Connections",
      icon: GitBranch,
      desc: "High-resolution features from encoder stages are concatenated with decoder features to preserve spatial details.",
    },
    {
      id: 3,
      title: "3. Decoder Path",
      icon: Layers,
      desc: "Transposed convolutions with skip connections reconstruct high-resolution feature maps.",
    },
    {
      id: 4,
      title: "4. Multi-Output Heads",
      icon: Crosshair,
      desc: "Three task-specific outputs: segmentation mask, uncertainty map and Grad-CAM activation map.",
    },
  ];

  return (
    <div className="w-full rounded-2xl border border-white/10 bg-[#07101E] p-5 sm:p-7 shadow-2xl backdrop-blur-xl">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/10 pb-5">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-md border border-cyan-500/40 bg-cyan-500/10 px-2.5 py-0.5 font-mono text-[11px] font-bold tracking-wider text-cyan-400">
              U-NET TOPOLOGY
            </span>
            <span className="text-xs font-mono text-slate-400">
              MobileNetV2 Backbone • 6.6M Parameters
            </span>
          </div>
          <h3
            className="mt-2 text-xl sm:text-2xl font-bold tracking-tight text-white"
            style={{ fontFamily: "'Space Grotesk', sans-serif" }}
          >
            Contracting Encoder, Skip Connections & Multi-Output Decoder
          </h3>
          <p className="mt-1 text-xs sm:text-sm text-slate-400 max-w-2xl">
            Hierarchical feature extraction with skip connections and three task-specific output heads for flood mapping.
          </p>
        </div>

        {/* Step Selector Buttons (Image 2 Top Right) */}
        <div className="flex items-center gap-1.5 shrink-0 bg-[#030712] p-1 rounded-xl border border-white/5">
          {[1, 2, 3, 4].map((stepId) => (
            <button
              key={stepId}
              onClick={() => setActiveStep(stepId)}
              className={`rounded-lg px-3 py-1.5 text-xs font-bold transition-all ${
                activeStep === stepId
                  ? "bg-cyan-400 text-black shadow-[0_0_16px_rgba(34,211,238,0.5)]"
                  : "text-slate-400 hover:text-white hover:bg-white/5"
              }`}
            >
              Step {stepId}
            </button>
          ))}
        </div>
      </div>

      {/* SVG Canvas Container matching Reference Image 2 */}
      <div className="mt-5 overflow-x-auto pb-2 -mx-2 px-2 scrollbar-thin">
        <svg
          viewBox="0 0 1020 540"
          className="w-[1020px] max-w-full h-auto select-none font-sans"
          style={{ minWidth: 960 }}
        >
          <defs>
            {/* Glow Filter */}
            <filter id="cyanGlow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="4" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
            <filter id="amberGlow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="4" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
            <filter id="coralGlow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="4" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>

            {/* Gradient fills */}
            <linearGradient id="encoderBoxGrad" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#0B1C33" />
              <stop offset="100%" stopColor="#102542" />
            </linearGradient>
            <linearGradient id="bottleneckGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#081A36" />
              <stop offset="100%" stopColor="#0C254C" />
            </linearGradient>
          </defs>

          {/* Canvas Background Frame */}
          <rect
            x="10"
            y="10"
            width="1000"
            height="520"
            rx="16"
            fill="#050E1D"
            stroke="#13233A"
            strokeWidth="1.5"
          />

          {/* Background Grid Pattern inside Canvas */}
          <g opacity="0.15">
            {[...Array(13)].map((_, i) => (
              <line key={`v-${i}`} x1={i * 80 + 20} y1="10" x2={i * 80 + 20} y2="530" stroke="#22D3EE" strokeWidth="0.5" strokeDasharray="3 3" />
            ))}
            {[...Array(9)].map((_, i) => (
              <line key={`h-${i}`} x1="10" y1={i * 60 + 20} x2="1010" y2={i * 60 + 20} stroke="#22D3EE" strokeWidth="0.5" strokeDasharray="3 3" />
            ))}
          </g>

          {/* ========================================================================= */}
          {/* COLUMN 1: ENCODER (Contracting Path)                                     */}
          {/* ========================================================================= */}
          <g opacity={activeStep === 1 || activeStep === 0 ? 1 : 0.45} className="transition-opacity duration-300">
            {/* Header */}
            <g transform="translate(60, 36)">
              <rect x="0" y="0" width="18" height="18" rx="4" fill="#0C2640" />
              <path d="M4 14 L4 9 M9 14 L9 5 M14 14 L14 1" stroke="#22D3EE" strokeWidth="2" strokeLinecap="round" />
              <text x="26" y="10" fill="#22D3EE" fontSize="12" fontWeight="700" letterSpacing="0.05em">
                ENCODER (Contracting Path)
              </text>
              <text x="26" y="24" fill="#64748B" fontSize="10">
                MobileNetV2 Feature Extraction
              </text>
            </g>

            {/* Stage E1 */}
            <g transform="translate(60, 80)">
              {/* E1 Tag */}
              <rect x="0" y="0" width="56" height="42" rx="6" fill="#082A3E" stroke="#22D3EE" strokeWidth="1.5" />
              <text x="28" y="17" textAnchor="middle" fill="#22D3EE" fontSize="11" fontWeight="700">E1</text>
              <text x="28" y="28" textAnchor="middle" fill="#94A3B8" fontSize="9">32ch</text>
              <text x="28" y="38" textAnchor="middle" fill="#64748B" fontSize="8">(128²)</text>
              {/* Arrow */}
              <path d="M56 21 L75 21" stroke="#22D3EE" strokeWidth="1.5" markerEnd="url(#arrow)" />
              {/* Operation box */}
              <rect x="75" y="4" width="105" height="34" rx="6" fill="#0C1D33" stroke="#1E385B" strokeWidth="1" />
              <text x="127" y="18" textAnchor="middle" fill="#F8FAFC" fontSize="10" fontWeight="600">Conv 3×3</text>
              <text x="127" y="30" textAnchor="middle" fill="#64748B" fontSize="8">+ ReLU + MBConv</text>
            </g>

            {/* Arrow E1 -> E2 */}
            <path d="M88 122 L88 142" stroke="#22D3EE" strokeWidth="1.5" />

            {/* Stage E2 */}
            <g transform="translate(60, 142)">
              <rect x="0" y="0" width="56" height="42" rx="6" fill="#082A3E" stroke="#22D3EE" strokeWidth="1.5" />
              <text x="28" y="17" textAnchor="middle" fill="#22D3EE" fontSize="11" fontWeight="700">E2</text>
              <text x="28" y="28" textAnchor="middle" fill="#94A3B8" fontSize="9">64ch</text>
              <text x="28" y="38" textAnchor="middle" fill="#64748B" fontSize="8">(64²)</text>
              <path d="M56 21 L75 21" stroke="#22D3EE" strokeWidth="1.5" />
              <rect x="75" y="4" width="105" height="34" rx="6" fill="#0C1D33" stroke="#1E385B" strokeWidth="1" />
              <text x="127" y="18" textAnchor="middle" fill="#F8FAFC" fontSize="10" fontWeight="600">Conv 3×3</text>
              <text x="127" y="30" textAnchor="middle" fill="#64748B" fontSize="8">+ ReLU + MBConv</text>
            </g>

            {/* Arrow E2 -> E3 */}
            <path d="M88 184 L88 204" stroke="#22D3EE" strokeWidth="1.5" />

            {/* Stage E3 */}
            <g transform="translate(60, 204)">
              <rect x="0" y="0" width="56" height="42" rx="6" fill="#082A3E" stroke="#22D3EE" strokeWidth="1.5" />
              <text x="28" y="17" textAnchor="middle" fill="#22D3EE" fontSize="11" fontWeight="700">E3</text>
              <text x="28" y="28" textAnchor="middle" fill="#94A3B8" fontSize="9">160ch</text>
              <text x="28" y="38" textAnchor="middle" fill="#64748B" fontSize="8">(32²)</text>
              <path d="M56 21 L75 21" stroke="#22D3EE" strokeWidth="1.5" />
              <rect x="75" y="4" width="105" height="34" rx="6" fill="#0C1D33" stroke="#1E385B" strokeWidth="1" />
              <text x="127" y="18" textAnchor="middle" fill="#F8FAFC" fontSize="10" fontWeight="600">Conv 3×3</text>
              <text x="127" y="30" textAnchor="middle" fill="#64748B" fontSize="8">+ ReLU + MBConv</text>
            </g>

            {/* Arrow E3 -> E4 */}
            <path d="M88 246 L88 266" stroke="#22D3EE" strokeWidth="1.5" />

            {/* Stage E4 */}
            <g transform="translate(60, 266)">
              <rect x="0" y="0" width="56" height="42" rx="6" fill="#082A3E" stroke="#22D3EE" strokeWidth="1.5" />
              <text x="28" y="17" textAnchor="middle" fill="#22D3EE" fontSize="11" fontWeight="700">E4</text>
              <text x="28" y="28" textAnchor="middle" fill="#94A3B8" fontSize="9">320ch</text>
              <text x="28" y="38" textAnchor="middle" fill="#64748B" fontSize="8">(16²)</text>
              <path d="M56 21 L75 21" stroke="#22D3EE" strokeWidth="1.5" />
              <rect x="75" y="4" width="105" height="34" rx="6" fill="#0C1D33" stroke="#1E385B" strokeWidth="1" />
              <text x="127" y="18" textAnchor="middle" fill="#F8FAFC" fontSize="10" fontWeight="600">Conv 3×3</text>
              <text x="127" y="30" textAnchor="middle" fill="#64748B" fontSize="8">+ ReLU + MBConv</text>
            </g>

            {/* Arrow E4 -> E5 */}
            <path d="M88 308 L88 328" stroke="#22D3EE" strokeWidth="1.5" />

            {/* Stage E5 */}
            <g transform="translate(60, 328)">
              <rect x="0" y="0" width="56" height="42" rx="6" fill="#082A3E" stroke="#22D3EE" strokeWidth="1.5" />
              <text x="28" y="17" textAnchor="middle" fill="#22D3EE" fontSize="11" fontWeight="700">E5</text>
              <text x="28" y="28" textAnchor="middle" fill="#94A3B8" fontSize="9">320ch</text>
              <text x="28" y="38" textAnchor="middle" fill="#64748B" fontSize="8">(8²)</text>
              <path d="M56 21 L75 21" stroke="#22D3EE" strokeWidth="1.5" />
              <rect x="75" y="4" width="105" height="34" rx="6" fill="#0C1D33" stroke="#1E385B" strokeWidth="1" />
              <text x="127" y="18" textAnchor="middle" fill="#F8FAFC" fontSize="10" fontWeight="600">Conv 3×3</text>
              <text x="127" y="30" textAnchor="middle" fill="#64748B" fontSize="8">+ ReLU + MBConv</text>
            </g>

            {/* Arrow E5 -> Bottleneck */}
            <path d="M147 370 L147 410 L285 410" stroke="#38BDF8" strokeWidth="2" fill="none" />
          </g>

          {/* ========================================================================= */}
          {/* BOTTLENECK (Center Bottom)                                                */}
          {/* ========================================================================= */}
          <g transform="translate(285, 375)">
            <rect
              x="0"
              y="0"
              width="170"
              height="70"
              rx="10"
              fill="url(#bottleneckGrad)"
              stroke="#38BDF8"
              strokeWidth="2"
              filter="url(#cyanGlow)"
            />
            <text x="85" y="24" textAnchor="middle" fill="#38BDF8" fontSize="11" fontWeight="800" letterSpacing="0.04em">
              BOTTLENECK (320ch)
            </text>
            <text x="85" y="40" textAnchor="middle" fill="#94A3B8" fontSize="9">
              Receptive Field 8×8
            </text>
            <text x="85" y="55" textAnchor="middle" fill="#F8FAFC" fontSize="9" fontWeight="600">
              3 × MBConv Blocks + Dilated Conv
            </text>
          </g>

          {/* Arrow Bottleneck -> D4 */}
          <path d="M455 410 L545 410 L545 308" stroke="#38BDF8" strokeWidth="2" fill="none" />

          {/* ========================================================================= */}
          {/* COLUMN 2: DECODER (Expanding Path)                                       */}
          {/* ========================================================================= */}
          <g opacity={activeStep === 3 || activeStep === 0 ? 1 : 0.45} className="transition-opacity duration-300">
            {/* Header */}
            <g transform="translate(500, 36)">
              <rect x="0" y="0" width="18" height="18" rx="4" fill="#0C2640" />
              <path d="M4 14 L4 9 M9 14 L9 5 M14 14 L14 1" stroke="#22D3EE" strokeWidth="2" strokeLinecap="round" />
              <text x="26" y="10" fill="#22D3EE" fontSize="12" fontWeight="700" letterSpacing="0.05em">
                DECODER (Expanding Path)
              </text>
              <text x="26" y="24" fill="#64748B" fontSize="10">
                Transposed Convolutions + Skip Connections
              </text>
            </g>

            {/* D4 Stage (Lowest) */}
            <g transform="translate(515, 266)">
              <rect x="0" y="0" width="56" height="42" rx="6" fill="#082A3E" stroke="#38BDF8" strokeWidth="1.5" />
              <text x="28" y="17" textAnchor="middle" fill="#38BDF8" fontSize="11" fontWeight="700">D4</text>
              <text x="28" y="28" textAnchor="middle" fill="#94A3B8" fontSize="9">320ch</text>
              <text x="28" y="38" textAnchor="middle" fill="#64748B" fontSize="8">(16²)</text>
              <path d="M56 21 L75 21" stroke="#38BDF8" strokeWidth="1.5" />
              <rect x="75" y="4" width="100" height="34" rx="6" fill="#0C1D33" stroke="#1E385B" strokeWidth="1" />
              <text x="125" y="18" textAnchor="middle" fill="#F8FAFC" fontSize="10" fontWeight="600">UpConv 2×2</text>
              <text x="125" y="30" textAnchor="middle" fill="#64748B" fontSize="8">+ Conv 3×3 + ReLU</text>
            </g>

            {/* Arrow D4 -> D3 */}
            <path d="M545 266 L545 246" stroke="#38BDF8" strokeWidth="1.5" />

            {/* D3 Stage */}
            <g transform="translate(515, 204)">
              <rect x="0" y="0" width="56" height="42" rx="6" fill="#082A3E" stroke="#38BDF8" strokeWidth="1.5" />
              <text x="28" y="17" textAnchor="middle" fill="#38BDF8" fontSize="11" fontWeight="700">D3</text>
              <text x="28" y="28" textAnchor="middle" fill="#94A3B8" fontSize="9">128ch</text>
              <text x="28" y="38" textAnchor="middle" fill="#64748B" fontSize="8">(32²)</text>
              <path d="M56 21 L75 21" stroke="#38BDF8" strokeWidth="1.5" />
              <rect x="75" y="4" width="100" height="34" rx="6" fill="#0C1D33" stroke="#1E385B" strokeWidth="1" />
              <text x="125" y="18" textAnchor="middle" fill="#F8FAFC" fontSize="10" fontWeight="600">UpConv 2×2</text>
              <text x="125" y="30" textAnchor="middle" fill="#64748B" fontSize="8">+ Conv 3×3 + ReLU</text>
            </g>

            {/* Arrow D3 -> D2 */}
            <path d="M545 204 L545 184" stroke="#38BDF8" strokeWidth="1.5" />

            {/* D2 Stage */}
            <g transform="translate(515, 142)">
              <rect x="0" y="0" width="56" height="42" rx="6" fill="#082A3E" stroke="#38BDF8" strokeWidth="1.5" />
              <text x="28" y="17" textAnchor="middle" fill="#38BDF8" fontSize="11" fontWeight="700">D2</text>
              <text x="28" y="28" textAnchor="middle" fill="#94A3B8" fontSize="9">64ch</text>
              <text x="28" y="38" textAnchor="middle" fill="#64748B" fontSize="8">(64²)</text>
              <path d="M56 21 L75 21" stroke="#38BDF8" strokeWidth="1.5" />
              <rect x="75" y="4" width="100" height="34" rx="6" fill="#0C1D33" stroke="#1E385B" strokeWidth="1" />
              <text x="125" y="18" textAnchor="middle" fill="#F8FAFC" fontSize="10" fontWeight="600">UpConv 2×2</text>
              <text x="125" y="30" textAnchor="middle" fill="#64748B" fontSize="8">+ Conv 3×3 + ReLU</text>
            </g>

            {/* Arrow D2 -> D1 */}
            <path d="M545 142 L545 122" stroke="#38BDF8" strokeWidth="1.5" />

            {/* D1 Stage (Highest Output Stage) */}
            <g transform="translate(515, 80)">
              <rect x="0" y="0" width="56" height="42" rx="6" fill="#082A3E" stroke="#38BDF8" strokeWidth="1.5" />
              <text x="28" y="17" textAnchor="middle" fill="#38BDF8" fontSize="11" fontWeight="700">D1</text>
              <text x="28" y="28" textAnchor="middle" fill="#94A3B8" fontSize="9">32ch</text>
              <text x="28" y="38" textAnchor="middle" fill="#64748B" fontSize="8">(128²)</text>
              <path d="M56 21 L75 21" stroke="#38BDF8" strokeWidth="1.5" />
              <rect x="75" y="4" width="100" height="34" rx="6" fill="#0C1D33" stroke="#1E385B" strokeWidth="1" />
              <text x="125" y="18" textAnchor="middle" fill="#F8FAFC" fontSize="10" fontWeight="600">UpConv 2×2</text>
              <text x="125" y="30" textAnchor="middle" fill="#64748B" fontSize="8">+ Conv 3×3 + ReLU</text>
            </g>
          </g>

          {/* ========================================================================= */}
          {/* SKIP CONNECTIONS (Dashed Green/Cyan Bridges E -> D)                       */}
          {/* ========================================================================= */}
          <g opacity={activeStep === 2 || activeStep === 0 ? 1 : 0.35} className="transition-opacity duration-300">
            {/* Skip 1: E1 -> D1 */}
            <path d="M240 101 L515 101" stroke="#34D399" strokeWidth="1.5" strokeDasharray="5 4" />
            <circle cx="377" cy="101" r="3" fill="#34D399" />
            <rect x="325" y="90" width="105" height="18" rx="4" fill="#061F17" stroke="#34D399" strokeWidth="0.8" />
            <text x="377" y="103" textAnchor="middle" fill="#34D399" fontSize="9" fontWeight="600">Skip Connection #1</text>

            {/* Skip 2: E2 -> D2 */}
            <path d="M240 163 L515 163" stroke="#34D399" strokeWidth="1.5" strokeDasharray="5 4" />
            <circle cx="377" cy="163" r="3" fill="#34D399" />
            <rect x="325" y="152" width="105" height="18" rx="4" fill="#061F17" stroke="#34D399" strokeWidth="0.8" />
            <text x="377" y="165" textAnchor="middle" fill="#34D399" fontSize="9" fontWeight="600">Skip Connection #2</text>

            {/* Skip 3: E3 -> D3 */}
            <path d="M240 225 L515 225" stroke="#34D399" strokeWidth="1.5" strokeDasharray="5 4" />
            <circle cx="377" cy="225" r="3" fill="#34D399" />
            <rect x="325" y="214" width="105" height="18" rx="4" fill="#061F17" stroke="#34D399" strokeWidth="0.8" />
            <text x="377" y="227" textAnchor="middle" fill="#34D399" fontSize="9" fontWeight="600">Skip Connection #3</text>

            {/* Skip 4: E4 -> D4 */}
            <path d="M240 287 L515 287" stroke="#34D399" strokeWidth="1.5" strokeDasharray="5 4" />
            <circle cx="377" cy="287" r="3" fill="#34D399" />
            <rect x="325" y="276" width="105" height="18" rx="4" fill="#061F17" stroke="#34D399" strokeWidth="0.8" />
            <text x="377" y="289" textAnchor="middle" fill="#34D399" fontSize="9" fontWeight="600">Skip Connection #4</text>
          </g>

          {/* ========================================================================= */}
          {/* COLUMN 3: MULTI-OUTPUT HEADS (Task Specific Outputs)                      */}
          {/* ========================================================================= */}
          <g opacity={activeStep === 4 || activeStep === 0 ? 1 : 0.45} className="transition-opacity duration-300">
            {/* Header */}
            <g transform="translate(730, 36)">
              <rect x="0" y="0" width="18" height="18" rx="4" fill="#0C2640" />
              <path d="M4 14 L4 9 M9 14 L9 5 M14 14 L14 1" stroke="#22D3EE" strokeWidth="2" strokeLinecap="round" />
              <text x="26" y="10" fill="#22D3EE" fontSize="12" fontWeight="700" letterSpacing="0.05em">
                MULTI-OUTPUT HEADS
              </text>
              <text x="26" y="24" fill="#64748B" fontSize="10">
                Task-Specific Prediction Maps
              </text>
            </g>

            {/* Connecting lines from D1 to 3 Output Heads */}
            <path d="M690 101 L730 135" stroke="#22D3EE" strokeWidth="2" />
            <path d="M690 101 L730 235" stroke="#FBBF24" strokeWidth="2" strokeDasharray="4 3" />
            <path d="M690 101 L730 335" stroke="#FB7185" strokeWidth="2" strokeDasharray="4 3" />

            {/* HEAD 1: Flood Segmentation Mask */}
            <g transform="translate(730, 105)">
              <rect
                x="0"
                y="0"
                width="240"
                height="65"
                rx="10"
                fill="#071828"
                stroke="#22D3EE"
                strokeWidth="1.5"
                filter="url(#cyanGlow)"
              />
              <circle cx="18" cy="20" r="5" fill="#22D3EE" />
              <text x="32" y="22" fill="#F8FAFC" fontSize="11" fontWeight="700">
                Flood Segmentation Mask
              </text>
              <text x="32" y="38" fill="#94A3B8" fontSize="9">
                Sigmoid Activation
              </text>
              <text x="32" y="52" fill="#22D3EE" fontSize="9" fontWeight="600">
                Threshold = 0.45 (Dice 0.884)
              </text>

              {/* Water Mask Thumbnail Graphic */}
              <g transform="translate(178, 8)">
                <rect x="0" y="0" width="52" height="49" rx="6" fill="#030A14" stroke="#22D3EE" strokeWidth="1" />
                <image href="/diagram/mask.png" x="2" y="2" width="48" height="45" preserveAspectRatio="xMidYMid slice" clipPath="inset(0 round 4px)" />
              </g>
            </g>

            {/* HEAD 2: TTA Uncertainty Map */}
            <g transform="translate(730, 205)">
              <rect
                x="0"
                y="0"
                width="240"
                height="65"
                rx="10"
                fill="#1B1708"
                stroke="#FBBF24"
                strokeWidth="1.5"
                filter="url(#amberGlow)"
              />
              <circle cx="18" cy="20" r="5" fill="#FBBF24" />
              <text x="32" y="22" fill="#F8FAFC" fontSize="11" fontWeight="700">
                TTA Uncertainty Map
              </text>
              <text x="32" y="38" fill="#94A3B8" fontSize="9">
                4 × Test-Time Augmentation
              </text>
              <text x="32" y="52" fill="#FBBF24" fontSize="9" fontWeight="600">
                Standard deviation across flips
              </text>

              {/* Uncertainty Cloud Thumbnail Graphic */}
              <g transform="translate(178, 8)">
                <rect x="0" y="0" width="52" height="49" rx="6" fill="#0A0802" stroke="#FBBF24" strokeWidth="1" />
                <image href="/diagram/uncertainty.png" x="2" y="2" width="48" height="45" preserveAspectRatio="xMidYMid slice" clipPath="inset(0 round 4px)" />
              </g>
            </g>

            {/* HEAD 3: Grad-CAM Activation Map */}
            <g transform="translate(730, 305)">
              <rect
                x="0"
                y="0"
                width="240"
                height="65"
                rx="10"
                fill="#1C090F"
                stroke="#FB7185"
                strokeWidth="1.5"
                filter="url(#coralGlow)"
              />
              <circle cx="18" cy="20" r="5" fill="#FB7185" />
              <text x="32" y="22" fill="#F8FAFC" fontSize="11" fontWeight="700">
                Grad-CAM Activation Map
              </text>
              <text x="32" y="38" fill="#94A3B8" fontSize="9">
                Gradients from final decoder stage
              </text>
              <text x="32" y="52" fill="#FB7185" fontSize="9" fontWeight="600">
                Highlights flood-relevant regions
              </text>

              {/* Heatmap Thumbnail Graphic */}
              <g transform="translate(178, 8)">
                <rect x="0" y="0" width="52" height="49" rx="6" fill="#0C0305" stroke="#FB7185" strokeWidth="1" />
                <image href="/diagram/gradcam.png" x="2" y="2" width="48" height="45" preserveAspectRatio="xMidYMid slice" clipPath="inset(0 round 4px)" />
              </g>
            </g>
          </g>
        </svg>
      </div>

      {/* ========================================================================= */}
      {/* 4 INTERACTIVE STEP CARDS (Image 2 Bottom Bar)                            */}
      {/* ========================================================================= */}
      <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {steps.map((st, idx) => {
          const Icon = st.icon;
          const isSelected = activeStep === st.id;
          return (
            <div
              key={st.id}
              onClick={() => setActiveStep(st.id)}
              className={`relative flex flex-col rounded-xl p-4 cursor-pointer transition-all ${
                isSelected
                  ? "bg-[#0B1E38] border-2 border-cyan-400 shadow-[0_0_24px_rgba(34,211,238,0.3)] scale-[1.02]"
                  : "bg-[#050C1A] border border-white/10 hover:border-white/20 hover:bg-[#071324]"
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <div
                  className={`flex h-8 w-8 items-center justify-center rounded-lg border transition-all ${
                    isSelected
                      ? "bg-cyan-500/20 border-cyan-400 text-cyan-400"
                      : "bg-white/5 border-white/10 text-slate-400"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                </div>
                {idx < steps.length - 1 && (
                  <ChevronRight className="hidden lg:block h-4 w-4 text-slate-600 -mr-1" />
                )}
              </div>

              <h4
                className={`text-xs sm:text-sm font-bold ${
                  isSelected ? "text-cyan-400" : "text-white"
                }`}
              >
                {st.title}
              </h4>
              <p className="mt-1 text-xs text-slate-400 leading-relaxed">
                {st.desc}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
