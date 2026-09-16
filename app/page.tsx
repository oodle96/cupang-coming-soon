"use client";

import { useState, useEffect } from "react";
import dynamic from "next/dynamic";

// The WebGL scene is browser-only — skip SSR.
const FishTank = dynamic(() => import("@/components/FishTank"), {
  ssr: false,
});

export default function Home() {
  const [ready, setReady] = useState(false);
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setReady(true), 1100);
    return () => clearTimeout(t);
  }, []);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setSent(true);
  };

  return (
    <main className="stage">
      <div className="canvas-wrap">
        <FishTank />
      </div>

      <span className="watermark" aria-hidden="true">
        tradewithcupang
      </span>

      {!ready && (
        <div className="loader">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/cupang-logo.svg" alt="CUPANG" width={390} height={112} />
          <div className="loading-track" aria-hidden="true">
            <span />
          </div>
          <p>Loading</p>
        </div>
      )}

      <header className="nav glass">
        <a className="brand" href="#" aria-label="CUPANG">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img className="brand-logo" src="/cupang-logo.png" alt="CUPANG" />
        </a>
        <span className="nav-pill glass">Coming soon</span>
      </header>

      <div className="overlay">
        <p className="eyebrow">CUPANG &nbsp;/&nbsp; Coming soon</p>
        <h1 className="headline">
          Something is
          <br />
          <em>swimming</em> your way.
        </h1>
        <p className="sub">
          Ready to Trade with Us ?
        </p>

      </div>

      <footer className="footer-bar glass">
        <a className="brand" href="#">
          CUPANG®
        </a>
        <div className="socials">
          <a href="t.me/tradewithcupang">Telegram</a>
          <a href="https://www.tiktok.com/@tradewithcupang">TikTok</a>
          <a href="https://www.instagram.com/tradewithcupang/">Instagram</a>
          <a href="https://www.threads.com/@tradewithcupang">Threads</a>
        </div>
      </footer>
    </main>
  );
}
