"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Droplets,
  Activity,
  Layers,
  BarChart3,
  ArrowRight,
  Sun,
  Moon,
  Menu,
  X,
} from "lucide-react";
import { useTheme } from "./ThemeProvider";

export function Navbar() {
  const pathname = usePathname();
  const { theme, toggleTheme } = useTheme();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navLinks = [
    { href: "/", label: "Overview", icon: Droplets },
    { href: "/analyze", label: "Live Analysis", icon: Layers },
    { href: "/compare", label: "Flood Change", icon: Activity },
    { href: "/performance", label: "Benchmark & Viva", icon: BarChart3 },
  ];

  return (
    <header className="sticky top-0 z-50 w-full border-b border-white/5 dark:border-white/5 light:border-slate-200 bg-[#050B18]/85 dark:bg-[#050B18]/85 light:bg-white/85 backdrop-blur-md transition-colors">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Brand */}
        <Link href="/" className="flex items-center gap-2.5 sm:gap-3 group">
          <div className="relative flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-xl bg-surface dark:bg-surface light:bg-slate-100 border border-accent-cyan/30 shadow-cyan-glow group-hover:border-accent-cyan transition-all">
            <Droplets className="h-4 w-4 sm:h-5 sm:w-5 text-accent-cyan" />
            <div className="absolute -top-1 -right-1 h-2 w-2 sm:h-2.5 sm:w-2.5 rounded-full bg-accent-emerald animate-ping opacity-75" />
            <div className="absolute -top-1 -right-1 h-2 w-2 sm:h-2.5 sm:w-2.5 rounded-full bg-accent-emerald" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-bold tracking-tight text-white dark:text-white light:text-slate-900 text-base sm:text-lg">
                AQUAMAP
              </span>
              <span className="rounded bg-accent-cyan/15 px-1.5 py-0.5 font-mono text-[9px] sm:text-[10px] font-semibold text-accent-cyan border border-accent-cyan/30">
                v2.0
              </span>
            </div>
            <p className="hidden xs:block text-[10px] sm:text-[11px] text-slate-400 dark:text-slate-400 light:text-slate-500">
              Explainable Aerial Flood Intelligence
            </p>
          </div>
        </Link>

        {/* Desktop Center Nav Links */}
        <nav className="hidden md:flex items-center gap-1 rounded-full border border-white/5 dark:border-white/5 light:border-slate-200 bg-surface/50 dark:bg-surface/50 light:bg-slate-100/70 p-1 backdrop-blur-md">
          {navLinks.map((link) => {
            const Icon = link.icon;
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`flex items-center gap-2 rounded-full px-3.5 py-1.5 text-xs font-medium transition-all ${
                  isActive
                    ? "bg-accent-cyan/15 text-accent-cyan border border-accent-cyan/30 shadow-sm font-semibold"
                    : "text-slate-400 dark:text-slate-400 light:text-slate-600 hover:text-white dark:hover:text-white light:hover:text-slate-900 hover:bg-white/5 dark:hover:bg-white/5 light:hover:bg-slate-200"
                }`}
              >
                <Icon className="h-3.5 w-3.5" />
                <span>{link.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Right Actions: Theme Toggle, Status & Launch CTA */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Light / Dark Mode Toggle Button */}
          <button
            onClick={toggleTheme}
            aria-label="Toggle Light/Dark Theme"
            className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 dark:border-white/10 light:border-slate-200 bg-surface/60 dark:bg-surface/60 light:bg-slate-100 text-slate-300 dark:text-slate-300 light:text-slate-700 hover:text-accent-cyan hover:border-accent-cyan/40 transition-all shadow-sm"
          >
            {theme === "dark" ? (
              <Sun className="h-4 w-4 text-accent-amber animate-pulse" />
            ) : (
              <Moon className="h-4 w-4 text-accent-blue" />
            )}
          </button>

          {/* Model status pill (Desktop) */}
          <div className="hidden lg:flex items-center gap-2 rounded-full border border-accent-emerald/30 bg-accent-emerald/10 px-3 py-1 font-mono text-[11px] text-accent-emerald">
            <div className="h-1.5 w-1.5 rounded-full bg-accent-emerald animate-pulse" />
            <span>ONNX 31ms • Dice 0.884</span>
          </div>

          {/* Launch CTA */}
          <Link
            href="/analyze"
            className="hidden sm:flex items-center gap-1.5 sm:gap-2 rounded-xl bg-gradient-to-r from-accent-cyan to-accent-blue px-3 sm:px-4 py-2 text-xs font-semibold text-black transition-all hover:opacity-95 hover:shadow-cyan-glow"
          >
            <span>Launch Analyzer</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>

          {/* Mobile Hamburger Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle Mobile Menu"
            className="flex md:hidden h-9 w-9 items-center justify-center rounded-xl border border-white/10 dark:border-white/10 light:border-slate-200 bg-surface/60 dark:bg-surface/60 light:bg-slate-100 text-slate-300 dark:text-slate-300 light:text-slate-700"
          >
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer Navigation Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-b border-white/10 dark:border-white/10 light:border-slate-200 bg-[#050B18]/95 dark:bg-[#050B18]/95 light:bg-white/95 px-4 pt-3 pb-5 backdrop-blur-xl transition-all space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-white/5 dark:border-white/5 light:border-slate-200">
            <span className="font-mono text-[11px] text-slate-400 dark:text-slate-400 light:text-slate-500">
              NAVIGATION
            </span>
            <div className="flex items-center gap-1.5 font-mono text-[10px] text-accent-emerald">
              <span className="h-1.5 w-1.5 rounded-full bg-accent-emerald animate-pulse" />
              <span>ONNX 31ms • Dice 0.884</span>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-1">
            {navLinks.map((link) => {
              const Icon = link.icon;
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-xs font-medium transition-all ${
                    isActive
                      ? "bg-accent-cyan/15 text-accent-cyan border border-accent-cyan/30 font-semibold"
                      : "text-slate-300 dark:text-slate-300 light:text-slate-700 hover:bg-white/5 dark:hover:bg-white/5 light:hover:bg-slate-100"
                  }`}
                >
                  <Icon className="h-4 w-4 text-accent-cyan" />
                  <span>{link.label}</span>
                </Link>
              );
            })}
          </div>

          <div className="pt-2">
            <Link
              href="/analyze"
              onClick={() => setMobileMenuOpen(false)}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-accent-cyan to-accent-blue py-3 text-xs font-bold text-black shadow-cyan-glow"
            >
              <span>Launch Live Analyzer</span>
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
