"use client";

import Link from "next/link";
import {
  Droplets,
  ArrowRight,
  ShieldCheck,
  Zap,
  Activity,
  Layers,
  BarChart3,
  Compass,
  AlertTriangle,
  Cpu,
  FileText,
  ChevronDown,
} from "lucide-react";
import { useState } from "react";
import { EarthGlobe } from "@/components/EarthGlobe";
import { ScrollReveal } from "@/components/ScrollReveal";
import { ArchitectureDiagram } from "@/components/ArchitectureDiagram";

export default function LandingPage() {
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const toggleFaq = (index: number) => {
    setOpenFaq(openFaq === index ? null : index);
  };

  const faqItems = [
    {
      q: "Why combined BCE + Dice loss instead of standard Cross-Entropy?",
      a: "In aerial flood imagery, water pixels can occupy as little as 4% or up to 88% of the scene (severe foreground-background imbalance). Standard Cross-Entropy produces gradients dominated by the majority background class. Dice Loss directly optimizes the overlap (Sørensen–Dice coefficient) between prediction and ground truth, while BCE stabilizes early gradient descent. Our 0.5 BCE + 0.5 Dice formulation ensures rapid convergence and high boundary precision.",
    },
    {
      q: "Why does U-Net MobileNetV2 outperform U-Net from scratch by +4.3% Dice?",
      a: "Our empirical benchmark evaluated on the unseen 44-image test split demonstrates that MobileNetV2 (0.8840 Dice) significantly outperforms training from scratch (0.8407 Dice). On small, specialized aerial datasets (~290 images), training from scratch struggles to learn low-level visual primitives (edges, gradients, textures). Pre-training on ImageNet-1k equips the encoder with robust multi-scale filters, allowing the network to dedicate its capacity to learning aerial water reflectance patterns.",
    },
    {
      q: "How does Test-Time Augmentation (TTA) quantify prediction uncertainty?",
      a: "During inference, an image is passed through 4 geometric transformations: identity, horizontal flip, vertical flip, and diagonal transpose. The 4 resulting probability maps are de-augmented and averaged. The standard deviation across passes forms an empirical pixel uncertainty map. Crisp flood boundaries exhibit low variance (<0.05), whereas ambiguous silt edges and mud reflections exhibit high variance (>0.25), alerting emergency responders to uncertain margins.",
    },
    {
      q: "How was data leakage prevented across train, validation, and test splits?",
      a: "Aerial datasets often contain near-duplicate video frames or contiguous flight passes. We computed 64-bit perceptual hashes (dHash) across all 290 images and identified 11 near-duplicate clusters (Hamming distance ≤ 8). Split generation enforced strict cluster-grouping: all duplicate variants of a flight path were assigned exclusively to either Train, Val, or Test, guaranteeing zero visual contamination of the test split.",
    },
    {
      q: "What are AquaMap's known physical sensor limitations?",
      a: "AquaMap v2 processes RGB optical imagery. Consequently, it cannot penetrate dense canopy or thick night cloud cover (unlike active microwave SAR Sentinel-1). In conditions of extreme turbid silt where water color matches surrounding wet earth, AquaMap flags the region with elevated TTA uncertainty rather than producing a false confident classification.",
    },
  ];

  return (
    <div className="flex flex-col gap-24 pb-24">
      {/* 1. HERO SECTION */}
      <section className="relative overflow-hidden pt-8 md:pt-14">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-12">
            {/* Left Content */}
            <div className="lg:col-span-7 space-y-6">
              {/* Telemetry pill */}
              <div className="inline-flex items-center gap-2 rounded-full border border-accent-cyan/30 bg-accent-cyan/10 px-3.5 py-1 text-xs font-mono text-accent-cyan shadow-cyan-glow">
                <span className="flex h-2 w-2 rounded-full bg-accent-cyan animate-pulse" />
                <span>BENCHMARK VERIFIED • 3-MODEL COMPARISON • ONNX 31ms</span>
              </div>

              <h1 className="text-4xl font-extrabold tracking-tight text-white sm:text-5xl lg:text-6xl leading-[1.15]">
                Explainable Aerial Flood Intelligence at{" "}
                <span className="bg-gradient-to-r from-accent-cyan via-accent-blue to-accent-emerald bg-clip-text text-transparent">
                  Sub-Pixel Precision
                </span>
              </h1>

              <p className="max-w-2xl text-base text-slate-300 sm:text-lg leading-relaxed">
                Transform drone and UAV aerial imagery into calibrated flood inundation boundaries in 31ms.
                Featuring Test-Time Augmentation (TTA) uncertainty estimation, Grad-CAM spatial explainability,
                and zero data leakage.
              </p>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center gap-4 pt-2">
                <Link
                  href="/analyze"
                  className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-accent-cyan to-accent-blue px-6 py-3.5 text-sm font-bold text-black transition-all hover:scale-[1.02] hover:shadow-cyan-glow"
                >
                  <span>Launch Live Analyzer</span>
                  <ArrowRight className="h-4 w-4" />
                </Link>

                <Link
                  href="/performance"
                  className="flex items-center gap-2 rounded-xl border border-white/10 bg-surface px-6 py-3.5 text-sm font-semibold text-white transition-all hover:bg-white/5 hover:border-white/20"
                >
                  <BarChart3 className="h-4 w-4 text-accent-cyan" />
                  <span>3-Model Benchmark</span>
                </Link>
              </div>

              {/* Verified Metrics Counter */}
              <div className="grid grid-cols-3 gap-4 pt-4 border-t border-white/10 max-w-lg font-mono">
                <div>
                  <div className="text-2xl font-bold text-accent-cyan">0.884</div>
                  <div className="text-[11px] text-slate-400">Test Dice Score</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-accent-emerald">30.9 ms</div>
                  <div className="text-[11px] text-slate-400">ONNX CPU Latency</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-accent-coral">2.58x</div>
                  <div className="text-[11px] text-slate-400">Runtime Speedup</div>
                </div>
              </div>
            </div>

            {/* Right: 3D Earth Globe */}
            <div className="lg:col-span-5 flex flex-col items-center justify-center">
              <EarthGlobe />
            </div>
          </div>
        </div>
      </section>

      {/* 2. SIGNATURE INTERACTIVE SCROLL REVEAL */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-6 space-y-2 text-center md:text-left">
          <div className="flex items-center gap-2 justify-center md:justify-start">
            <span className="rounded bg-accent-cyan/15 px-2 py-0.5 font-mono text-xs font-semibold text-accent-cyan border border-accent-cyan/30">
              INTERACTIVE DEMO
            </span>
            <span className="text-xs text-slate-400">Real Test-Set Evaluation (Kaggle Dataset)</span>
          </div>
          <h2 className="text-2xl font-bold text-white sm:text-3xl">
            Laser-Sharp Flood Boundary Demarcation
          </h2>
          <p className="text-sm text-slate-400 max-w-2xl">
            Drag the laser slider below to wipe between the raw drone capture and AquaMap's real-time segmentation mask.
          </p>
        </div>

        <ScrollReveal />
      </section>

      {/* 3. THE PROBLEM & DISASTER TELEMETRY */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="rounded-2xl border border-white/10 bg-surface/50 p-8 backdrop-blur-md">
          <div className="max-w-2xl space-y-2">
            <div className="flex items-center gap-2 text-accent-coral">
              <AlertTriangle className="h-4 w-4" />
              <span className="font-mono text-xs font-semibold uppercase tracking-wider">
                Operational Reality
              </span>
            </div>
            <h2 className="text-2xl font-bold text-white sm:text-3xl">
              Why Classical Remote Sensing Fails First Responders
            </h2>
            <p className="text-sm text-slate-300">
              During flash floods, emergency crews lose critical hours when segmentation algorithms misclassify wet asphalt as standing water or miss shallow flooded corridors under tree canopies.
            </p>
          </div>

          <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="rounded-xl border border-white/5 bg-[#050B18]/70 p-5 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono font-semibold text-accent-coral">VALENCIA, SPAIN (2024)</span>
                <span className="text-[10px] text-slate-500">500mm / 8hrs</span>
              </div>
              <h4 className="text-base font-bold text-white">Urban Chokepoints</h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                Fast-moving muddy flash floods destroyed bridges and submerged tunnels. Classical RGB thresholding failed due to high sediment turbidity matching road surface colors.
              </p>
            </div>

            <div className="rounded-xl border border-white/5 bg-[#050B18]/70 p-5 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono font-semibold text-accent-coral">DERNA, LIBYA (2023)</span>
                <span className="text-[10px] text-slate-500">11,000+ Casualties</span>
              </div>
              <h4 className="text-base font-bold text-white">Catastrophic Dam Breach</h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                Entire city quarters were swept into the Mediterranean in minutes. First responders required instant aerial verification of washed-out evacuation corridors.
              </p>
            </div>

            <div className="rounded-xl border border-white/5 bg-[#050B18]/70 p-5 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono font-semibold text-accent-coral">HOUSTON, TX (2017)</span>
                <span className="text-[10px] text-slate-500">150,000 Homes</span>
              </div>
              <h4 className="text-base font-bold text-white">Suburban Inundation</h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                Hurricane Harvey dumped 60+ inches of rain. Aerial drones mapped residential streets to direct shallow-draft rescue boats away from submerged hazards.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 4. HOW IT WORKS (U-NET ARCHITECTURE) */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-6 space-y-2">
          <div className="flex items-center gap-2">
            <span className="rounded bg-accent-cyan/15 px-2 py-0.5 font-mono text-xs font-semibold text-accent-cyan border border-accent-cyan/30">
              DEEP LEARNING PIPELINE
            </span>
            <span className="text-xs text-slate-400">Viva-Grade Pedagogical Architecture</span>
          </div>
          <h2 className="text-2xl font-bold text-white sm:text-3xl">
            Inside the AquaMap U-Net Neural Engine
          </h2>
          <p className="text-sm text-slate-400 max-w-2xl">
            Explore how lateral skip connections bridge high-frequency spatial edge details across contracting and expanding convolutional pathways.
          </p>
        </div>

        <ArchitectureDiagram />
      </section>

      {/* 5. BENTO GRID (CORE CAPABILITIES) */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-8 space-y-2 text-center md:text-left">
          <div className="flex items-center gap-2 justify-center md:justify-start">
            <span className="rounded bg-accent-cyan/15 px-2 py-0.5 font-mono text-xs font-semibold text-accent-cyan border border-accent-cyan/30">
              CORE CAPABILITIES
            </span>
          </div>
          <h2 className="text-2xl font-bold text-white sm:text-3xl">
            Engineered for High-Stakes Disaster Telemetry
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Card 1: Transfer Learning */}
          <div className="rounded-2xl border border-white/10 bg-surface/80 p-6 backdrop-blur-md space-y-3 glass-panel-hover">
            <div className="h-10 w-10 rounded-xl bg-accent-cyan/10 border border-accent-cyan/30 flex items-center justify-center text-accent-cyan">
              <Cpu className="h-5 w-5" />
            </div>
            <h3 className="text-lg font-bold text-white">MobileNetV2 Transfer Learning</h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              Trained on ImageNet-1k, utilizing inverted residuals and linear bottlenecks. Achieves a <strong>0.8840 test Dice score</strong> (+4.3% higher than scratch), critical for small drone datasets.
            </p>
          </div>

          {/* Card 2: TTA Uncertainty */}
          <div className="rounded-2xl border border-white/10 bg-surface/80 p-6 backdrop-blur-md space-y-3 glass-panel-hover">
            <div className="h-10 w-10 rounded-xl bg-accent-amber/10 border border-accent-amber/30 flex items-center justify-center text-accent-amber">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <h3 className="text-lg font-bold text-white">Test-Time Uncertainty (TTA)</h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              Calculates pixel-level standard deviation across 4 geometric flip augmentations. Delivers confidence bounds on flood boundaries and alerts operators to ambiguous marsh margins.
            </p>
          </div>

          {/* Card 3: Grad-CAM Explainability */}
          <div className="rounded-2xl border border-white/10 bg-surface/80 p-6 backdrop-blur-md space-y-3 glass-panel-hover">
            <div className="h-10 w-10 rounded-xl bg-accent-coral/10 border border-accent-coral/30 flex items-center justify-center text-accent-coral">
              <Layers className="h-5 w-5" />
            </div>
            <h3 className="text-lg font-bold text-white">Grad-CAM Spatial Interpretability</h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              Backpropagates segmentation gradients into the final decoder convolutional stage to visualize exactly which spatial features drove the water classification.
            </p>
          </div>

          {/* Card 4: Change Detection */}
          <div className="rounded-2xl border border-white/10 bg-surface/80 p-6 backdrop-blur-md space-y-3 glass-panel-hover">
            <div className="h-10 w-10 rounded-xl bg-accent-blue/10 border border-accent-blue/30 flex items-center justify-center text-accent-blue">
              <Activity className="h-5 w-5" />
            </div>
            <h3 className="text-lg font-bold text-white">Before & After Flood Tracking</h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              Calculates delta inundation percentages between two flight passes. Automatically renders newly submerged zones in <span className="text-accent-coral font-bold">Coral</span> and receded waters in <span className="text-accent-emerald font-bold">Emerald</span>.
            </p>
          </div>

          {/* Card 5: ONNX Speed */}
          <div className="rounded-2xl border border-white/10 bg-surface/80 p-6 backdrop-blur-md space-y-3 glass-panel-hover">
            <div className="h-10 w-10 rounded-xl bg-accent-emerald/10 border border-accent-emerald/30 flex items-center justify-center text-accent-emerald">
              <Zap className="h-5 w-5" />
            </div>
            <h3 className="text-lg font-bold text-white">ONNX Runtime 2.58x Acceleration</h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              Exported with constant folding and graph optimization. Cuts CPU inference latency from 79.8ms down to <strong>30.9ms</strong>, enabling 32+ FPS edge inference on portable rescue laptops.
            </p>
          </div>

          {/* Card 6: PDF Reports */}
          <div className="rounded-2xl border border-white/10 bg-surface/80 p-6 backdrop-blur-md space-y-3 glass-panel-hover">
            <div className="h-10 w-10 rounded-xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-400">
              <FileText className="h-5 w-5" />
            </div>
            <h3 className="text-lg font-bold text-white">Automated PDF Incident Reports</h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              Generates instant, publication-ready disaster assessment dossiers with 2x2 visual diagnostics, numerical water area percentage, uncertainty metrics, and legal disclaimers.
            </p>
          </div>
        </div>
      </section>

      {/* 6. 3-MODEL BENCHMARK TEASER */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="rounded-2xl border border-white/10 bg-surface/70 p-6 md:p-8 backdrop-blur-md">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/10 pb-6">
            <div>
              <span className="rounded bg-accent-cyan/15 px-2 py-0.5 font-mono text-xs font-semibold text-accent-cyan border border-accent-cyan/30">
                SCIENTIFIC BENCHMARK
              </span>
              <h2 className="mt-2 text-2xl font-bold text-white">
                Honest 3-Model Test Split Evaluation
              </h2>
              <p className="text-xs text-slate-400">
                Strict evaluation on 44 unseen aerial test images with leak-free perceptual hashing split.
              </p>
            </div>
            <Link
              href="/performance"
              className="inline-flex items-center gap-2 rounded-xl bg-surface-elevated border border-white/10 px-4 py-2 text-xs font-semibold text-accent-cyan hover:bg-white/5"
            >
              <span>View Full Charts & Tables</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* SegFormer B0 */}
            <div className="rounded-xl border border-white/5 bg-[#050B18]/60 p-5 space-y-4">
              <div className="flex items-center justify-between">
                <span className="font-bold text-sm text-white">SegFormer-B0</span>
                <span className="rounded bg-accent-cyan/15 px-2 py-0.5 font-mono text-[10px] text-accent-cyan">
                  Transformer Attention
                </span>
              </div>
              <div className="grid grid-cols-2 gap-3 font-mono text-xs">
                <div>
                  <span className="text-slate-500 block text-[10px]">Test Dice</span>
                  <span className="text-base font-bold text-accent-cyan">0.8847</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px]">Test IoU</span>
                  <span className="text-base font-bold text-white">0.7932</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px]">Recall</span>
                  <span className="text-base font-bold text-accent-emerald">0.8922</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px]">Latency (MPS)</span>
                  <span className="text-base font-bold text-white">73.1 ms</span>
                </div>
              </div>
              <p className="text-[11px] text-slate-400">
                Highest recall of all models due to lightweight multi-head self-attention capturing global context.
              </p>
            </div>

            {/* U-Net MobileNetV2 (Default Production Model) */}
            <div className="rounded-xl border border-accent-cyan/40 bg-accent-cyan/[0.04] p-5 space-y-4 shadow-cyan-glow relative">
              <div className="absolute -top-2.5 right-4 rounded-full bg-accent-cyan px-2.5 py-0.5 font-mono text-[9px] font-bold text-black uppercase tracking-wider">
                Production Model
              </div>
              <div className="flex items-center justify-between">
                <span className="font-bold text-sm text-white">U-Net MobileNetV2</span>
                <span className="rounded bg-accent-emerald/15 px-2 py-0.5 font-mono text-[10px] text-accent-emerald">
                  CNN + Skip
                </span>
              </div>
              <div className="grid grid-cols-2 gap-3 font-mono text-xs">
                <div>
                  <span className="text-slate-500 block text-[10px]">Test Dice</span>
                  <span className="text-base font-bold text-accent-cyan">0.8840</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px]">Test IoU</span>
                  <span className="text-base font-bold text-white">0.7922</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px]">Precision</span>
                  <span className="text-base font-bold text-accent-emerald">0.8869</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px]">ONNX CPU</span>
                  <span className="text-base font-bold text-accent-cyan">30.9 ms</span>
                </div>
              </div>
              <p className="text-[11px] text-slate-400">
                Optimal trade-off: highest precision (0.8869), exceptional edge delineation, and 2.58x ONNX CPU acceleration.
              </p>
            </div>

            {/* U-Net Scratch (Ablation Baseline) */}
            <div className="rounded-xl border border-white/5 bg-[#050B18]/60 p-5 space-y-4">
              <div className="flex items-center justify-between">
                <span className="font-bold text-sm text-white">U-Net Scratch</span>
                <span className="rounded bg-white/5 px-2 py-0.5 font-mono text-[10px] text-slate-400">
                  Ablation Baseline
                </span>
              </div>
              <div className="grid grid-cols-2 gap-3 font-mono text-xs">
                <div>
                  <span className="text-slate-500 block text-[10px]">Test Dice</span>
                  <span className="text-base font-bold text-slate-300">0.8407</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px]">Test IoU</span>
                  <span className="text-base font-bold text-white">0.7252</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px]">Recall</span>
                  <span className="text-base font-bold text-slate-300">0.8311</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px]">Δ vs Transfer</span>
                  <span className="text-base font-bold text-accent-coral">-4.33% Dice</span>
                </div>
              </div>
              <p className="text-[11px] text-slate-400">
                Proves transfer learning is essential for small aerial datasets; lacks pre-trained visual edge priors.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 7. VIVA & SCIENTIFIC DEFENSE FAQ */}
      <section className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
        <div className="mb-6 space-y-2 text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-surface px-3 py-1 font-mono text-xs text-accent-cyan">
            <span>SCIENTIFIC VIVA CHEAT SHEET</span>
          </div>
          <h2 className="text-2xl font-bold text-white sm:text-3xl">
            Frequently Asked Questions & Examiner Questions
          </h2>
          <p className="text-sm text-slate-400">
            Pedagogical answers to anticipated viva and academic defense questions.
          </p>
        </div>

        <div className="space-y-3">
          {faqItems.map((item, idx) => (
            <div
              key={idx}
              className="rounded-xl border border-white/10 bg-surface/80 overflow-hidden backdrop-blur-md transition-all"
            >
              <button
                onClick={() => toggleFaq(idx)}
                className="w-full flex items-center justify-between p-4 text-left font-semibold text-sm text-white hover:text-accent-cyan transition-colors"
              >
                <span>{item.q}</span>
                <ChevronDown
                  className={`h-4 w-4 text-slate-400 transition-transform ${
                    openFaq === idx ? "rotate-180 text-accent-cyan" : ""
                  }`}
                />
              </button>
              {openFaq === idx && (
                <div className="border-t border-white/5 bg-[#050B18]/60 p-4 text-xs text-slate-300 leading-relaxed">
                  {item.a}
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* 8. FINAL CALL TO ACTION */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="relative overflow-hidden rounded-3xl border border-accent-cyan/30 bg-gradient-to-b from-surface to-[#050B18] p-8 md:p-14 text-center shadow-cyan-glow">
          <div className="mx-auto max-w-2xl space-y-4">
            <h2 className="text-3xl font-extrabold text-white sm:text-4xl">
              Ready to Segment Drone Flood Photography?
            </h2>
            <p className="text-sm text-slate-300">
              Upload aerial imagery or choose from pre-loaded test samples to evaluate segmentation masks, TTA uncertainty bounds, and Grad-CAM interpretability.
            </p>
            <div className="flex flex-wrap justify-center gap-4 pt-4">
              <Link
                href="/analyze"
                className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-accent-cyan to-accent-blue px-6 py-3.5 text-sm font-bold text-black transition-all hover:scale-105 hover:shadow-cyan-glow"
              >
                <span>Open Analysis Workspace</span>
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/compare"
                className="flex items-center gap-2 rounded-xl border border-white/10 bg-surface px-6 py-3.5 text-sm font-semibold text-white hover:bg-white/5"
              >
                <Activity className="h-4 w-4 text-accent-cyan" />
                <span>Run Temporal Change Detection</span>
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
