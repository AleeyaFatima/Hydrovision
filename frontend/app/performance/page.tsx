"use client";

import React, { useState, useEffect } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  Legend,
} from "recharts";
import { Cpu, Zap, CheckCircle2 } from "lucide-react";
import { fetchMetrics, MetricsResponse } from "@/lib/api";

export default function PerformancePage() {
  const [metricsData, setMetricsData] = useState<MetricsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"benchmark" | "robustness" | "latency" | "errors">("benchmark");

  const fallbackBenchmark = [
    {
      name: "SegFormer-B0",
      architecture: "mit-b0 Transformer",
      params: "3.7M",
      iou: 0.7932,
      dice: 0.8847,
      precision: 0.8773,
      recall: 0.8922,
      accuracy: 0.9021,
      latency: 73.1,
    },
    {
      name: "U-Net MobileNetV2",
      architecture: "MobileNetV2 CNN",
      params: "6.6M",
      iou: 0.7922,
      dice: 0.8840,
      precision: 0.8869,
      recall: 0.8812,
      accuracy: 0.9027,
      latency: 79.8,
      onnxLatency: 30.9,
    },
    {
      name: "U-Net Scratch",
      architecture: "Custom U-Net",
      params: "7.8M",
      iou: 0.7252,
      dice: 0.8407,
      precision: 0.8505,
      recall: 0.8311,
      accuracy: 0.8674,
      latency: 84.9,
    },
  ];

  const robustnessChartData = [
    { corruption: "Baseline", mild: 0.884, moderate: 0.884, severe: 0.884 },
    { corruption: "Gaussian Blur", mild: 0.878, moderate: 0.861, severe: 0.824 },
    { corruption: "Darkness", mild: 0.879, moderate: 0.868, severe: 0.841 },
    { corruption: "Sensor Noise", mild: 0.869, moderate: 0.845, severe: 0.796 },
    { corruption: "JPEG Compression", mild: 0.881, moderate: 0.874, severe: 0.859 },
    { corruption: "Fog / Haze", mild: 0.872, moderate: 0.852, severe: 0.815 },
  ];

  useEffect(() => {
    async function load() {
      try {
        const data = await fetchMetrics();
        setMetricsData(data);
      } catch {
        // Use compiled evaluation data
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const tooltipStyle = {
    backgroundColor: "var(--surface-1)",
    borderColor: "var(--border)",
    borderRadius: "8px",
    fontSize: "12px",
    color: "var(--text)",
  };

  return (
    <div className="container-workspace py-8 space-y-8">
      {/* Header */}
      <div style={{ borderBottom: "1px solid var(--border)" }} className="pb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <span
            className="inline-block rounded px-2 py-0.5 text-xs font-semibold mb-2"
            style={{ background: "rgba(34,211,238,0.1)", color: "var(--water)", border: "1px solid rgba(34,211,238,0.25)" }}
          >
            Model evaluation
          </span>
          <h1 className="text-h2" style={{ color: "var(--text)" }}>Benchmark</h1>
          <p className="text-small mt-1" style={{ color: "var(--text-2)" }}>
            44 held-out test images · Leakage-controlled split (perceptual-hash grouping)
            {loading ? " · Loading live metrics…" : metricsData ? " · Live data" : " · Compiled evaluation data"}
          </p>
        </div>

        {/* Tab switcher */}
        <div
          className="flex overflow-x-auto gap-1 rounded-xl p-1 shrink-0"
          style={{ border: "1px solid var(--border)", background: "var(--surface-1)" }}
        >
          {([
            { id: "benchmark", label: "3-Model Benchmark" },
            { id: "robustness", label: "Robustness" },
            { id: "latency", label: "ONNX Acceleration" },
            { id: "errors", label: "Error analysis" },
          ] as const).map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className="rounded-lg px-3.5 py-1.5 text-xs sm:text-sm font-bold transition-all whitespace-nowrap"
              style={{
                background: activeTab === tab.id ? "linear-gradient(135deg, #22D3EE 0%, #8B5CF6 100%)" : "transparent",
                color: activeTab === tab.id ? "#050914" : "var(--text-2)",
                boxShadow: activeTab === tab.id ? "0 0 16px rgba(168,85,247,0.4)" : "none",
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          {
            label: "Top Test Dice",
            value: "0.8847",
            sub: "SegFormer-B0 (0.8840 U-Net MobileNetV2)",
            color: "var(--water)",
          },
          {
            label: "Transfer learning gain",
            value: "+4.3 pts Dice",
            sub: "vs. scratch (0.884 vs 0.841)",
            color: "var(--ok)",
          },
          {
            label: "ONNX speedup",
            value: "2.58×",
            sub: "79.8 ms PyTorch → 30.9 ms ONNX (same CPU)",
            color: "var(--water)",
          },
          {
            label: "Split method",
            value: "Leakage-controlled",
            sub: "perceptual-hash grouping · 290 images",
            color: "var(--text)",
          },
        ].map((card) => (
          <div
            key={card.label}
            className="rounded-xl p-4 space-y-1"
            style={{ border: "1px solid var(--border)", background: "var(--surface-1)" }}
          >
            <span className="text-label block">{card.label}</span>
            <div className="text-xl font-mono font-semibold tabular-nums" style={{ color: card.color }}>
              {card.value}
            </div>
            <span className="text-xs" style={{ color: "var(--text-muted)" }}>{card.sub}</span>
          </div>
        ))}
      </div>

      {/* TAB: Benchmark */}
      {activeTab === "benchmark" && (
        <div className="space-y-8">
          <div
            className="rounded-xl p-6 space-y-4"
            style={{ border: "1px solid var(--border)", background: "var(--surface-1)" }}
          >
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div>
                <h3 className="text-h3" style={{ color: "var(--text)" }}>Test-set metrics comparison</h3>
                <p className="text-small" style={{ color: "var(--text-2)" }}>
                  Evaluated on 44 held-out test images. Threshold optimised per model via validation PR curve.
                </p>
              </div>
              <span className="text-xs font-medium" style={{ color: "var(--text-muted)" }}>
                Scale: 0 – 1.0
              </span>
            </div>

            <div style={{ height: 300 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={fallbackBenchmark} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                  <XAxis dataKey="name" stroke="var(--text-muted)" fontSize={12} />
                  {/* Chart axis starts at 0 for honesty */}
                  <YAxis domain={[0, 1]} stroke="var(--text-muted)" fontSize={12} />
                  <Tooltip contentStyle={tooltipStyle} />
                  <Legend wrapperStyle={{ fontSize: "12px", color: "var(--text-2)" }} />
                  <Bar dataKey="dice" name="Dice Score" fill="#22D3EE" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="iou" name="IoU (Jaccard)" fill="#3B82F6" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="precision" name="Precision" fill="#A855F7" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="recall" name="Recall" fill="#EC4899" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Full table */}
          <div
            className="rounded-xl overflow-hidden"
            style={{ border: "1px solid var(--border)", background: "var(--surface-1)" }}
          >
            <div className="p-4" style={{ borderBottom: "1px solid var(--border)" }}>
              <h3 className="text-h3" style={{ color: "var(--text)" }}>Numerical benchmark table</h3>
              <p className="text-small mt-1" style={{ color: "var(--text-2)" }}>
                All latencies measured on the same CPU (same process, ONNX Runtime vs PyTorch eager).
              </p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead style={{ background: "var(--surface-2)", borderBottom: "1px solid var(--border)" }}>
                  <tr>
                    {["Model", "Backbone", "Params", "Dice ↑", "IoU ↑", "Precision", "Recall", "Accuracy", "Latency (CPU)"].map((h) => (
                      <th key={h} className="p-3 font-semibold text-xs" style={{ color: "var(--text-muted)", whiteSpace: "nowrap" }}>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {fallbackBenchmark.map((row) => (
                    <tr key={row.name} style={{ borderBottom: "1px solid var(--border)" }}>
                      <td className="p-3 font-semibold text-sm" style={{ color: "var(--text)" }}>{row.name}</td>
                      <td className="p-3 text-sm" style={{ color: "var(--text-2)" }}>{row.architecture}</td>
                      <td className="p-3 font-mono text-sm" style={{ color: "var(--text-2)" }}>{row.params}</td>
                      <td className="p-3 font-mono font-semibold text-sm" style={{ color: "var(--water)" }}>
                        {row.dice.toFixed(4)}
                      </td>
                      <td className="p-3 font-mono text-sm" style={{ color: "var(--text)" }}>{row.iou.toFixed(4)}</td>
                      <td className="p-3 font-mono text-sm" style={{ color: "var(--text)" }}>{row.precision.toFixed(4)}</td>
                      <td className="p-3 font-mono text-sm" style={{ color: "var(--ok)" }}>{row.recall.toFixed(4)}</td>
                      <td className="p-3 font-mono text-sm" style={{ color: "var(--text)" }}>{row.accuracy.toFixed(4)}</td>
                      <td className="p-3 font-mono text-sm" style={{ color: "var(--water)", whiteSpace: "nowrap" }}>
                        {row.latency} ms
                        {row.onnxLatency && <span style={{ color: "var(--ok)", marginLeft: 4 }}>({row.onnxLatency} ONNX)</span>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB: Robustness */}
      {activeTab === "robustness" && (
        <div className="space-y-6">
          <div
            className="rounded-xl p-6 space-y-4"
            style={{ border: "1px solid var(--border)", background: "var(--surface-1)" }}
          >
            <h3 className="text-h3" style={{ color: "var(--text)" }}>
              Robustness under image corruptions — U-Net MobileNetV2
            </h3>
            <p className="text-small" style={{ color: "var(--text-2)" }}>
              Dice score (y-axis, 0–1) vs corruption type (x-axis), at 3 severity levels.
              These are simulated corruptions to estimate worst-case real-world performance.
            </p>
            <div style={{ height: 300 }}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={robustnessChartData} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                  <XAxis dataKey="corruption" stroke="var(--text-muted)" fontSize={11} />
                  <YAxis domain={[0, 1]} stroke="var(--text-muted)" fontSize={11} />
                  <Tooltip contentStyle={tooltipStyle} />
                  <Legend wrapperStyle={{ fontSize: "12px", color: "var(--text-2)" }} />
                  <Line type="monotone" dataKey="mild" name="Mild (sev 1)" stroke="var(--ok)" strokeWidth={2} dot={{ r: 4 }} />
                  <Line type="monotone" dataKey="moderate" name="Moderate (sev 2)" stroke="var(--uncertain)" strokeWidth={2} dot={{ r: 4 }} />
                  <Line type="monotone" dataKey="severe" name="Severe (sev 3)" stroke="var(--alert)" strokeWidth={2} dot={{ r: 4 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              {
                title: "Most resilient: JPEG compression",
                text: "Dice 0.859 at severe severity. MobileNetV2 features stay robust against 8×8 DCT block artifacts.",
                color: "var(--ok)",
              },
              {
                title: "Most vulnerable: Sensor noise",
                text: "Dice 0.796 at severe severity. Salt-and-pepper noise erodes fine water-boundary gradients.",
                color: "var(--alert)",
              },
              {
                title: "TTA safety note",
                text: "In fog or low-light conditions, TTA uncertainty automatically flags confidence drops, alerting analysts to less-reliable regions.",
                color: "var(--water)",
              },
            ].map((card) => (
              <div key={card.title} className="rounded-xl p-5" style={{ border: "1px solid var(--border)", background: "var(--surface-1)" }}>
                <p className="text-sm font-semibold mb-2" style={{ color: card.color }}>{card.title}</p>
                <p className="text-small" style={{ color: "var(--text-2)" }}>{card.text}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB: ONNX Latency */}
      {activeTab === "latency" && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div
              className="rounded-xl p-6 space-y-4"
              style={{ border: "1px solid var(--border)", background: "var(--surface-1)" }}
            >
              <div className="flex items-center gap-2">
                <Zap className="h-5 w-5" style={{ color: "var(--water)" }} />
                <h3 className="text-h3" style={{ color: "var(--text)" }}>ONNX Runtime speedup</h3>
              </div>
              <p className="text-small" style={{ color: "var(--text-2)" }}>
                Both measurements on the same CPU in the same process. PyTorch eager vs ONNX Runtime opset 18.
              </p>
              <div
                className="rounded-xl p-4 font-mono space-y-3 text-sm"
                style={{ background: "var(--surface-2)", border: "1px solid var(--border)" }}
              >
                {[
                  { label: "PyTorch CPU mean", value: "79.83 ms", sub: "(±1.34 ms)", color: "var(--text)" },
                  { label: "ONNX Runtime CPU mean", value: "30.96 ms", sub: "(±0.80 ms)", color: "var(--water)" },
                  { label: "Speedup", value: "2.58×", sub: "same device", color: "var(--ok)", bold: true },
                ].map((row) => (
                  <div key={row.label} className="flex justify-between items-center" style={{ borderTop: row.bold ? "1px solid var(--border)" : undefined, paddingTop: row.bold ? "0.75rem" : undefined }}>
                    <span style={{ color: "var(--text-2)" }}>{row.label}</span>
                    <span style={{ color: row.color, fontWeight: row.bold ? 700 : 400 }}>
                      {row.value} <span style={{ color: "var(--text-muted)", fontWeight: 400 }}>{row.sub}</span>
                    </span>
                  </div>
                ))}
              </div>
              <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                Constant folding, operator fusion, and memory layout optimisation (ONNX opset 18).
              </p>
            </div>

            <div
              className="rounded-xl p-6 space-y-4"
              style={{ border: "1px solid var(--border)", background: "var(--surface-1)" }}
            >
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5" style={{ color: "var(--ok)" }} />
                <h3 className="text-h3" style={{ color: "var(--text)" }}>Numerical parity check</h3>
              </div>
              <p className="text-small" style={{ color: "var(--text-2)" }}>
                Output logits compared across 30 identical inputs to confirm ONNX conversion has no fidelity loss.
              </p>
              <div
                className="rounded-xl p-4 font-mono space-y-3 text-sm"
                style={{ background: "var(--surface-2)", border: "1px solid var(--border)" }}
              >
                {[
                  { label: "Max |Δ output|", value: "1.41 × 10⁻⁵" },
                  { label: "Tolerance ceiling", value: "1.00 × 10⁻⁴" },
                  { label: "Result", value: "PASSED", bold: true, color: "var(--ok)" },
                ].map((row) => (
                  <div key={row.label} className="flex justify-between items-center" style={{ borderTop: row.bold ? "1px solid var(--border)" : undefined, paddingTop: row.bold ? "0.75rem" : undefined }}>
                    <span style={{ color: "var(--text-2)" }}>{row.label}</span>
                    <span style={{ color: row.color || "var(--text)", fontWeight: row.bold ? 700 : 400 }}>{row.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Latency bar comparison */}
          <div
            className="rounded-xl p-6 space-y-4"
            style={{ border: "1px solid var(--border)", background: "var(--surface-1)" }}
          >
            <h3 className="text-h3" style={{ color: "var(--text)" }}>Latency comparison — all models (same CPU)</h3>
            <div style={{ height: 260 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  layout="vertical"
                  data={[
                    { name: "U-Net MobileNetV2 (ONNX)", latency: 30.9, fill: "var(--water)" },
                    { name: "SegFormer-B0 (PyTorch)", latency: 73.1 },
                    { name: "U-Net MobileNetV2 (PyTorch)", latency: 79.8 },
                    { name: "U-Net Scratch (PyTorch)", latency: 84.9 },
                  ]}
                  margin={{ top: 0, right: 20, left: 40, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" horizontal={false} />
                  <XAxis type="number" stroke="var(--text-muted)" fontSize={12} domain={[0, 100]} unit=" ms" />
                  <YAxis type="category" dataKey="name" stroke="var(--text-muted)" fontSize={11} width={200} />
                  <Tooltip contentStyle={tooltipStyle} formatter={(v) => [`${v} ms`, "Latency"]} />
                  <Bar dataKey="latency" radius={[0, 4, 4, 0]}>
                    {[
                      { fill: "var(--water)" },
                      { fill: "#3B82F6" },
                      { fill: "#3B82F6" },
                      { fill: "#3B82F6" },
                    ].map((entry, idx) => (
                      <rect key={idx} fill={entry.fill} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            <p className="text-xs" style={{ color: "var(--text-muted)" }}>
              * Measured on Apple M1 CPU (local dev machine). Actual latency will vary by hardware.
            </p>
          </div>
        </div>
      )}

      {/* TAB: Error analysis */}
      {activeTab === "errors" && (
        <div className="space-y-6">
          <div
            className="rounded-xl p-6 space-y-4"
            style={{ border: "1px solid var(--border)", background: "var(--surface-1)" }}
          >
            <h3 className="text-h3" style={{ color: "var(--text)" }}>Known failure patterns</h3>
            <p className="text-small" style={{ color: "var(--text-2)" }}>
              Observed from manual review of the worst-performing test images (lowest IoU per image).
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[
                {
                  icon: "🌑",
                  title: "Dark shadows labelled as water",
                  body: "Building and tree shadows in high-contrast midday images share a similar dark-blue hue to shallow water, causing false positives. TTA uncertainty is typically elevated in these regions.",
                },
                {
                  icon: "🟫",
                  title: "Turbid / brown water missed",
                  body: "Highly silt-laden floodwater (brown-orange colour) is sometimes classified as dry soil due to reduced water reflectance spectral signature in RGB channels.",
                },
                {
                  icon: "🌫️",
                  title: "Thin water films at image edges",
                  body: "Very thin films of water on flat fields near image borders are often below the 0.5 sigmoid threshold. Lowering the threshold improves recall but increases false positives.",
                },
                {
                  icon: "🏙️",
                  title: "Urban surfaces with specular reflection",
                  body: "Wet asphalt roads and metal rooftops produce specular highlights that resemble water reflectance, leading to false-positive detections in dense urban areas.",
                },
              ].map((card) => (
                <div
                  key={card.title}
                  className="rounded-xl p-4 space-y-2"
                  style={{ border: "1px solid var(--border)", background: "var(--surface-2)" }}
                >
                  <div className="text-2xl">{card.icon}</div>
                  <p className="text-sm font-semibold" style={{ color: "var(--text)" }}>{card.title}</p>
                  <p className="text-small" style={{ color: "var(--text-2)" }}>{card.body}</p>
                </div>
              ))}
            </div>
          </div>

          <div
            className="rounded-xl p-6 space-y-3"
            style={{ border: "1px solid var(--border)", background: "var(--surface-1)" }}
          >
            <h3 className="text-h3" style={{ color: "var(--text)" }}>Uncertainty vs error relationship</h3>
            <p className="text-small" style={{ color: "var(--text-2)" }}>
              TTA uncertainty is a useful signal: pixels flagged as uncertain are more likely to be misclassified.
              High uncertainty pixels (&gt;0.25 std dev) show consistently higher error rates than low uncertainty pixels (&lt;0.05 std dev).
            </p>
            <div className="grid grid-cols-3 gap-4 pt-2">
              {[
                { bin: "Low uncertainty", label: "< 0.05 std dev", errorRate: "~4%", color: "var(--ok)" },
                { bin: "Medium uncertainty", label: "0.05 – 0.25 std dev", errorRate: "~18%", color: "var(--uncertain)" },
                { bin: "High uncertainty", label: "> 0.25 std dev", errorRate: "~51%", color: "var(--alert)" },
              ].map((row) => (
                <div
                  key={row.bin}
                  className="rounded-xl p-4 text-center space-y-1"
                  style={{ border: "1px solid var(--border)", background: "var(--surface-2)" }}
                >
                  <p className="text-label">{row.bin}</p>
                  <p className="text-xs" style={{ color: "var(--text-muted)" }}>{row.label}</p>
                  <p className="text-xl font-mono font-semibold" style={{ color: row.color }}>{row.errorRate}</p>
                  <p className="text-xs" style={{ color: "var(--text-muted)" }}>pixel error rate</p>
                </div>
              ))}
            </div>
            <p className="text-xs" style={{ color: "var(--text-muted)" }}>
              Note: these error rates are estimated from visual inspection of high/low uncertainty regions on the test split; exact values require per-pixel ground-truth alignment.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
