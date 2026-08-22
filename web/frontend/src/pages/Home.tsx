import React from "react";
import { useLocation } from "wouter";
import { landingOutcomes } from "@/lib/landingContent";
import { HeroMontage, PrimaryButton, PublicPage, UrlCapture, VisualCarousel } from "@/components/PublicSite";

export default function Home() {
  const [, navigate] = useLocation();
  return <PublicPage className="home-page">
    <section className="rich-hero">
      <div className="hero-copy-rich">
        <div className="landing-eyebrow">AI-POWERED STOREFRONT INTELLIGENCE</div>
        <h1>Build a Better Store.<br /><span>Automatically.</span></h1>
        <p>FerixRG analyzes your storefront, uncovers hidden issues, and turns evidence into an improved experience—optimized, redesigned, and ready to publish.</p>
        <div className="hero-actions"><PrimaryButton onClick={() => navigate("/app")}>Analyze Your Store</PrimaryButton><button type="button" className="landing-secondary" onClick={() => navigate("/how-it-works")}>Explore How It Works</button></div>
        <UrlCapture onAnalyze={url => navigate(url ? `/app/stores?url=${encodeURIComponent(url)}` : "/app/stores")} />
      </div>
      <HeroMontage />
    </section>
    <section className="outcome-strip">{landingOutcomes.map(outcome => <div className="outcome" key={outcome.label}><i>{outcome.icon}</i><p><b>{outcome.value}<small>{outcome.suffix}</small></b><span>{outcome.label}</span></p></div>)}</section>
    <section className="landing-section home-proof-section"><div><div className="landing-eyebrow">A CLEAR STARTING POINT</div><h2>Understand what matters before you change your store.</h2><p>Start with the access you already have. FerixRG keeps the evidence visible, separates findings from recommendations, and gives your team a reviewable path forward.</p><PrimaryButton onClick={() => navigate("/features")}>Explore Capabilities</PrimaryButton></div><div><VisualCarousel label="Storefront intelligence preview" /><small className="home-proof-caption">A visual preview of the storefront evidence FerixRG can organize.</small></div></section>
    <section className="landing-cta"><h2>Your store can be better.<br />Let’s find out how.</h2><div><PrimaryButton onClick={() => navigate("/app")}>Analyze My Store</PrimaryButton><button type="button" className="landing-secondary light" onClick={() => navigate("/auth/register")}>Create Free Account</button></div></section>
  </PublicPage>;
}

