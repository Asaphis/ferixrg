import { ArrowRight, ChevronDown, Link2, Menu, Sparkles } from "lucide-react";
import React, { type MouseEvent, useEffect, useState } from "react";
import { useLocation } from "wouter";
import { landingHealthMetrics, landingOutcomes, landingWorkflow, supportedPlatforms } from "@/lib/landingContent";
import { applyLandingParallaxToMontage } from "@/lib/landingMotion";
import "./landing.css";
import "./landingMotion.css";

const heroAsset = "/landing/ferixrg-visual-reference.png";
const evidenceAsset = "/landing/ferixrg-visual-analysis.png";
const redesignAsset = "/landing/ferixrg-visual-redesign.png";
const landingVisuals = [
  { src: "/landing/ferixrg-visual-reference.png", alt: "FerixRG storefront intelligence workspace" },
  { src: "/landing/ferixrg-visual-analysis.png", alt: "AI storefront analysis evidence" },
  { src: "/landing/ferixrg-visual-redesign.png", alt: "Before and after storefront redesign" },
  { src: "/landing/ferixrg-visual-mobile.png", alt: "Responsive mobile storefront experience" },
  { src: "/landing/ferixrg-visual-workflow.png", alt: "FerixRG insight to publish workflow" },
];

function Brand() {
  return <a className="landing-brand" href="/"><img className="landing-logo-art" src="/branding/ferixrg-logo-transparent.png" alt="FerixRG emblem" /><span>FERIX<b>RG</b></span></a>;
}

function PrimaryButton({ children, onClick, className = "" }: { children: React.ReactNode; onClick?: () => void; className?: string }) {
  return <button className={`landing-primary ${className}`} onClick={onClick}>{children} <ArrowRight size={14} /></button>;
}

function VisualCarousel({ className = "", label }: { className?: string; label: string }) {
  const [active, setActive] = useState(0);
  useEffect(() => {
    const timer = window.setInterval(() => setActive((current) => (current + 1) % landingVisuals.length), 5200);
    return () => window.clearInterval(timer);
  }, []);
  return <div className={`landing-visual-carousel ${className}`} aria-label={label}>
    <div className="landing-visual-stage">
      {landingVisuals.map((visual, index) => <img key={visual.src} src={visual.src} alt={visual.alt} className={index === active ? "is-active" : ""} loading={index === 0 ? "eager" : "lazy"} />)}
      <div className="landing-visual-shade" />
      <div className="landing-visual-caption"><span>FERIXRG VISUAL INTELLIGENCE</span><b>{String(active + 1).padStart(2, "0")} / {String(landingVisuals.length).padStart(2, "0")}</b></div>
    </div>
    <div className="landing-visual-controls" aria-label="Carousel controls">
      <button aria-label="Previous image" onClick={() => setActive((active - 1 + landingVisuals.length) % landingVisuals.length)}>←</button>
      <div>{landingVisuals.map((visual, index) => <button key={visual.src} aria-label={`Show image ${index + 1}`} className={index === active ? "is-active" : ""} onClick={() => setActive(index)} />)}</div>
      <button aria-label="Next image" onClick={() => setActive((active + 1) % landingVisuals.length)}>→</button>
    </div>
  </div>;
}

export default function Home() {
  const [, navigate] = useLocation();
  const [url, setUrl] = useState("");
  const [mobileMenu, setMobileMenu] = useState(false);
  const goToWorkspace = () => navigate("/app");
  const goToLogin = () => navigate("/auth/login");
  const goToRegister = () => navigate("/auth/register");
  const goToAuthenticatedTool = (toolId: string) => navigate(`/auth/register?returnTo=${encodeURIComponent(`/app/tools?tool=${toolId}`)}`);
  const setLayerParallax = (node: HTMLElement, x: number, y: number) => {
    node.style.setProperty("--parallax-x", `${x}px`);
    node.style.setProperty("--parallax-y", `${y}px`);
  };
  const handleMontageMove = (event: MouseEvent<HTMLDivElement>) => {
    const bounds = event.currentTarget.getBoundingClientRect();
    applyLandingParallaxToMontage(event.currentTarget, { viewportWidth: window.innerWidth, prefersReducedMotion: window.matchMedia("(prefers-reduced-motion: reduce)").matches }, (event.clientX - bounds.left) / bounds.width, (event.clientY - bounds.top) / bounds.height);
  };
  const resetMontageParallax = (event: MouseEvent<HTMLDivElement>) => {
    event.currentTarget.querySelectorAll<HTMLElement>("[data-motion-layer]").forEach((node) => setLayerParallax(node, 0, 0));
  };

  return <main className="landing-shell">
    <div className="landing-canvas">
      <nav className="landing-nav">
        <Brand />
        <div className="landing-links">
          {["Product", "Solutions", "How It Works", "Platforms", "Resources", "Pricing"].map((item, index) => <a href={index === 2 ? "#workflow" : index === 3 ? "#platforms" : "#capabilities"} key={item}>{item}{![2, 5].includes(index) && <ChevronDown size={11} />}</a>)}
        </div>
        <div className="landing-nav-actions"><button className="landing-signin" onClick={goToLogin}>Sign In</button><PrimaryButton onClick={goToRegister}>Get Started</PrimaryButton></div>
        <button className="landing-menu" aria-label="Open navigation" onClick={() => setMobileMenu((open) => !open)}><Menu size={21} /></button>
      </nav>
      {mobileMenu && <div className="landing-mobile-menu">{["Product", "Solutions", "How It Works", "Platforms", "Resources", "Pricing"].map((item) => <a href="#capabilities" key={item} onClick={() => setMobileMenu(false)}>{item}</a>)}<button onClick={goToRegister}>Get Started</button></div>}

      <section className="rich-hero">
        <div className="hero-copy-rich">
          <div className="landing-eyebrow">AI-POWERED STOREFRONT INTELLIGENCE</div>
          <h1>Build a Better Store.<br /><span>Automatically.</span></h1>
          <p>FerixRG analyzes your storefront, uncovers hidden issues, and turns evidence into an improved experience—optimized, redesigned, and ready to publish.</p>
          <div className="hero-actions"><PrimaryButton onClick={goToWorkspace}>Analyze Your Store</PrimaryButton><button className="landing-secondary" onClick={() => document.getElementById("workflow")?.scrollIntoView()}>Explore Platform</button></div>
          <form className="landing-url" onSubmit={(event) => { event.preventDefault(); goToWorkspace(); }}><label>Paste your store URL</label><div><Link2 size={14} /><input aria-label="Store URL" value={url} onChange={(event) => setUrl(event.target.value)} placeholder="https://yourstore.com" /><button>Analyze Store</button></div><small>Analyze any public storefront without connecting your store.</small></form>
        </div>
        <div className="hero-montage" aria-label="Animated storefront intelligence preview" onMouseMove={handleMontageMove} onMouseLeave={resetMontageParallax}>
          <div className="montage-workspace" data-motion-layer><img src={heroAsset} alt="FerixRG storefront analysis workspace" /><span>STORE HEALTH · 82 / 100</span></div>
          <div className="montage-browser" data-motion-layer><div className="browser-chrome"><i /><i /><i /><span>YOURSTORE · Shop · Collections</span></div><div className="browser-store"><b>Timeless living.<br />thoughtfully curated.</b><small>Shop the collection</small></div><div className="browser-products"><i /><i /><i /></div></div>
          <div className="montage-phone" data-motion-layer><img src={heroAsset} alt="Storefront phone preview" /></div><div className="montage-connector" data-motion-layer />
          <div className="montage-insight" data-motion-layer><div className="landing-eyebrow"><Sparkles size={10} /> AI INSIGHT</div><strong>91 <small>/100</small></strong><p>Your store is strong. We found 18 opportunities to improve.</p></div>
          <div className="montage-impact" data-motion-layer><span>REDESIGN IMPACT</span><b>72 <em>→</em> 94</b><small>Before &nbsp;&nbsp;&nbsp;&nbsp; After</small></div><div className="montage-badge" data-motion-layer><Sparkles size={13} /> AI redesign ready</div>
        </div>
      </section>

      <section className="platform-band" id="platforms"><header><span>SUPPORTED PLATFORMS</span><ArrowRight size={18} /></header><div className="platform-track"><div>{[...supportedPlatforms, ...supportedPlatforms].map((platform, index) => <span className={`platform-logo ${platform.tone}`} key={`${platform.name}-${index}`}><b>{platform.mark}</b>{platform.name}</span>)}</div></div></section>
      <p className="platform-note">◉ Analyze any public store URL instantly, or connect your store for deeper insights, monitoring, and publishing.</p>
      <section className="outcome-strip">{landingOutcomes.map((outcome) => <div className="outcome" key={outcome.label}><i>{outcome.icon}</i><p><b>{outcome.value}<small>{outcome.suffix}</small></b><span>{outcome.label}</span></p></div>)}</section>

      <section className="landing-section finding-section" id="capabilities"><div className="finding-main"><div className="landing-eyebrow">WHAT WE FIND</div><h2>Your store may have problems you can’t see.</h2><VisualCarousel className="finding-carousel" label="Store analysis visual carousel" /><div className="issue-cards">{[["Design", "Hierarchy and brand consistency."], ["Mobile", "Small-screen friction."], ["UX", "Journey and CTA issues."], ["Performance", "Slow loading paths."], ["Conversion", "Missed opportunities."]].map(([title, copy], index) => <article key={title}><img src={evidenceAsset} alt={`${title} storefront evidence`} /><div><b><i />{title}</b><p>{copy}</p></div></article>)}</div></div><aside className="change-story"><img src={heroAsset} alt="Storefront findings overview" /><ul><li>Below-the-fold content not optimized</li><li>Slow Largest Contentful Paint</li><li>Weak product section hierarchy</li><li>Low contrast on key CTAs</li></ul><button onClick={goToWorkspace}>View full analysis <ArrowRight size={13} /></button></aside></section>

      <section className="ai-band"><div><div className="landing-eyebrow">ASK FERIXRG AI</div><h2>Don’t just find the problem.<br />Fix it.</h2><p>FerixRG AI turns insight into action—instantly.</p></div><div className="prompt-grid">{[["Improve product page conversion", "product-composer"], ["Speed up my store", "performance-evidence"], ["Redesign with a modern look", "responsive-redesign"], ["Improve mobile checkout", "checkout-friction"]].map(([prompt, toolId]) => <button onClick={() => goToAuthenticatedTool(toolId)} key={prompt}>{prompt} <ArrowRight size={12} /></button>)}</div></section>

      <section className="landing-section evidence-section"><div className="landing-eyebrow">EVIDENCE READY</div><h2>Every improvement has proof.</h2><VisualCarousel className="evidence-carousel" label="Evidence and redesign visual carousel" /><div className="evidence-cards"><article><b>01 &nbsp; Responsive test</b><img src="/landing/ferixrg-visual-mobile.png" alt="Responsive storefront test" /><small>Desktop 98 / Tablet 93 / Mobile 88</small></article><article><b>02 &nbsp; AI redesign alternative</b><img src="/landing/ferixrg-visual-redesign.png" alt="AI redesign alternative" /><small>Compare directions before publishing.</small></article><article><b>03 &nbsp; Report-ready improvements</b><img src="/landing/ferixrg-visual-workflow.png" alt="Report ready storefront improvements" /><small>18 total improvements · Download report</small></article></div></section>
      <section className="redesign-compare"><article className="before"><span>Before</span><b>72 <small>/100</small></b><img src={redesignAsset} alt="Before storefront design" /></article><article className="after"><span>After</span><b>94 <small>/100</small></b><img src={redesignAsset} alt="After storefront design" /></article></section>
      <section className="landing-section workflow-section" id="workflow"><div className="landing-eyebrow">PROVEN PROCESS</div><h2>From insight to impact.</h2><div className="workflow-cards">{landingWorkflow.map(([number, title, copy]) => <article key={number}><b>{number}</b><div><h3>{title}</h3><p>{copy}</p></div></article>)}</div></section>
      <section className="health-report"><header><b>Your Store Health Report</b><button onClick={goToWorkspace}>Download <ArrowRight size={13} /></button></header><img src={heroAsset} alt="Store health report evidence" /><div>{landingHealthMetrics.map((metric) => <article key={metric.name}><span>{metric.name}</span><b>{metric.value}</b><i className={metric.tone} /></article>)}</div></section>
      <section className="landing-cta"><h2>Your store can be better.<br />Let’s find out how.</h2><div><PrimaryButton onClick={goToWorkspace}>Analyze My Store</PrimaryButton><button className="landing-secondary light" onClick={goToRegister}>Create Free Account</button></div></section>
      <footer className="landing-footer"><Brand /><span>Product · Solutions · Platforms · Resources</span><span>© 2026 FerixRG</span></footer>
    </div>
  </main>;
}
