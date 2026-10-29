import type { Metadata } from "next";
import "./globals.css";
import { Navbar } from "@/components/Navbar";

export const metadata: Metadata = {
  title: "AquaMap v2 — Explainable Aerial Flood Intelligence",
  description:
    "Production-grade aerial floodwater segmentation with U-Net & SegFormer, test-time uncertainty quantification, Grad-CAM explainability, and ONNX runtime acceleration.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="bg-background text-slate-100 min-h-screen flex flex-col antialiased selection:bg-accent-cyan/30 selection:text-white">
        <div className="fixed inset-0 bg-grid-pattern opacity-40 pointer-events-none z-0" />
        <div className="fixed inset-0 bg-radial-glow pointer-events-none z-0" />
        <Navbar />
        <main className="relative z-10 flex-1">{children}</main>
        <footer className="relative z-10 border-t border-white/5 bg-[#030712] py-8 text-center text-xs text-slate-500">
          <div className="mx-auto max-w-7xl px-4 flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-slate-300">AquaMap v2</span>
              <span>•</span>
              <span>Scientific Flood Segmentation & Disaster AI</span>
            </div>
            <div className="flex items-center gap-6 font-mono text-[11px] text-slate-400">
              <span>UNet MobileNetV2 (Dice: 0.884)</span>
              <span>•</span>
              <span>TTA Uncertainty</span>
              <span>•</span>
              <span>Grad-CAM</span>
              <span>•</span>
              <span>ONNX 31ms</span>
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}

