"use client";

import { useEffect, useState } from "react";
import { COLORS, wordmarkSvg, iconSvg } from "@/lib/brand";

function BackArrow() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M15 5l-7 7 7 7"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function triggerDownload(filename: string, blob: Blob) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

function downloadSvg(name: string, svg: string) {
  triggerDownload(`${name}.svg`, new Blob([svg], { type: "image/svg+xml" }));
}

function downloadPng(name: string, svg: string, width: number) {
  const img = new Image();
  img.onload = () => {
    const ratio = img.width && img.height ? img.width / img.height : 1;
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = Math.round(width / ratio);
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    canvas.toBlob((b) => b && triggerDownload(`${name}.png`, b), "image/png");
  };
  img.src =
    "data:image/svg+xml;charset=utf-8," + encodeURIComponent(svg);
}

interface Logo {
  key: string;
  name: string;
  bg: string;
  svg: string;
  png: number;
  dark?: boolean;
}

const LOGOS: Logo[] = [
  { key: "redo-wordmark", name: "Wordmark", bg: "#ffffff", svg: wordmarkSvg("#0C0C0C"), png: 1200 },
  { key: "redo-wordmark-white", name: "Wordmark (reversed)", bg: "#0C0C0C", svg: wordmarkSvg("#F0EFED"), png: 1200, dark: true },
  { key: "redo-icon", name: "App icon", bg: "#F1F0EC", svg: iconSvg("#0C0C0C", "#FFFFFF"), png: 512 },
];

export default function BrandPanel({ onClose }: { onClose: () => void }) {
  const [copied, setCopied] = useState<string | null>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  async function copyHex(hex: string) {
    try {
      await navigator.clipboard.writeText(hex);
      setCopied(hex);
      setTimeout(() => setCopied((c) => (c === hex ? null : c)), 1200);
    } catch {
      /* ignore */
    }
  }

  return (
    <div className="funnel-page" role="dialog" aria-modal="true" aria-label="Brand assets">
      <div className="funnel-topbar">
        <button className="back-btn" onClick={onClose}>
          <BackArrow /> Back to board
        </button>
      </div>

      <div className="brand-content">
        <div className="brand-inner">
          <span className="drawer-eyebrow">Brand assets</span>
          <h1 className="brand-title">Brand</h1>
          <p className="funnel-lede" style={{ marginTop: 14 }}>
            The Redo logo and core colors. Grab any logo as SVG or PNG, and click
            a swatch to copy its hex.
          </p>

          <section className="brand-section">
            <span className="fstage-label">Logos</span>
            <div className="logo-grid">
              {LOGOS.map((l) => (
                <div className="logo-card" key={l.key}>
                  <div
                    className={`logo-preview${l.dark ? " dark" : ""}`}
                    style={{ background: l.bg }}
                    dangerouslySetInnerHTML={{ __html: l.svg }}
                  />
                  <div className="logo-meta">
                    <span className="logo-name">{l.name}</span>
                    <div className="logo-dl">
                      <button className="dl-btn" onClick={() => downloadSvg(l.key, l.svg)}>
                        SVG
                      </button>
                      <button
                        className="dl-btn"
                        onClick={() => downloadPng(l.key, l.svg, l.png)}
                      >
                        PNG
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className="brand-section">
            <span className="fstage-label">Colors</span>
            <div className="color-grid">
              {COLORS.map((c) => (
                <button
                  className="swatch"
                  key={c.hex}
                  onClick={() => copyHex(c.hex)}
                  title="Click to copy"
                >
                  <span className="swatch-color" style={{ background: c.hex }} />
                  <span className="swatch-meta">
                    <span className="swatch-name">{c.name}</span>
                    <span className="swatch-hex">
                      {copied === c.hex ? "Copied" : c.hex}
                    </span>
                    {c.note && <span className="swatch-note">{c.note}</span>}
                  </span>
                </button>
              ))}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
