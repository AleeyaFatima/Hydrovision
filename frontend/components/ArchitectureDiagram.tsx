"use client";

import React, { useState } from "react";
import { ArrowRight, Layers, Cpu, Eye, ShieldAlert, CheckCircle2 } from "lucide-react";

export function ArchitectureDiagram() {
  const [activeStage, setActiveStage] = useState<number>(1);

  const stages = [
    {
      id: 1,
      title: "1. MobileNetV2 Encoder",
      tag: "Feature Extraction",
      desc: "Pre-trained on ImageNet. Inverted residual blocks with depthwise separable convolutions extract hierarchical features across 5 downsampling stages (from low-level edges to high-level semantic water signatures).",
      channels: "3 → 32 → 64 → 160 → 320 ch",
    },
    {
      id: 2,
      title: "2. Lateral Skip Connections",
      tag: "Spatial Rescue",
      desc: "Direct horizontal bridges concatenate high-resolution shallow spatial features directly into the decoder. This prevents blur and preserves sharp building edges and narrow street flood channels.",
      channels: "Concat 1:1 spatial copies",
    },
    {
      id: 3,
      title: "3. Expanding Decoder",
      tag: "Spatial Reconstruction",
      desc: "Successive bilinear upsampling and 3x3 convolutions recover full 256x256 spatial resolution while synthesizing low-level edge precision with high-level deep semantic context.",
      channels: "320 → 128 → 64 → 32 → 1 ch",
    },
    {
      id: 4,
      title: "4. Multi-Output Heads",
      tag: "Inference & Diagnostics",
      desc: "Simultaneously outputs 3 forensic artifacts: (1) Binary flood mask via calibrated sigmoid thresholding, (2) Pixel-level uncertainty map via Test-Time Augmentation (TTA), and (3) Grad-CAM heatmap.",
      channels: "Mask + StdMap + Heatmap",
    },
  ];

  return (
    <div className="w-full rounded-2xl border border-white/10 bg-surface/80 p-6 md:p-8 backdrop-blur-md">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/10 pb-6">
        <div>
          <div className="flex items-center gap-2">
            <span className="rounded bg-accent-cyan/15 px-2 py-0.5 font-mono text-xs font-semibold text-accent-cyan border border-accent-cyan/30">
              U-NET TOPOLOGY
            </span>
            <span className="text-xs text-slate-400">MobileNetV2 Backbone • 6.6M Parameters</span>
          </div>
          <h3 className="mt-2 text-xl font-bold text-white">
            Contracting Encoder, Skip Connections & Multi-Output Decoder
          </h3>
        </div>

        {/* Stage Selector Pills */}
        <div className="flex flex-wrap gap-1.5">
          {stages.map((st) => (
            <button
              key={st.id}
              onClick={() => setActiveStage(st.id)}
              className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-all ${
                activeStage === st.id
                  ? "bg-accent-cyan text-black font-semibold shadow-cyan-glow"
                  : "bg-surface-elevated text-slate-400 hover:text-white border border-white/5"
              }`}
            >
              Step {st.id}
            </button>
          ))}
        </div>
      </div>

      {/* Interactive SVG Diagram */}
      <div className="mt-6 flex justify-center overflow-x-auto py-4">
        <svg
          viewBox="0 0 860 320"
          className="w-full max-w-4xl h-auto select-none"
        >
          <defs>
            <linearGradient id="cyanGrad" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#22D3EE" stopOpacity="0.8" />
              <stop offset="100%" stopColor="#2563EB" stopOpacity="0.8" />
            </linearGradient>
            <linearGradient id="skipGrad" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#22D3EE" stopOpacity="0.9" />
              <stop offset="100%" stopColor="#34D399" stopOpacity="0.9" />
            </linearGradient>
            <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>

          {/* Background Grid */}
          <rect x="10" y="10" width="840" height="300" rx="16" fill="#0B1626" stroke="#1E293B" strokeWidth="1" />

          {/* STAGE 1: ENCODER BLOCKS (Left Column Downward) */}
          {/* E1 */}
          <g
            className="cursor-pointer transition-transform hover:scale-105"
            onClick={() => setActiveStage(1)}
          >
            <rect
              x="60"
              y="40"
              width="80"
              height="40"
              rx="6"
              fill={activeStage === 1 ? "#22D3EE" : "#112239"}
              stroke="#22D3EE"
              strokeWidth={activeStage === 1 ? "2" : "1"}
            />
            <text x="100" y="65" textAnchor="middle" fill={activeStage === 1 ? "#000" : "#F8FAFC"} fontSize="11" fontWeight="600">
              E1: 32ch (128²)
            </text>
          </g>

          {/* Arrow E1 -> E2 */}
          <path d="M 100 80 L 100 100" stroke="#22D3EE" strokeWidth="2" strokeDasharray="3 3" />

          {/* E2 */}
          <g
            className="cursor-pointer transition-transform hover:scale-105"
            onClick={() => setActiveStage(1)}
          >
            <rect
              x="75"
              y="100"
              width="70"
              height="38"
              rx="6"
              fill={activeStage === 1 ? "#22D3EE" : "#112239"}
              stroke="#22D3EE"
              strokeWidth={activeStage === 1 ? "2" : "1"}
            />
            <text x="110" y="124" textAnchor="middle" fill={activeStage === 1 ? "#000" : "#F8FAFC"} fontSize="11" fontWeight="600">
              E2: 64ch (64²)
            </text>
          </g>

          {/* Arrow E2 -> E3 */}
          <path d="M 110 138 L 110 158" stroke="#22D3EE" strokeWidth="2" strokeDasharray="3 3" />

          {/* E3 */}
          <g
            className="cursor-pointer transition-transform hover:scale-105"
            onClick={() => setActiveStage(1)}
          >
            <rect
              x="90"
              y="158"
              width="65"
              height="36"
              rx="6"
              fill={activeStage === 1 ? "#22D3EE" : "#112239"}
              stroke="#22D3EE"
              strokeWidth={activeStage === 1 ? "2" : "1"}
            />
            <text x="122" y="180" textAnchor="middle" fill={activeStage === 1 ? "#000" : "#F8FAFC"} fontSize="10" fontWeight="600">
              E3: 160ch
            </text>
          </g>

          {/* Arrow E3 -> Bottleneck */}
          <path d="M 122 194 L 160 230" stroke="#22D3EE" strokeWidth="2" />

          {/* BOTTLENECK (Center Deep) */}
          <g>
            <rect x="160" y="220" width="130" height="50" rx="8" fill="#1E293B" stroke="#2563EB" strokeWidth="2" />
            <text x="225" y="244" textAnchor="middle" fill="#60A5FA" fontSize="12" fontWeight="700">
              Bottleneck (320ch)
            </text>
            <text x="225" y="258" textAnchor="middle" fill="#94A3B8" fontSize="9">
              Receptive Field 8x8
            </text>
          </g>

          {/* STAGE 2: SKIP CONNECTIONS (Horizontal bridges) */}
          {/* Skip 1 */}
          <g
            className="cursor-pointer"
            onClick={() => setActiveStage(2)}
          >
            <path
              d="M 140 60 L 460 60"
              stroke="#34D399"
              strokeWidth={activeStage === 2 ? "3" : "1.5"}
              strokeDasharray="4 4"
              filter={activeStage === 2 ? "url(#glow)" : undefined}
            />
            <circle cx="300" cy="60" r="4" fill="#34D399" />
            <text x="300" y="52" textAnchor="middle" fill="#34D399" fontSize="9" fontWeight="600">
              High-Res Edge Skip #1
            </text>
          </g>

          {/* Skip 2 */}
          <g
            className="cursor-pointer"
            onClick={() => setActiveStage(2)}
          >
            <path
              d="M 145 119 L 440 119"
              stroke="#34D399"
              strokeWidth={activeStage === 2 ? "3" : "1.5"}
              strokeDasharray="4 4"
              filter={activeStage === 2 ? "url(#glow)" : undefined}
            />
            <circle cx="290" cy="119" r="4" fill="#34D399" />
            <text x="290" y="111" textAnchor="middle" fill="#34D399" fontSize="9" fontWeight="600">
              Mid-Level Texture Skip #2
            </text>
          </g>

          {/* STAGE 3: DECODER BLOCKS (Right Column Upward) */}
          {/* Arrow Bottleneck -> D3 */}
          <path d="M 290 235 L 390 190" stroke="#2563EB" strokeWidth="2" />

          {/* D3 */}
          <g
            className="cursor-pointer transition-transform hover:scale-105"
            onClick={() => setActiveStage(3)}
          >
            <rect
              x="390"
              y="160"
              width="65"
              height="36"
              rx="6"
              fill={activeStage === 3 ? "#2563EB" : "#112239"}
              stroke="#60A5FA"
              strokeWidth={activeStage === 3 ? "2" : "1"}
            />
            <text x="422" y="182" textAnchor="middle" fill="#F8FAFC" fontSize="10" fontWeight="600">
              D3: 128ch
            </text>
          </g>

          {/* Arrow D3 -> D2 */}
          <path d="M 422 160 L 440 138" stroke="#60A5FA" strokeWidth="2" />

          {/* D2 */}
          <g
            className="cursor-pointer transition-transform hover:scale-105"
            onClick={() => setActiveStage(3)}
          >
            <rect
              x="440"
              y="100"
              width="70"
              height="38"
              rx="6"
              fill={activeStage === 3 ? "#2563EB" : "#112239"}
              stroke="#60A5FA"
              strokeWidth={activeStage === 3 ? "2" : "1"}
            />
            <text x="475" y="124" textAnchor="middle" fill="#F8FAFC" fontSize="11" fontWeight="600">
              D2: 64ch (64²)
            </text>
          </g>

          {/* Arrow D2 -> D1 */}
          <path d="M 475 100 L 485 80" stroke="#60A5FA" strokeWidth="2" />

          {/* D1 */}
          <g
            className="cursor-pointer transition-transform hover:scale-105"
            onClick={() => setActiveStage(3)}
          >
            <rect
              x="460"
              y="40"
              width="80"
              height="40"
              rx="6"
              fill={activeStage === 3 ? "#2563EB" : "#112239"}
              stroke="#60A5FA"
              strokeWidth={activeStage === 3 ? "2" : "1"}
            />
            <text x="500" y="65" textAnchor="middle" fill="#F8FAFC" fontSize="11" fontWeight="600">
              D1: 32ch (128²)
            </text>
          </g>

          {/* Arrow D1 -> Outputs */}
          <path d="M 540 60 L 610 60" stroke="#22D3EE" strokeWidth="2" />
          <path d="M 540 60 L 610 130" stroke="#FBBF24" strokeWidth="2" strokeDasharray="3 3" />
          <path d="M 540 60 L 610 200" stroke="#FB7185" strokeWidth="2" strokeDasharray="3 3" />

          {/* STAGE 4: OUTPUT HEADS (Rightmost Column) */}
          {/* Head 1: Binary Flood Mask */}
          <g
            className="cursor-pointer"
            onClick={() => setActiveStage(4)}
          >
            <rect
              x="610"
              y="38"
              width="210"
              height="44"
              rx="8"
              fill={activeStage === 4 ? "#0E2A38" : "#0A1726"}
              stroke="#22D3EE"
              strokeWidth={activeStage === 4 ? "2" : "1"}
            />
            <circle cx="630" cy="60" r="6" fill="#22D3EE" />
            <text x="645" y="56" fill="#22D3EE" fontSize="11" fontWeight="700">
              Flood Segmentation Mask
            </text>
            <text x="645" y="70" fill="#94A3B8" fontSize="9">
              Sigmoid Threshold = 0.45 (Dice 0.884)
            </text>
          </g>

          {/* Head 2: TTA Uncertainty */}
          <g
            className="cursor-pointer"
            onClick={() => setActiveStage(4)}
          >
            <rect
              x="610"
              y="108"
              width="210"
              height="44"
              rx="8"
              fill={activeStage === 4 ? "#261E0A" : "#0A1726"}
              stroke="#FBBF24"
              strokeWidth={activeStage === 4 ? "2" : "1"}
            />
            <circle cx="630" cy="130" r="6" fill="#FBBF24" />
            <text x="645" y="126" fill="#FBBF24" fontSize="11" fontWeight="700">
              TTA Uncertainty Map
            </text>
            <text x="645" y="140" fill="#94A3B8" fontSize="9">
              Standard deviation across 4 flips
            </text>
          </g>

          {/* Head 3: Grad-CAM Explainability */}
          <g
            className="cursor-pointer"
            onClick={() => setActiveStage(4)}
          >
            <rect
              x="610"
              y="178"
              width="210"
              height="44"
              rx="8"
              fill={activeStage === 4 ? "#280F16" : "#0A1726"}
              stroke="#FB7185"
              strokeWidth={activeStage === 4 ? "2" : "1"}
            />
            <circle cx="630" cy="200" r="6" fill="#FB7185" />
            <text x="645" y="196" fill="#FB7185" fontSize="11" fontWeight="700">
              Grad-CAM Activation Map
            </text>
            <text x="645" y="210" fill="#94A3B8" fontSize="9">
              Gradients from final decoder stage
            </text>
          </g>
        </svg>
      </div>

      {/* Explainer Box for Active Stage */}
      <div className="mt-4 rounded-xl border border-white/5 bg-[#050B18]/70 p-4 backdrop-blur-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="font-bold text-white text-sm">
              {stages[activeStage - 1].title}
            </span>
            <span className="rounded bg-white/5 px-2 py-0.5 font-mono text-[10px] text-accent-cyan">
              {stages[activeStage - 1].tag}
            </span>
          </div>
          <span className="font-mono text-xs text-slate-400">
            {stages[activeStage - 1].channels}
          </span>
        </div>
        <p className="mt-2 text-xs text-slate-300 leading-relaxed">
          {stages[activeStage - 1].desc}
        </p>
      </div>
    </div>
  );
}
