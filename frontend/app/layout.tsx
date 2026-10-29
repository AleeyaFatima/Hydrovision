import type { Metadata } from "next";
import "./globals.css";
import { Navbar } from "@/components/Navbar";
import { ThemeProvider } from "@/components/ThemeProvider";

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
      <body className="bg-[#050B18] text-slate-100 min-h-screen flex flex-col antialiased selection:bg-accent-cyan/30 selection:text-white dark:bg-[#050B18] dark:text-slate-100 light:bg-[#F8FAFC] light:text-slate-900 transition-colors duration-200">
        <ThemeProvider>
          <div className="fixed inset-0 bg-grid-pattern opacity-40 pointer-events-none z-0" />
          <div className="fixed inset-0 bg-radial-glow pointer-events-none z-0" />
          <Navbar />
          <main className="relative z-10 flex-1">{children}</main>
          <footer className="relative z-10 border-t border-white/5 dark:border-white/5 light:border-black/5 bg-[#030712] dark:bg-[#030712] light:bg-slate-100 py-8 text-center text-xs text-slate-500 dark:text-slate-500 light:text-slate-600 transition-colors">
            <div className="mx-auto max-w-7xl px-4 flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-slate-300 dark:text-slate-300 light:text-slate-800">AquaMap v2</span>
                <span>•</span>
                <span>Scientific Flood Segmentation & Disaster AI</span>
              </div>
              <div className="flex items-center gap-6 font-mono text-[11px] text-slate-400 dark:text-slate-400 light:text-slate-600">
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
        </ThemeProvider>
      </body>
    </html>
  );
}
