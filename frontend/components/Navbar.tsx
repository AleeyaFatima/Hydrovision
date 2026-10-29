"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Activity,
  Layers,
  BarChart3,
  ArrowRight,
  Sun,
  Moon,
  Menu,
  X,
  Database,
  FileText,
} from "lucide-react";
import { useTheme } from "./ThemeProvider";

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
  const { theme, toggleTheme } = useTheme();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [modelOnline, setModelOnline] = useState<boolean | null>(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Check model health
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

  const glassBg = scrolled
    ? "border-b"
    : "border-b border-transparent";

  return (
    <header
      className={`sticky top-0 z-50 w-full transition-all duration-300 backdrop-blur-md ${glassBg}`}
      style={{
        background: scrolled
          ? theme === "dark"
            ? "rgba(11,22,38,0.85)"
            : "rgba(255,255,255,0.85)"
          : "transparent",
        borderColor: scrolled ? "var(--border)" : "transparent",
      }}
    >
      <div className="container-workspace flex h-16 items-center justify-between">
        {/* Brand */}
        <Link href="/" className="flex items-center gap-2 group" aria-label="HydroVision home">
          <div
            className="flex h-9 w-9 items-center justify-center rounded-xl border transition-all"
            style={{
              background: "var(--surface-1)",
              borderColor: "rgba(34,211,238,0.3)",
              color: "var(--water)",
            }}
          >
            <DropletEyeIcon className="h-5 w-5" />
          </div>
          <div className="flex items-baseline gap-1">
            <span
              className="font-semibold text-base tracking-tight"
              style={{ fontFamily: "'Space Grotesk', sans-serif", color: "var(--text)" }}
            >
              Hydro
            </span>
            <span
              className="font-semibold text-base tracking-tight"
              style={{ fontFamily: "'Space Grotesk', sans-serif", color: "var(--text-2)" }}
            >
              Vision
            </span>
          </div>
        </Link>

        {/* Desktop Nav Links */}
        <nav
          className="hidden md:flex items-center gap-1 rounded-full p-1"
          style={{
            border: "1px solid var(--border)",
            background: theme === "dark" ? "rgba(11,22,38,0.6)" : "rgba(241,245,249,0.8)",
          }}
        >
          {navLinks.map((link) => {
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className="rounded-full px-3.5 py-1.5 text-sm font-medium transition-all"
                style={{
                  color: isActive ? "var(--water)" : "var(--text-2)",
                  background: isActive ? "rgba(34,211,238,0.12)" : "transparent",
                  border: isActive ? "1px solid rgba(34,211,238,0.25)" : "1px solid transparent",
                }}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>

        {/* Right Actions */}
        <div className="flex items-center gap-2">
          {/* Model status dot */}
          <div
            className="hidden lg:flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium"
            style={{
              border: "1px solid var(--border)",
              background: "var(--surface-1)",
              color: modelOnline === null ? "var(--text-muted)" : modelOnline ? "var(--ok)" : "var(--text-muted)",
            }}
            title={modelOnline === null ? "Checking model..." : modelOnline ? "Model online" : "Model offline (using cached results)"}
          >
            <div
              className="h-2 w-2 rounded-full"
              style={{
                background: modelOnline === null ? "var(--text-muted)" : modelOnline ? "var(--ok)" : "var(--text-muted)",
              }}
            />
            <span>{modelOnline === null ? "Checking…" : modelOnline ? "Model online" : "Offline mode"}</span>
          </div>

          {/* Theme Toggle */}
          <button
            onClick={toggleTheme}
            aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
            className="flex h-9 w-9 items-center justify-center rounded-xl transition-all"
            style={{
              border: "1px solid var(--border)",
              background: "var(--surface-1)",
              color: "var(--text-2)",
            }}
          >
            {theme === "dark" ? (
              <Sun className="h-4 w-4" />
            ) : (
              <Moon className="h-4 w-4" />
            )}
          </button>

          {/* Analyze CTA */}
          <Link
            href="/analyze"
            className="hidden sm:flex items-center gap-1.5 rounded-xl px-4 py-2 text-sm font-semibold transition-all"
            style={{
              background: "var(--btn-primary-bg)",
              color: "var(--btn-primary-fg)",
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
            className="flex md:hidden h-9 w-9 items-center justify-center rounded-xl transition-all"
            style={{ border: "1px solid var(--border)", background: "var(--surface-1)", color: "var(--text-2)" }}
          >
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Sheet Menu */}
      {mobileMenuOpen && (
        <div
          className="md:hidden px-4 pt-3 pb-6 space-y-2"
          style={{
            background: theme === "dark" ? "rgba(5,11,24,0.97)" : "rgba(255,255,255,0.97)",
            borderBottom: `1px solid var(--border)`,
          }}
        >
          <div className="flex items-center justify-between pb-3" style={{ borderBottom: "1px solid var(--border)" }}>
            <span className="text-label">Navigation</span>
            <div
              className="flex items-center gap-1.5 text-xs font-medium"
              style={{ color: modelOnline ? "var(--ok)" : "var(--text-muted)" }}
            >
              <div
                className="h-2 w-2 rounded-full"
                style={{ background: modelOnline ? "var(--ok)" : "var(--text-muted)" }}
              />
              <span>{modelOnline ? "Model online" : "Offline mode"}</span>
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
                  className="flex items-center gap-3 rounded-xl px-3.5 py-3 text-sm font-medium transition-all"
                  style={{
                    color: isActive ? "var(--water)" : "var(--text-2)",
                    background: isActive ? "rgba(34,211,238,0.1)" : "transparent",
                    border: `1px solid ${isActive ? "rgba(34,211,238,0.2)" : "transparent"}`,
                  }}
                >
                  <Icon className="h-4 w-4" style={{ color: isActive ? "var(--water)" : "var(--text-muted)" }} />
                  <span>{link.label}</span>
                </Link>
              );
            })}
          </div>

          <div className="pt-3 space-y-2" style={{ borderTop: "1px solid var(--border)" }}>
            <Link
              href="/analyze"
              onClick={() => setMobileMenuOpen(false)}
              className="flex w-full items-center justify-center gap-2 rounded-xl py-3 text-sm font-bold"
              style={{ background: "var(--btn-primary-bg)", color: "var(--btn-primary-fg)" }}
            >
              <span>Analyze an image</span>
              <ArrowRight className="h-4 w-4" />
            </Link>
            <button
              onClick={toggleTheme}
              className="flex w-full items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-medium"
              style={{ border: "1px solid var(--border)", background: "var(--surface-1)", color: "var(--text-2)" }}
            >
              {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
              <span>Switch to {theme === "dark" ? "light" : "dark"} mode</span>
            </button>
          </div>
        </div>
      )}
    </header>
  );
}
