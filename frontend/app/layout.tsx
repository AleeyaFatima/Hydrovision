import type { Metadata } from "next";
import "./globals.css";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { ThemeProvider } from "@/components/ThemeProvider";

export const metadata: Metadata = {
  title: "HydroVision — Explainable Flood Segmentation",
  description:
    "Explainable AI floodwater segmentation for aerial and drone imagery. Transfer-learning U-Net with uncertainty quantification and Grad-CAM explainability.",
  openGraph: {
    title: "HydroVision — Explainable Flood Segmentation",
    description:
      "Explainable AI floodwater segmentation for aerial and drone imagery.",
    type: "website",
    siteName: "HydroVision",
  },
  twitter: {
    card: "summary_large_image",
    title: "HydroVision — Explainable Flood Segmentation",
    description: "Explainable AI floodwater segmentation for aerial and drone imagery.",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" data-theme="dark" suppressHydrationWarning>
      <head>
        <link rel="icon" href="/icon.svg" type="image/svg+xml" />
      </head>
      <body
        style={{ background: "var(--bg)", color: "var(--text)" }}
        className="min-h-screen flex flex-col antialiased"
      >
        <ThemeProvider>
          <div className="fixed inset-0 bg-grid-pattern opacity-100 pointer-events-none z-0" />
          <div className="fixed inset-0 bg-radial-glow pointer-events-none z-0" />
          <Navbar />
          <main className="relative z-10 flex-1">{children}</main>
          <Footer />
        </ThemeProvider>
      </body>
    </html>
  );
}
