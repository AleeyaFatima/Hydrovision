"use client";

import Link from "next/link";

export function Footer() {
  return (
    <footer
      className="relative z-10 border-t"
      style={{
        borderColor: "var(--border)",
        background: "var(--surface-1)",
        color: "var(--text-2)",
      }}
    >
      <div className="container-landing py-10">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
          {/* Brand */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <svg width="20" height="20" viewBox="0 0 32 32" fill="none" style={{ color: "var(--water)" }}>
                <path
                  d="M16 4 C16 4 6 14 6 20 C6 26 10.7 30 16 30 C21.3 30 26 26 26 20 C26 14 16 4 16 4Z"
                  stroke="currentColor" strokeWidth="2" fill="none" strokeLinejoin="round"
                />
                <ellipse cx="16" cy="21" rx="5" ry="3.5" stroke="currentColor" strokeWidth="1.5" fill="none"/>
                <circle cx="16" cy="21" r="1.5" fill="currentColor"/>
              </svg>
              <span
                className="font-bold text-base"
                style={{ fontFamily: "'Space Grotesk', sans-serif", color: "var(--text)" }}
              >
                HydroVision
              </span>
            </div>
            <p className="text-small" style={{ color: "var(--text-2)" }}>
              Explainable AI floodwater segmentation for aerial and drone imagery.
            </p>
            <p className="text-small" style={{ color: "var(--text-muted)" }}>
              Built by Aleeya — [Course] · [University] · [Semester]
            </p>
          </div>

          {/* Links */}
          <div className="space-y-3">
            <p className="text-label">Resources</p>
            <ul className="space-y-2">
              <li>
                <Link
                  href="https://github.com/AleeyaFatima/aquamap"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-small hover:underline"
                  style={{ color: "var(--link)" }}
                >
                  GitHub Repository
                </Link>
              </li>
              <li>
                <Link
                  href="/model-card"
                  className="text-small hover:underline"
                  style={{ color: "var(--link)" }}
                >
                  Model Card
                </Link>
              </li>
              <li>
                <Link
                  href="https://www.kaggle.com/datasets/faizalkarim/flood-area-segmentation"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-small hover:underline"
                  style={{ color: "var(--link)" }}
                >
                  Dataset: Flood Area Segmentation by Faizal Karim (Kaggle)
                </Link>
              </li>
              <li>
                <Link
                  href="/dataset"
                  className="text-small hover:underline"
                  style={{ color: "var(--link)" }}
                >
                  Dataset Explorer
                </Link>
              </li>
            </ul>
          </div>

          {/* Disclaimer */}
          <div className="space-y-3">
            <p className="text-label">Disclaimer</p>
            <p className="text-small" style={{ color: "var(--text-muted)", lineHeight: 1.6 }}>
              HydroVision is a research prototype for screening aerial images.
              It is not an official flood map or emergency service. Do not use
              for safety-critical decisions.
            </p>
            <p className="text-small" style={{ color: "var(--text-muted)", fontSize: "12px" }}>
              Dataset credit: <em>Flood Area Segmentation</em> by Faizal Karim, Kaggle.
            </p>
          </div>
        </div>

        <div
          className="mt-8 pt-6 flex flex-col sm:flex-row items-center justify-between gap-2"
          style={{ borderTop: "1px solid var(--border)" }}
        >
          <span className="text-small" style={{ color: "var(--text-muted)", fontSize: "13px" }}>
            © 2025 HydroVision · Research Prototype
          </span>
          <div className="flex items-center gap-4">
            <Link href="/performance" className="text-small hover:underline" style={{ color: "var(--text-muted)", fontSize: "13px" }}>
              Benchmark
            </Link>
            <Link href="/analyze" className="text-small hover:underline" style={{ color: "var(--text-muted)", fontSize: "13px" }}>
              Analyze
            </Link>
            <Link href="/compare" className="text-small hover:underline" style={{ color: "var(--text-muted)", fontSize: "13px" }}>
              Compare
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}

