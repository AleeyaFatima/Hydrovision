"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Activity,
  Layers,
  BarChart3,
  ArrowRight,
  Menu,
  X,
  Database,
  FileText,
} from "lucide-react";

function DropletEyeIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round">
      <path d="M12 3 C12 3 4.5 10.5 4.5 15 C4.5 19.5 8 22.5 12 22.5 C16 22.5 19.5 19.5 19.5 15 C19.5 10.5 12 3 12 3Z"/>
      <ellipse cx="12" cy="15.5" rx="3.5" ry="2.5"/>
      <circle cx="12" cy="15.5" r="1" fill="currentColor" stroke="none"/>
    </svg>
  );
}

export function Navbar() {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [modelOnline, setModelOnline] = useState<boolean | null>(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 30);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Check model health from backend
  useEffect(() => {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
    fetch(`${apiUrl}/health`, { signal: AbortSignal.timeout(3000) })
      .then((r) => r.ok && setModelOnline(true))
      .catch(() => setModelOnline(false));
  }, []);

  const navLinks = [
    { href: "/", label: "Overview", icon: Layers },
    { href: "/analyze", label: "Analyze", icon: Activity },
    { href: "/compare", label: "Compare", icon: BarChart3 },
    { href: "/performance", label: "Benchmark", icon: BarChart3 },
    { href: "/dataset", label: "Dataset", icon: Database },
    { href: "/model-card", label: "Model Card", icon: FileText },
  ];

  return (
    <header
      className={`sticky top-0 z-50 w-full transition-all duration-300 backdrop-blur-xl ${
        scrolled
          ? "bg-[#050914]/90 border-b border-[#1E334B] shadow-2xl"
          : "bg-transparent border-b border-transparent"
      }`}
    >
      <div className="container-workspace flex h-16 items-center justify-between">
        {/* Brand */}
        <Link href="/" className="flex items-center gap-2.5 group" aria-label="HydroVision home">
          <div
            className="flex h-9 w-9 items-center justify-center rounded-xl border border-cyan-500/30 bg-[#0A1424] text-water shadow-sm group-hover:border-cyan-400 group-hover:shadow-[0_0_16px_rgba(34,211,238,0.35)] transition-all"
          >
            <DropletEyeIcon className="h-5 w-5" />
          </div>
          <div className="flex items-baseline gap-1">
            <span
              className="font-bold text-base tracking-tight text-white group-hover:text-cyan-400 transition-colors"
              style={{ fontFamily: "'Space Grotesk', sans-serif" }}
            >
              Hydro
            </span>
            <span
              className="font-bold text-base tracking-tight text-slate-400"
              style={{ fontFamily: "'Space Grotesk', sans-serif" }}
            >
              Vision
            </span>
          </div>
        </Link>

        {/* Desktop Nav Links */}
        <nav
          className="hidden md:flex items-center gap-1 rounded-full p-1 border border-[#1E334B] bg-[#0A1424]/80 backdrop-blur-md"
        >
          {navLinks.map((link) => {
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`rounded-full px-3.5 py-1.5 text-xs font-semibold transition-all ${
                  isActive
                    ? "bg-[#101D30] text-cyan-300 border border-cyan-400/50 shadow-[0_0_14px_rgba(168,85,247,0.3)]"
                    : "text-slate-300 hover:text-white hover:bg-white/5 border border-transparent"
                }`}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>

        {/* Right Actions */}
        <div className="flex items-center gap-3">
          {/* Live Model Status Pill */}
          <div
            className={`hidden lg:flex items-center gap-2 rounded-full px-3 py-1 text-xs font-mono border transition-all ${
              modelOnline === true
                ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-400"
                : "border-[#1E334B] bg-[#0A1424] text-slate-400"
            }`}
            title={
              modelOnline === true
                ? "Backend API online (FastAPI + ONNX)"
                : "Offline simulation mode (pre-computed neural predictions)"
            }
          >
            <div
              className={`h-2 w-2 rounded-full ${
                modelOnline === true
                  ? "bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)] animate-pulse"
                  : "bg-slate-500"
              }`}
            />
            <span>{modelOnline === true ? "Model online" : "Offline mode"}</span>
          </div>

          {/* Primary CTA (Cyan to Neon Violet) */}
          <Link
            href="/analyze"
            className="hidden sm:inline-flex items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-bold text-[#050914] shadow-[0_0_20px_rgba(139,92,246,0.35),0_0_50px_rgba(34,211,238,0.15)] hover:shadow-[0_0_28px_rgba(139,92,246,0.5),0_0_60px_rgba(34,211,238,0.25)] hover:scale-[1.02] transition-all"
            style={{
              background: "linear-gradient(135deg, #22D3EE 0%, #8B5CF6 100%)",
            }}
          >
            <span>Analyze an image</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>

          {/* Mobile Hamburger */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
            aria-expanded={mobileMenuOpen}
            className="flex md:hidden h-9 w-9 items-center justify-center rounded-xl border border-[#1E334B] bg-[#0A1424] text-slate-300 hover:text-white hover:border-cyan-500/40 transition-all"
          >
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer Navigation */}
      {mobileMenuOpen && (
        <div
          className="md:hidden px-4 pt-3 pb-6 space-y-3 bg-[#050914]/98 border-b border-[#1E334B] backdrop-blur-2xl"
        >
          <div className="flex items-center justify-between pb-3 border-b border-[#1E334B]">
            <span className="text-label text-slate-400">Navigation</span>
            <div
              className={`flex items-center gap-1.5 text-xs font-mono font-medium ${
                modelOnline === true ? "text-emerald-400" : "text-slate-400"
              }`}
            >
              <div
                className={`h-2 w-2 rounded-full ${
                  modelOnline === true ? "bg-emerald-400 animate-pulse" : "bg-slate-500"
                }`}
              />
              <span>{modelOnline === true ? "Model online" : "Offline mode"}</span>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-1 pt-1">
            {navLinks.map((link) => {
              const isActive = pathname === link.href;
              const Icon = link.icon;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center gap-3 rounded-xl px-3.5 py-3 text-sm font-semibold transition-all ${
                    isActive
                      ? "bg-[#101D30] text-cyan-300 border border-cyan-400/40 shadow-[0_0_12px_rgba(168,85,247,0.25)]"
                      : "text-slate-300 hover:bg-white/5 border border-transparent"
                  }`}
                >
                  <Icon className={`h-4 w-4 ${isActive ? "text-water" : "text-slate-400"}`} />
                  <span>{link.label}</span>
                </Link>
              );
            })}
          </div>

          <div className="pt-2 border-t border-[#1E334B]">
            <Link
              href="/analyze"
              onClick={() => setMobileMenuOpen(false)}
              className="flex w-full items-center justify-center gap-2 rounded-xl py-3 text-sm font-bold text-[#050914] shadow-lg"
              style={{
                background: "linear-gradient(135deg, #22D3EE 0%, #8B5CF6 100%)",
                boxShadow: "0 0 20px rgba(139, 92, 246, 0.4), 0 0 60px rgba(34, 211, 238, 0.15)",
              }}
            >
              <span>Analyze an image</span>
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
