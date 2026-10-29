"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Droplets, Activity, Layers, BarChart3, ArrowRight, ShieldCheck } from "lucide-react";

export function Navbar() {
  const pathname = usePathname();

  const navLinks = [
    { href: "/", label: "Overview", icon: Droplets },
    { href: "/analyze", label: "Live Analysis", icon: Layers },
    { href: "/compare", label: "Flood Change", icon: Activity },
    { href: "/performance", label: "Benchmark & Viva", icon: BarChart3 },
  ];

  return (
    <header className="sticky top-0 z-50 w-full border-b border-white/5 bg-[#050B18]/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Brand */}
        <Link href="/" className="flex items-center gap-3 group">
          <div className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-surface border border-accent-cyan/30 shadow-cyan-glow group-hover:border-accent-cyan transition-all">
            <Droplets className="h-5 w-5 text-accent-cyan" />
            <div className="absolute -top-1 -right-1 h-2.5 w-2.5 rounded-full bg-accent-emerald animate-ping opacity-75" />
            <div className="absolute -top-1 -right-1 h-2.5 w-2.5 rounded-full bg-accent-emerald" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-bold tracking-tight text-white text-lg">AQUAMAP</span>
              <span className="rounded bg-accent-cyan/15 px-1.5 py-0.5 font-mono text-[10px] font-semibold text-accent-cyan border border-accent-cyan/30">
                v2.0
              </span>
            </div>
            <p className="text-[11px] text-slate-400">Explainable Aerial Flood Intelligence</p>
          </div>
        </Link>

        {/* Center Nav Links */}
        <nav className="hidden md:flex items-center gap-1 rounded-full border border-white/5 bg-surface/50 p-1 backdrop-blur-md">
          {navLinks.map((link) => {
            const Icon = link.icon;
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`flex items-center gap-2 rounded-full px-4 py-1.5 text-xs font-medium transition-all ${
                  isActive
                    ? "bg-accent-cyan/15 text-accent-cyan border border-accent-cyan/30 shadow-sm"
                    : "text-slate-400 hover:text-white hover:bg-white/5"
                }`}
              >
                <Icon className="h-3.5 w-3.5" />
                <span>{link.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Right CTA & Model Status */}
        <div className="flex items-center gap-3">
          <div className="hidden lg:flex items-center gap-2 rounded-full border border-accent-emerald/30 bg-accent-emerald/10 px-3 py-1 font-mono text-[11px] text-accent-emerald">
            <div className="h-1.5 w-1.5 rounded-full bg-accent-emerald animate-pulse" />
            <span>ONNX 31ms • Dice 0.884</span>
          </div>

          <Link
            href="/analyze"
            className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-accent-cyan to-accent-blue px-4 py-2 text-xs font-semibold text-black transition-all hover:opacity-95 hover:shadow-cyan-glow"
          >
            <span>Analyze Drone Image</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </div>
    </header>
  );
}

