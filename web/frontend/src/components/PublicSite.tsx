import { ArrowRight, ChevronDown, Link2, Menu, Sparkles } from "lucide-react";
import React, { type MouseEvent, useEffect, useState } from "react";
import { useLocation } from "wouter";
import { landingVisuals, publicNavItems } from "@/lib/landingContent";
import { applyLandingParallaxToMontage } from "@/lib/landingMotion";
import "../pages/landing.css";
import "../pages/landingMotion.css";

export const heroAsset = "/landing/portfolio/shopify-multi-device-beauty.jpg";
export const mobileAsset = "/landing/portfolio/allbirds-mobile-storefront.png";
export const beforeAsset = "/landing/portfolio/afrogem-before-after.jpg";
export const afterAsset = "/landing/portfolio/shopify-store-redesign-supplied.png";
export const issueCardVisuals = [
  { title: "Design", copy: "Hierarchy and brand consistency.", src: "/landing/portfolio/fashion-responsive-storefront.jpg", alt: "Responsive fashion storefront design example" },
  { title: "Mobile", copy: "Small-screen friction.", src: mobileAsset, alt: "Allbirds mobile storefront across three views" },
  { title: "UX", copy: "Journey and CTA issues.", src: "/landing/portfolio/portfolio-before-after-skincare.png", alt: "Skincare storefront before and after UX redesign" },
  { title: "Performance", copy: "Slow loading paths.", src: heroAsset, alt: "Multi-device storefront performance example" },
  { title: "Conversion", copy: "Missed opportunities.", src: "/landing/portfolio/portfolio-before-after-fashion.jpg", alt: "Fashion storefront conversion before and after comparison" },
];

export function Brand() {
  return <a className="landing-brand" href="/"><img className="landing-logo-art" src="/branding/ferixrg-logo-transparent.png" alt="FerixRG emblem" /><span>FERIX<b>RG</b></span></a>;
}

export function PrimaryButton({ children, onClick, className = "" }: { children: React.ReactNode; onClick?: () => void; className?: string }) {
  return <button type="button" className={`landing-primary ${className}`} onClick={onClick}>{children} <ArrowRight size={14} /></button>;
}

export function PublicNav() {
  const [, navigate] = useLocation();
  const [mobileMenu, setMobileMenu] = useState(false);
  return <>
    <nav className="landing-nav">
      <Brand />
      <div className="landing-links">{publicNavItems.slice(0, 7).map(([label, href]) => <a href={href} key={label}>{label}{!["How It Works", "Pricing"].includes(label) && <ChevronDown size={11} />}</a>)}</div>
      <div className="landing-nav-actions"><button type="button" className="landing-signin" onClick={() => navigate("/auth/login")}>Sign In</button><PrimaryButton onClick={() => navigate("/auth/register")}>Get Started</PrimaryButton></div>
      <button type="button" className="landing-menu" aria-label="Open navigation" onClick={() => setMobileMenu(open => !open)}><Menu size={21} /></button>
    </nav>
    {mobileMenu && <div className="landing-mobile-menu">{publicNavItems.map(([label, href]) => <a href={href} key={label} onClick={() => setMobileMenu(false)}>{label}</a>)}<button type="button" onClick={() => navigate("/auth/register")}>Get Started</button></div>}
  </>;
}

export function PublicFooter() {
  return <footer className="landing-footer"><Brand /><span><a href="/features">Product</a> · <a href="/solutions">Solutions</a> · <a href="/platforms">Platforms</a> · <a href="/resources">Resources</a> · <a href="/about">About</a> · <a href="/contact">Contact</a></span><span>© 2026 FerixRG</span></footer>;
}

export function PublicPage({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <main className={`landing-shell ${className}`}><div className="landing-canvas"><PublicNav />{children}<PublicFooter /></div></main>;
}

export function VisualCarousel({ className = "", label }: { className?: string; label: string }) {
  const [active, setActive] = useState(0);
  useEffect(() => { const timer = window.setInterval(() => setActive(current => (current + 1) % landingVisuals.length), 5200); return () => window.clearInterval(timer); }, []);
  return <div className={`landing-visual-carousel ${className}`} aria-label={label}><div className="landing-visual-stage">{landingVisuals.map((visual, index) => <img key={visual.src} src={visual.src} alt={visual.alt} className={index === active ? "is-active" : ""} loading={index === 0 ? "eager" : "lazy"} />)}<div className="landing-visual-shade" /><div className="landing-visual-caption"><span>FERIXRG VISUAL INTELLIGENCE</span><b>{String(active + 1).padStart(2, "0")} / {String(landingVisuals.length).padStart(2, "0")}</b></div></div><div className="landing-visual-controls" aria-label="Carousel controls"><button type="button" aria-label="Previous image" onClick={() => setActive((active - 1 + landingVisuals.length) % landingVisuals.length)}>←</button><div>{landingVisuals.map((visual, index) => <button type="button" key={visual.src} aria-label={`Show image ${index + 1}`} className={index === active ? "is-active" : ""} onClick={() => setActive(index)} />)}</div><button type="button" aria-label="Next image" onClick={() => setActive((active + 1) % landingVisuals.length)}>→</button></div></div>;
}

export function HeroMontage() {
  const setLayer = (node: HTMLElement, x: number, y: number) => { node.style.setProperty("--parallax-x", `${x}px`); node.style.setProperty("--parallax-y", `${y}px`); };
  const move = (event: MouseEvent<HTMLDivElement>) => { const bounds = event.currentTarget.getBoundingClientRect(); applyLandingParallaxToMontage(event.currentTarget, { viewportWidth: window.innerWidth, prefersReducedMotion: window.matchMedia("(prefers-reduced-motion: reduce)").matches }, (event.clientX - bounds.left) / bounds.width, (event.clientY - bounds.top) / bounds.height); };
  const reset = (event: MouseEvent<HTMLDivElement>) => event.currentTarget.querySelectorAll<HTMLElement>("[data-motion-layer]").forEach(node => setLayer(node, 0, 0));
  return <div className="hero-montage" aria-label="Animated storefront intelligence preview" onMouseMove={move} onMouseLeave={reset}><div className="hero-montage-frame"><div className="montage-workspace" data-motion-layer><img src={heroAsset} alt="FerixRG storefront analysis workspace" /><span>STORE HEALTH · 82 / 100</span></div><div className="montage-browser" data-motion-layer><div className="browser-chrome"><i /><i /><i /><span>YOURSTORE · Shop · Collections</span></div><div className="browser-store"><b>Timeless living.<br />thoughtfully curated.</b><small>Shop the collection</small></div><div className="browser-products"><i /><i /><i /></div></div><div className="montage-phone" data-motion-layer><img src={mobileAsset} alt="Allbirds mobile storefront phone preview" /></div><div className="montage-connector" data-motion-layer /><div className="montage-insight" data-motion-layer><div className="landing-eyebrow"><Sparkles size={10} /> AI INSIGHT</div><strong>91 <small>/100</small></strong><p>Your store is strong. We found 18 opportunities to improve.</p></div><div className="montage-impact" data-motion-layer><span>REDESIGN IMPACT</span><b>72 <em>→</em> 94</b><small>Before &nbsp;&nbsp;&nbsp;&nbsp; After</small></div><div className="montage-badge" data-motion-layer><Sparkles size={13} /> AI redesign ready</div></div></div>;
}

export function UrlCapture({ onAnalyze }: { onAnalyze: (url: string) => void }) {
  const [url, setUrl] = useState("");
  return <form className="landing-url" onSubmit={event => { event.preventDefault(); onAnalyze(url.trim()); }}><label>Paste your store URL</label><div><Link2 size={14} /><input aria-label="Store URL" value={url} onChange={event => setUrl(event.target.value)} placeholder="https://yourstore.com" /><button type="submit">Analyze Store</button></div><small>Analyze any public storefront without connecting your store.</small></form>;
}

