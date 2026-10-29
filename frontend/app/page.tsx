"use client";

import Link from "next/link";
import {
  ArrowRight,
  ChevronDown,
  Database,
  FileText,
  BarChart3,
  Box,
  Zap,
} from "lucide-react";
import { useState, useEffect, useRef } from "react";
import dynamic from "next/dynamic";
import { ScrollReveal } from "@/components/ScrollReveal";
import { ArchitectureDiagram } from "@/components/ArchitectureDiagram";

const EarthGlobe = dynamic(
  () => import("@/components/EarthGlobe").then((m) => m.EarthGlobe),
  { ssr: false, loading: () => <div className="h-[420px] w-full flex items-center justify-center text-slate-400">Loading radar globe…</div> }
);

// ── Count-up hook ──────────────────────────────────────────────────
function useCountUp(target: number, duration = 1200, start = false) {
  const [val, setVal] = useState(0);
  useEffect(() => {
    if (!start) return;
    let raf: number;
    const startTime = performance.now();
    const tick = (now: number) => {
      const t = Math.min((now - startTime) / duration, 1);
      const eased = 1 - Math.pow(1 - t, 3);
      setVal(eased * target);
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [start, target, duration]);
  return val;
}

// ── Sample Strip (hover to reveal mask) ──────────────────────────
const SAMPLES = [
  { id: 1, url: "/samples/sample_1.jpg", waterPct: "26.6%", label: "Flooded field" },
  { id: 2, url: "/samples/sample_2.jpg", waterPct: "9.9%",  label: "Urban drainage" },
  { id: 3, url: "/samples/sample_3.jpg", waterPct: "45.1%", label: "River overflow" },
  { id: 4, url: "/samples/sample_4.jpg", waterPct: "31.2%", label: "Aerial flood" },
  { id: 5, url: "/samples/sample_5.jpg", waterPct: "18.7%", label: "Wetlands" },
];

function SampleStrip() {
  const [hovered, setHovered] = useState<number | null>(null);
  const [predSrc, setPredSrc] = useState<Record<number, string>>({});

  useEffect(() => {
    fetch("/samples/samples.json")
      .then((r) => r.json())
      .then((data: Array<{ id: number; prediction?: { overlay_png_base64?: string } }>) => {
        const map: Record<number, string> = {};
        data.forEach((s) => {
          if (s.prediction?.overlay_png_base64) {
            map[s.id] = `data:image/png;base64,${s.prediction.overlay_png_base64}`;
          }
        });
        setPredSrc(map);
      })
      .catch(() => {});
  }, []);

  return (
    <div className="space-y-3">
      <p className="text-label text-center px-4">
        Hover or tap to see HydroVision&apos;s prediction on unseen test images
      </p>
      <div className="flex gap-3 overflow-x-auto pb-2 px-4 sm:px-0 -mx-4 sm:mx-0 snap-x scrollbar-thin">
        {SAMPLES.map((s) => (
          <div
            key={s.id}
            className="relative flex-shrink-0 snap-start rounded-xl overflow-hidden cursor-pointer"
            style={{ width: 175, height: 115, border: "1px solid var(--border)" }}
            onMouseEnter={() => setHovered(s.id)}
            onMouseLeave={() => setHovered(null)}
            onTouchStart={() => setHovered(hovered === s.id ? null : s.id)}
            onFocus={() => setHovered(s.id)}
            onBlur={() => setHovered(null)}
            tabIndex={0}
            role="img"
            aria-label={`${s.label}: ${s.waterPct} water pixels`}
          >
            {/* Raw image */}
            <img
              src={s.url}
              alt={s.label}
              className="absolute inset-0 h-full w-full object-cover"
            />
            {/* Prediction overlay — clip-path wipe */}
            {predSrc[s.id] && (
              <img
                src={predSrc[s.id]}
                alt={`${s.label} prediction`}
                className="absolute inset-0 h-full w-full object-cover transition-all duration-300"
                style={{
                  clipPath: hovered === s.id ? "inset(0 0% 0 0)" : "inset(0 100% 0 0)",
                }}
              />
            )}
            {/* Label */}
            <div
              className="absolute bottom-0 left-0 right-0 px-2 py-1.5"
              style={{ background: "linear-gradient(transparent, rgba(5,9,20,0.85))" }}
            >
              <p className="text-xs text-white font-medium truncate">{s.label}</p>
              <p className="text-xs font-mono" style={{ color: "var(--water)" }}>
                {s.waterPct} water
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Metric Proof Card (Matching Electronic Neon Style Sheet) ─────
function ProofMetricCard({
  icon: Icon,
  accentColor,
  iconBg,
  iconBorder,
  label,
  value,
  unit,
  caption,
  started,
}: {
  icon: React.ElementType;
  accentColor: string;
  iconBg: string;
  iconBorder: string;
  label: string;
  value: number;
  unit?: string;
  caption: string;
  started: boolean;
}) {
  const count = useCountUp(value, 1200, started);
  const formatted = unit === "ms"
    ? `${Math.round(count)}${unit}`
    : count.toFixed(3);

  return (
    <div className="flex items-center gap-3.5 rounded-2xl border border-[#1E334B] bg-[#0A1424] p-4 transition-all hover:border-cyan-500/40 hover:shadow-[0_0_20px_rgba(34,211,238,0.12)]">
      <div
        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border"
        style={{ background: iconBg, borderColor: iconBorder, color: accentColor }}
      >
        <Icon className="h-5 w-5" />
      </div>
      <div className="min-w-0 flex-1">
        <div
          className="font-mono text-2xl sm:text-3xl font-bold tracking-tight leading-none"
          style={{ color: accentColor }}
        >
          {formatted}
        </div>
        <div className="text-xs sm:text-sm font-semibold text-white mt-1 truncate">{label}</div>
        <div className="text-[10px] sm:text-xs text-slate-400 truncate">{caption}</div>
      </div>
    </div>
  );
}

// ── FAQ Item ──────────────────────────────────────────────────────
function FaqItem({
  q,
  a,
  open,
  onToggle,
}: {
  q: string;
  a: string;
  open: boolean;
  onToggle: () => void;
}) {
  return (
    <div
      className="rounded-xl overflow-hidden transition-all"
      style={{ border: "1px solid var(--border)", background: "var(--surface-1)" }}
    >
      <button
        onClick={onToggle}
        className="flex w-full items-start justify-between gap-4 px-6 py-4 text-left transition-colors hover:bg-white/5"
        aria-expanded={open}
      >
        <span className="text-sm font-medium" style={{ color: "var(--text)" }}>
          {q}
        </span>
        <ChevronDown
          className="mt-0.5 h-5 w-5 flex-shrink-0 transition-transform"
          style={{ color: "var(--text-muted)", transform: open ? "rotate(180deg)" : "rotate(0)" }}
        />
      </button>
      {open && (
        <div
          className="px-6 pb-5"
          style={{ borderTop: "1px solid var(--border)", paddingTop: "1rem" }}
        >
          <p className="text-small" style={{ color: "var(--text-2)" }}>{a}</p>
        </div>
      )}
    </div>
  );
}

// ── Main Landing Page ─────────────────────────────────────────────
export default function LandingPage() {
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const metricsRef = useRef<HTMLDivElement>(null);
  const [metricsStarted, setMetricsStarted] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setMetricsStarted(true); },
      { threshold: 0.3 }
    );
    if (metricsRef.current) observer.observe(metricsRef.current);
    return () => observer.disconnect();
  }, []);

  const faqItems = [
    {
      q: "Why combined BCE + Dice loss instead of standard Cross-Entropy?",
      a: "In aerial flood imagery, water pixels can occupy as little as 4% or up to 88% of the scene (severe foreground–background imbalance). Standard Cross-Entropy produces gradients dominated by the majority background class. Dice Loss directly optimises the overlap between prediction and ground truth, while BCE stabilises early gradient descent. The 0.5 BCE + 0.5 Dice formulation ensures rapid convergence and high boundary precision.",
    },
    {
      q: "Why does U-Net MobileNetV2 outperform U-Net from scratch by +4.3 Dice points?",
      a: "Measured on the 44-image held-out test split: MobileNetV2 (0.884 Dice) vs. scratch (0.841 Dice). On a small, specialised aerial dataset of ~290 images, training from scratch struggles with low-level visual primitives. Pre-training on ImageNet-1k equips the encoder with robust multi-scale filters, so the network can focus on learning aerial water reflectance patterns.",
    },
    {
      q: "How does Test-Time Augmentation (TTA) quantify prediction uncertainty?",
      a: "The image is passed through 4 geometric transforms: identity, horizontal flip, vertical flip, and diagonal transpose. The 4 probability maps are de-augmented and averaged. Standard deviation across passes forms a pixel uncertainty map. Sharp flood boundaries show low variance (<0.05); ambiguous silt edges and mud reflections show high variance (>0.25).",
    },
    {
      q: "How was data leakage controlled across splits?",
      a: "We computed 64-bit perceptual hashes (dHash) across all 290 images and identified near-duplicate clusters (Hamming distance ≤ 8). Split generation enforced strict cluster-grouping so all variants of a flight pass land in the same split. This is described as leakage-controlled, not zero leakage, because the test images come from the same distribution.",
    },
    {
      q: "What are HydroVision's known limitations?",
      a: "HydroVision processes RGB optical imagery only. It cannot penetrate dense canopy or heavy cloud cover (unlike microwave SAR sensors). In conditions of extreme turbid silt where water colour matches surrounding wet earth, the model flags elevated TTA uncertainty rather than producing a falsely confident classification. It is a research prototype and should not be used for safety-critical decisions.",
    },
  ];

  return (
    <div className="flex flex-col" style={{ gap: "6rem" }}>
      {/* ── 1. HERO ───────────────────────────────────────────── */}
      <section className="relative overflow-hidden pt-8 md:pt-14">
        <div className="container-landing">
          <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-12">
            {/* Left */}
            <div className="lg:col-span-7 space-y-6">
              {/* Technical Tag matching style sheet */}
              <div className="inline-flex items-center gap-2">
                <span className="h-px w-6 bg-cyan-400/60" />
                <span className="text-[11px] font-mono font-bold tracking-widest uppercase text-cyan-400">
                  AI Flood Segmentation
                </span>
              </div>

              {/* Redesigned Hero Headline */}
              <h1 className="text-display tracking-tight text-white">
                See the flood.<br />
                <span
                  className="bg-clip-text text-transparent drop-shadow-[0_0_25px_rgba(168,85,247,0.35)]"
                  style={{
                    backgroundImage: "linear-gradient(100deg, #22D3EE 0%, #3B82F6 48%, #A855F7 100%)",
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                  }}
                >
                  Pixel by pixel.
                </span>
              </h1>

              <p className="text-body-lg text-slate-300" style={{ maxWidth: "56ch" }}>
                HydroVision uses a transfer-learning U-Net to label floodwater in drone and
                aerial photos, then shows how confident it is and what it looked at.
              </p>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center gap-3 pt-2">
                <Link
                  href="/analyze"
                  className="group relative inline-flex items-center gap-2 rounded-xl px-6 py-3.5 text-sm font-bold text-[#050914] transition-all hover:scale-[1.02] active:scale-[0.98]"
                  style={{
                    background: "linear-gradient(135deg, #22D3EE 0%, #8B5CF6 100%)",
                    boxShadow: "0 0 20px rgba(139, 92, 246, 0.4), 0 0 60px rgba(34, 211, 238, 0.15)",
                  }}
                >
                  <span>Analyze an image</span>
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </Link>

                <a
                  href="#how-it-works"
                  className="inline-flex items-center gap-2 rounded-xl border border-[#1E334B] bg-[#0A1424] px-6 py-3.5 text-sm font-semibold text-[#F8FAFC] transition-all hover:border-cyan-400/40 hover:bg-[#101D30]"
                >
                  <span>See how it works</span>
                  <ChevronDown className="h-4 w-4 text-slate-400" />
                </a>
              </div>

              {/* Proof Row - 3 Metric Cards matching design tokens */}
              <div
                ref={metricsRef}
                className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-4 border-t border-[#1E334B]"
              >
                <ProofMetricCard
                  icon={Box}
                  accentColor="#22D3EE"
                  iconBg="rgba(34, 211, 238, 0.1)"
                  iconBorder="rgba(34, 211, 238, 0.3)"
                  label="Test Dice"
                  value={0.884}
                  caption="44 held-out test images"
                  started={metricsStarted}
                />
                <ProofMetricCard
                  icon={BarChart3}
                  accentColor="#3B82F6"
                  iconBg="rgba(59, 130, 246, 0.1)"
                  iconBorder="rgba(59, 130, 246, 0.3)"
                  label="Test IoU"
                  value={0.792}
                  caption="44 held-out test images"
                  started={metricsStarted}
                />
                <ProofMetricCard
                  icon={Zap}
                  accentColor="#A855F7"
                  iconBg="rgba(168, 85, 247, 0.1)"
                  iconBorder="rgba(168, 85, 247, 0.3)"
                  label="CPU Latency"
                  value={31}
                  unit="ms"
                  caption="ONNX Runtime, 256×256"
                  started={metricsStarted}
                />
              </div>
            </div>

            {/* Right – Globe */}
            <div className="lg:col-span-5 flex justify-center">
              <div className="w-full max-w-[480px]">
                <EarthGlobe />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── 2. Live Sample Strip ──────────────────────────────── */}
      <section className="container-landing">
        <SampleStrip />
      </section>

      {/* ── 3. Before / After Slider ──────────────────────────── */}
      <section className="container-landing space-y-4">
        <div className="text-center space-y-2">
          <p className="text-label">Real model output on an unseen test image</p>
          <h2 className="text-h2" style={{ color: "var(--text)" }}>
            See the prediction for yourself
          </h2>
          <p className="text-small" style={{ color: "var(--text-2)" }}>
            Drag the divider to compare the raw aerial image with HydroVision&apos;s water mask.
          </p>
        </div>
        <ScrollReveal />
        <div className="text-center">
          <Link
            href="/analyze"
            className="text-sm font-semibold hover:underline inline-flex items-center gap-1.5"
            style={{ color: "var(--link)" }}
          >
            <span>Try your own image</span>
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>

      {/* ── 4. How It Works ───────────────────────────────────── */}
      <section id="how-it-works" className="container-landing space-y-10">
        <div className="text-center space-y-3">
          <p className="text-label">Architecture</p>
          <h2 className="text-h2" style={{ color: "var(--text)" }}>How HydroVision works</h2>
          <p className="text-body" style={{ color: "var(--text-2)", maxWidth: "60ch", margin: "0 auto" }}>
            A U-Net with a MobileNetV2 encoder pre-trained on ImageNet-1k is fine-tuned on aerial flood images.
            The decoder reconstructs a pixel-wise water mask, and TTA uncertainty quantifies confidence.
          </p>
        </div>
        <ArchitectureDiagram />
      </section>

      {/* ── 5. Bento grid ─────────────────────────────────────── */}
      <section className="container-landing space-y-6">
        <div className="text-center space-y-2">
          <p className="text-label">What HydroVision can do</p>
          <h2 className="text-h2" style={{ color: "var(--text)" }}>Key capabilities</h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[
            {
              icon: "💧",
              title: "Pixel-level water masks",
              body: "Segments floodwater at pixel level in aerial and drone RGB imagery using a transfer-learning U-Net with Dice 0.884.",
            },
            {
              icon: "🔬",
              title: "TTA Uncertainty maps",
              body: "Four-pass test-time augmentation produces per-pixel uncertainty. High values flag ambiguous silt, shadows, or cloud edges.",
            },
            {
              icon: "🧠",
              title: "Grad-CAM explainability",
              body: "Gradient-weighted class activation maps show which pixels drove the model's water prediction — interpretable for auditors.",
            },
            {
              icon: "⚡",
              title: "31 ms ONNX inference",
              body: "ONNX Runtime delivers 2.6× speedup over PyTorch CPU on the same hardware, at max |Δ output| < 1 × 10⁻⁵.",
            },
            {
              icon: "📊",
              title: "3-model benchmark",
              body: "Comparable evaluation on 44 held-out test images: SegFormer-B0, U-Net MobileNetV2, and U-Net from scratch.",
            },
            {
              icon: "📄",
              title: "Downloadable PDF report",
              body: "Overlay, uncertainty map, Grad-CAM, and per-image metrics bundled into a PDF for offline review.",
            },
          ].map((item) => (
            <div key={item.title} className="card">
              <div className="text-3xl mb-3">{item.icon}</div>
              <h3 className="text-h3 mb-2" style={{ color: "var(--text)" }}>{item.title}</h3>
              <p className="text-small" style={{ color: "var(--text-2)" }}>{item.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── 6. Quick links ────────────────────────────────────── */}
      <section className="container-landing">
        <div
          className="rounded-2xl p-8 grid grid-cols-1 sm:grid-cols-3 gap-6"
          style={{ background: "var(--surface-1)", border: "1px solid var(--border)" }}
        >
          <Link
            href="/performance"
            className="flex flex-col gap-2 rounded-xl p-5 transition-all hover:border-cyan-400/40 hover:shadow-lg group"
            style={{ background: "var(--surface-2)", border: "1px solid var(--border)" }}
          >
            <BarChart3 className="h-6 w-6" style={{ color: "var(--water)" }} />
            <h3 className="text-h3" style={{ color: "var(--text)" }}>Benchmark</h3>
            <p className="text-small" style={{ color: "var(--text-2)" }}>
              3-model comparison, ONNX latency, robustness, and error analysis.
            </p>
          </Link>
          <Link
            href="/dataset"
            className="flex flex-col gap-2 rounded-xl p-5 transition-all hover:border-cyan-400/40 hover:shadow-lg group"
            style={{ background: "var(--surface-2)", border: "1px solid var(--border)" }}
          >
            <Database className="h-6 w-6" style={{ color: "var(--water)" }} />
            <h3 className="text-h3" style={{ color: "var(--text)" }}>Dataset Explorer</h3>
            <p className="text-small" style={{ color: "var(--text-2)" }}>
              290 images, water % distribution, and how splits were controlled for leakage.
            </p>
          </Link>
          <Link
            href="/model-card"
            className="flex flex-col gap-2 rounded-xl p-5 transition-all hover:border-cyan-400/40 hover:shadow-lg group"
            style={{ background: "var(--surface-2)", border: "1px solid var(--border)" }}
          >
            <FileText className="h-6 w-6" style={{ color: "var(--water)" }} />
            <h3 className="text-h3" style={{ color: "var(--text)" }}>Model Card</h3>
            <p className="text-small" style={{ color: "var(--text-2)" }}>
              Intended use, out-of-scope use, metrics, known failure cases, and ethical notes.
            </p>
          </Link>
        </div>
      </section>

      {/* ── 7. FAQ ────────────────────────────────────────────── */}
      <section className="container-landing space-y-6 pb-16">
        <div className="text-center space-y-2">
          <p className="text-label">Questions &amp; limitations</p>
          <h2 className="text-h2" style={{ color: "var(--text)" }}>Common questions</h2>
        </div>
        <div className="max-w-3xl mx-auto space-y-3">
          {faqItems.map((item, idx) => (
            <FaqItem
              key={idx}
              q={item.q}
              a={item.a}
              open={openFaq === idx}
              onToggle={() => setOpenFaq(openFaq === idx ? null : idx)}
            />
          ))}
        </div>
      </section>

      {/* ── 8. CTA ────────────────────────────────────────────── */}
      <section className="container-landing pb-24">
        <div
          className="rounded-2xl p-10 text-center space-y-5"
          style={{
            background: "linear-gradient(135deg, var(--surface-1), var(--surface-2))",
            border: "1px solid var(--border)",
          }}
        >
          <h2 className="text-h2" style={{ color: "var(--text)" }}>
            Try it on your own image
          </h2>
          <p className="text-body" style={{ color: "var(--text-2)", maxWidth: "50ch", margin: "0 auto" }}>
            Upload a drone or satellite aerial image and see a pixel-level flood mask, uncertainty map,
            and Grad-CAM in seconds.
          </p>
          <Link
            href="/analyze"
            className="inline-flex items-center gap-2 rounded-xl px-8 py-3.5 text-sm font-bold text-[#050914] transition-all hover:scale-[1.02]"
            style={{
              background: "linear-gradient(135deg, #22D3EE 0%, #8B5CF6 100%)",
              boxShadow: "0 0 20px rgba(139, 92, 246, 0.4), 0 0 60px rgba(34, 211, 238, 0.15)",
            }}
          >
            <span>Analyze an image</span>
            <ArrowRight className="h-4 w-4" />
          </Link>
          <p className="text-xs" style={{ color: "var(--text-muted)" }}>
            Accepts JPEG or PNG up to 10 MB · No account required · Results stay in your browser
          </p>
        </div>
      </section>
    </div>
  );
}
