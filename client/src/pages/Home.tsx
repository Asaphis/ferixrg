/* FerixRG — Quiet Instrument Panel: asymmetric editorial storytelling, cobalt decisions, and visible storefront evidence. */
import { ArrowRight, Check, ChevronRight, Compass, Eye, ScanLine, ShieldCheck, Sparkles, X } from "lucide-react";
import { useState } from "react";
import { useLocation } from "wouter";

const heroAsset = "/manus-storage/ferixrg-hero-workspace_790b5fe6.png";
const evidenceAsset = "/manus-storage/ferixrg-analysis-evidence_b61b40c0.png";
const redesignAsset = "/manus-storage/ferixrg-redesign-compare_034828ad.png";
const markAsset = "/manus-storage/ferixrg-mark_1f427345.png";

function Brand() {
  return <a className="brand" href="/"><img src={markAsset} alt="FerixRG" /><span>FERIX<b>RG</b></span></a>;
}

export default function Home() {
  const [, navigate] = useLocation();
  const [authOpen, setAuthOpen] = useState(false);

  return (
    <main className="ferix-public grain">
      <nav className="public-nav">
        <Brand />
        <div className="nav-links">
          <a href="#capabilities">Capabilities</a>
          <a href="#workflow">Workflow</a>
          <a href="#redesign">Redesign</a>
          <a href="#trust">Trust</a>
        </div>
        <div className="nav-actions">
          <button className="text-button" onClick={() => setAuthOpen(true)}>Sign in</button>
          <button className="primary-button" onClick={() => setAuthOpen(true)}>Start free <ArrowRight size={14} /></button>
        </div>
      </nav>

      <section className="hero">
        <div className="hero-field" />
        <span className="calibration-mark">CALIBRATED FOR COMMERCE / 01</span>
        <div className="hero-grid">
          <div className="hero-copy">
            <span className="eyebrow">Storefront intelligence, made tangible</span>
            <h1>Make every storefront <em>move with intent.</em></h1>
            <p>FerixRG shows the precise storefront experience your customers meet, turns evidence into a clear improvement path, and keeps the final decision in your hands.</p>
            <div className="hero-ctas">
              <button className="primary-button" onClick={() => setAuthOpen(true)}>Analyze a storefront <ArrowRight size={14} /></button>
              <button className="outline-button" onClick={() => document.getElementById("workflow")?.scrollIntoView()}>See the workflow</button>
            </div>
            <div className="hero-meta">
              <span><strong>URL or screenshot</strong>Begin with what you can access.</span>
              <span><strong>Every viewport</strong>See the real mobile experience.</span>
              <span><strong>Truthful publishing</strong>Apply only where control exists.</span>
            </div>
          </div>
          <div className="hero-media">
            <div className="hero-image-wrap"><img src={heroAsset} alt="FerixRG storefront intelligence workspace" /></div>
            <div className="floating-proof"><span className="mini-label">Latest evidence</span><strong>+18</strong><p>points available by fixing the mobile purchase path.</p></div>
          </div>
        </div>
      </section>

      <section className="trust-strip" id="trust">
        <strong>For the decisions behind a better storefront.</strong>
        <div className="trust-points"><span><i /> Evidence-led findings</span><span><i /> AI proposals, never silent changes</span><span><i /> Capability-aware publishing</span></div>
      </section>

      <section className="section" id="capabilities">
        <div className="section-inner capability-layout">
          <div>
            <div className="section-label">01 / Observe with context</div>
            <h2 className="section-heading">Not another score. <span className="serif">A calibrated point of view.</span></h2>
            <p className="section-intro">A rating only matters when it directs the next move. FerixRG connects each score to the exact page, viewport, evidence, and design decision that can change it.</p>
            <div className="capability-list">
              {[['01','Render what shoppers see','Scan a public URL, an authorized store, or screenshots at every relevant device.'],['02','Find the friction','Connect visual, responsive, UX, performance, accessibility, and conversion evidence.'],['03','Choose the response','Open a safe fix, a redesign direction, or a developer-ready handoff from the same finding.']].map(([n,title,text]) => <div className="capability-row" key={n}><span className="number">{n}</span><div><strong>{title}</strong><p>{text}</p></div><ChevronRight size={17} /></div>)}
            </div>
          </div>
          <div style={{ position: "relative" }}><div className="evidence-figure"><img src={evidenceAsset} alt="Annotated storefront evidence visual" /></div><div className="signal-note"><strong>Visible at 390px</strong>Primary purchase action loses hierarchy after image gallery.</div></div>
        </div>
      </section>

      <section className="section score-area">
        <div className="section-inner score-layout">
          <div><div className="section-label">02 / Make the next move clear</div><h2 className="section-heading">One health signal. <span className="serif">Eleven useful lenses.</span></h2><p className="section-intro">FerixRG gives teams a common view of health without flattening the nuance inside design, experience, and technical performance.</p><div className="score-ring-large"><b>82</b><span>Store health</span></div></div>
          <div className="score-cards">{[['Design','88','A hero that has room to sell.'],['Responsive','71','3 mobile collisions need review.'],['Conversion','79','Trust context can arrive earlier.'],['Accessibility','92','Clear, actionable improvement path.']].map(([name,score,copy]) => <div className="score-card" key={name}><div className="score-top"><span>{name}</span><b>{score}</b></div><p>{copy}</p></div>)}</div>
        </div>
      </section>

      <section className="section process" id="workflow"><div className="section-inner"><div className="process-header"><div><div className="section-label">03 / A connected workflow</div><h2 className="section-heading">Observe. Decide. <span className="serif">Improve responsibly.</span></h2></div><p className="section-intro">The workspace opens advanced capabilities only when they are useful, but never hides the path forward.</p></div><div className="process-track">{[['01','Inspect','Choose a URL, connected store, or a set of screenshots.'],['02','Understand','Review issue evidence across each page and viewport.'],['03','Create','Compare an AI direction, a manual change, or implementation guidance.'],['04','Validate','Re-scan, approve, version, and publish only where support exists.']].map(([n,title,text]) => <div className="process-step" key={n}><span className="step-index">{n}</span><h3>{title}</h3><p>{text}</p></div>)}</div></div></section>

      <section className="section redesign-spotlight" id="redesign"><div className="section-inner redesign-layout"><div className="redesign-proof"><img src={redesignAsset} alt="Before and after storefront redesign comparison" /></div><div><div className="section-label">04 / Design with a traceable rationale</div><h2 className="section-heading">Redesign is a proposal, <span className="serif">not a leap of faith.</span></h2><p className="section-intro">Preserve the brand elements that matter. Generate alternatives that respond to the current evidence. Preview them at every viewport before a change becomes a version.</p><div className="quote-block"><p>“A better storefront is one the whole team can explain, measure, and stand behind.”</p><span>Built for store owners, product teams, designers, agencies, and developers.</span></div><button className="primary-button" style={{marginTop: 31}} onClick={() => navigate("/app")}>Open the sample workspace <ArrowRight size={14} /></button></div></div></section>

      <footer className="public-footer"><div className="footer-top"><div><span className="eyebrow" style={{color:'#a9c5ff'}}>FERIXRG / ECOMMERCE INTELLIGENCE</span><h2 className="footer-heading">Your storefront already has a story. See the part your customers are living.</h2></div><div className="footer-side"><p>Bring a public URL, a screenshot, or an authorized storefront. FerixRG will make the next responsible move visible.</p><button className="primary-button" onClick={() => setAuthOpen(true)}>Start a first analysis <ArrowRight size={14} /></button></div></div><div className="footer-bottom"><span>© 2026 Ferixas / AsaPhis ORG</span><span>Privacy · Security · Terms</span></div></footer>

      {authOpen && <div className="auth-backdrop" role="dialog" aria-modal="true" aria-labelledby="auth-title"><div className="auth-panel"><aside className="auth-aside"><Brand /><h2>Your evidence-led workspace is ready.</h2><p>Use the interactive demo to scan, prioritize issues, compare redesign directions, and validate a controlled change.</p></aside><div className="auth-main"><button className="close-auth" aria-label="Close sign-in dialog" onClick={() => setAuthOpen(false)}><X size={19}/></button><span className="eyebrow">Enter the workspace</span><h3 id="auth-title">Start with a real decision.</h3><p>Use the prototype account or continue into the sample workspace.</p><label className="input-label">Email</label><input defaultValue="demo@ferixrg.com" type="email" /><label className="input-label">Password</label><input defaultValue="ferixrg-demo" type="password" /><button className="primary-button" onClick={() => navigate('/app')}><Compass size={15}/> Open demo workspace</button><p className="demo-note"><b>Prototype note:</b> authentication and all integration outcomes are simulated. The workspace keeps capability limits visible throughout.</p></div></div></div>}
    </main>
  );
}
