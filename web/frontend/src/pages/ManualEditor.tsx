import { useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import {
  ArrowLeft, Bot, Boxes, ChevronDown, ChevronLeft, ChevronRight, Circle, ClipboardCheck, Code2, Copy, Eye, FilePlus2, Grid2X2, Image, Layers3, LayoutPanelTop, Lightbulb, Menu, Monitor, MoreHorizontal, MousePointer2, Paintbrush, PanelLeft, Pencil, Plus, Redo2, RotateCcw, Save, Search, Settings2, ShieldCheck, Smartphone, Sparkles, Tablet, Trash2, Undo2, Upload, WandSparkles, X,
} from "lucide-react";
import "./manualEditor.css";
import "./manualEditorViewport.css";
import "./manualEditorComparison.css";

type Device = "Desktop" | "Tablet" | "Mobile";
type Panel = "Add" | "Layers" | "Pages" | "Assets" | "Components";
type InspectorTab = "Content" | "Style" | "Layout" | "Shape" | "Responsive" | "Effects";
type Kind = "page" | "section" | "text" | "button" | "image" | "card" | "shape" | "vector" | "container";
type Shape = "none" | "wave" | "curve" | "angle" | "u-shape" | "w-shape" | "custom";
type Tool = "select" | "pen" | "pencil";

type Style = {
  color?: string; background?: string; fontSize?: number; radius?: number; padding?: number; gap?: number; opacity?: number;
  align?: "start" | "center" | "end"; width?: "auto" | "contained" | "full"; shadow?: "none" | "soft" | "medium";
  topShape?: Shape; bottomShape?: Shape; shapeHeight?: number; display?: "flex" | "grid" | "block"; direction?: "row" | "column";
};

type ElementNode = { id: string; kind: Exclude<Kind, "page" | "section">; name: string; text?: string; asset?: string; style: Style; visible: boolean; locked: boolean; overrides: Partial<Record<Device, Style>> };
type Section = { id: string; name: string; type: "hero" | "products" | "story" | "newsletter" | "footer" | "blank"; style: Style; visible: boolean; locked: boolean; elements: ElementNode[]; overrides: Partial<Record<Device, Style>> };
type Page = { id: string; name: string; path: string; style: Style; sections: Section[] };
type DocumentState = { pages: Page[]; activePageId: string };
type Selection = { scope: "page" | "section" | "element"; pageId: string; sectionId?: string; elementId?: string };
type Version = { id: string; label: string; snapshot: DocumentState; time: string };
type Vector = { id: string; pageId: string; sectionId: string; points: { x: number; y: number }[]; color: string; weight: number };
export type ManualEditorContext = { projectTitle: string; toolName: string; source: string; finding: string; evidence: string; recommendation: string; focusLabels?: string[] };
type ManualEditorProps = { context: ManualEditorContext; mode: "Manual" | "AI proposal"; onModeChange: (mode: "Manual" | "AI proposal") => void; onBack: () => void };

const uid = (prefix: string) => `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
const clone = <T,>(value: T): T => JSON.parse(JSON.stringify(value)) as T;

const templateElement = (kind: ElementNode["kind"], name: string): ElementNode => ({
  id: uid(kind), kind, name, visible: true, locked: false, overrides: {},
  text: kind === "text" ? "Your new heading" : kind === "button" ? "Explore the collection" : kind === "card" ? "Feature card" : undefined,
  asset: kind === "image" ? "Form study" : undefined,
  style: kind === "button" ? { background: "#244ca4", color: "#ffffff", radius: 8, padding: 12, fontSize: 14 } : kind === "shape" ? { background: "#a9c2e8", radius: 20, opacity: .9 } : kind === "card" ? { background: "#ffffff", radius: 14, padding: 18, shadow: "soft" } : { color: "#182138", fontSize: kind === "text" ? 28 : 14, padding: 0, radius: 0, opacity: 1 },
});

const starterPages = (): Page[] => [
  {
    id: "home", name: "Homepage", path: "/", style: { background: "#f7f5ef" }, sections: [
      { id: "hero", name: "Hero section", type: "hero", visible: true, locked: false, overrides: {}, style: { background: "#e9edf8", padding: 56, bottomShape: "wave", shapeHeight: 34 }, elements: [
        { id: "hero-kicker", kind: "text", name: "Eyebrow", text: "NEW SEASON", visible: true, locked: false, overrides: {}, style: { color: "#4261aa", fontSize: 11 } },
        { id: "hero-heading", kind: "text", name: "Hero heading", text: "Designed to feel\nlike your own.", visible: true, locked: false, overrides: {}, style: { color: "#172039", fontSize: 48 } },
        { id: "hero-copy", kind: "text", name: "Hero description", text: "Quiet utility pieces for the spaces and routines that matter.", visible: true, locked: false, overrides: {}, style: { color: "#5d6679", fontSize: 15 } },
        { id: "hero-cta", kind: "button", name: "Primary CTA", text: "Explore the collection", visible: true, locked: false, overrides: {}, style: { background: "#244ca4", color: "#ffffff", radius: 8, padding: 13, fontSize: 14 } },
        { id: "hero-image", kind: "image", name: "Hero image", asset: "Form study", visible: true, locked: false, overrides: {}, style: { background: "#c48150", radius: 34, shadow: "medium" } },
      ] },
      { id: "products", name: "Featured products", type: "products", visible: true, locked: false, overrides: {}, style: { background: "#f7f5ef", padding: 50, bottomShape: "none", shapeHeight: 24 }, elements: [
        { id: "products-heading", kind: "text", name: "Section heading", text: "Made for the everyday", visible: true, locked: false, overrides: {}, style: { color: "#172039", fontSize: 23 } },
        { id: "products-grid", kind: "card", name: "Product grid", text: "Clay vessel | Field towel | Carry case", visible: true, locked: false, overrides: {}, style: { gap: 14, radius: 12 } },
      ] },
      { id: "story", name: "Brand story", type: "story", visible: true, locked: false, overrides: {}, style: { background: "#dfe5d8", padding: 56, topShape: "curve", shapeHeight: 24 }, elements: [
        { id: "story-heading", kind: "text", name: "Story heading", text: "Objects for a slower everyday.", visible: true, locked: false, overrides: {}, style: { color: "#1c3328", fontSize: 34 } },
        { id: "story-copy", kind: "text", name: "Story copy", text: "Built in small batches, designed to stay useful for years.", visible: true, locked: false, overrides: {}, style: { color: "#4d6254", fontSize: 15 } },
        { id: "story-image", kind: "image", name: "Story image", asset: "Linen texture", visible: true, locked: false, overrides: {}, style: { background: "#87a680", radius: 14 } },
      ] },
      { id: "footer", name: "Footer", type: "footer", visible: true, locked: false, overrides: {}, style: { background: "#172039", color: "#ffffff", padding: 28 }, elements: [
        { id: "footer-text", kind: "text", name: "Footer text", text: "NOVA — Made for a slower everyday.", visible: true, locked: false, overrides: {}, style: { color: "#ffffff", fontSize: 12 } },
      ] },
    ]
  },
  { id: "product", name: "Product details", path: "/products/clay-vessel", style: { background: "#f7f5ef" }, sections: [
    { id: "product-hero", name: "Product detail", type: "hero", visible: true, locked: false, overrides: {}, style: { background: "#f4eee6", padding: 56 }, elements: [
      { id: "product-title", kind: "text", name: "Product title", text: "Clay vessel", visible: true, locked: false, overrides: {}, style: { color: "#432b1a", fontSize: 48 } },
      { id: "product-price", kind: "text", name: "Price", text: "$48.00", visible: true, locked: false, overrides: {}, style: { color: "#74563b", fontSize: 17 } },
      { id: "product-button", kind: "button", name: "Add to cart", text: "Add to cart", visible: true, locked: false, overrides: {}, style: { background: "#432b1a", color: "#fff", radius: 8, padding: 13, fontSize: 14 } },
      { id: "product-image", kind: "image", name: "Product image", asset: "Clay vessel", visible: true, locked: false, overrides: {}, style: { background: "#c48150", radius: 40, shadow: "medium" } },
    ] },
  ] },
  { id: "collection", name: "Collection", path: "/collections/new", style: { background: "#f7f5ef" }, sections: [
    { id: "collection-grid", name: "Collection grid", type: "products", visible: true, locked: false, overrides: {}, style: { background: "#f7f5ef", padding: 48 }, elements: [
      { id: "collection-title", kind: "text", name: "Collection title", text: "The new season", visible: true, locked: false, overrides: {}, style: { color: "#172039", fontSize: 42 } },
      { id: "collection-products", kind: "card", name: "Collection products", text: "Clay vessel | Field towel | Carry case", visible: true, locked: false, overrides: {}, style: { gap: 14, radius: 12 } },
    ] },
  ] },
];

function resolveStyle<T extends { style: Style; overrides?: Partial<Record<Device, Style>> }>(node: T, device: Device) { return { ...node.style, ...(node.overrides?.[device] ?? {}) }; }
function css(style: Style): CSSProperties { return { color: style.color, background: style.background, fontSize: style.fontSize, borderRadius: style.radius, padding: style.padding, gap: style.gap, opacity: style.opacity, textAlign: style.align, boxShadow: style.shadow === "medium" ? "0 18px 28px rgba(26,36,57,.22)" : style.shadow === "soft" ? "0 7px 16px rgba(26,36,57,.14)" : undefined }; }

export default function ManualEditor({ context, mode, onModeChange, onBack }: ManualEditorProps) {
  const [baselineDocument] = useState<DocumentState>(() => ({ pages: starterPages(), activePageId: "home" }));
  const [document, setDocument] = useState<DocumentState>(() => clone(baselineDocument));
  const [history, setHistory] = useState<DocumentState[]>(() => [clone(baselineDocument)]);
  const [historyIndex, setHistoryIndex] = useState(0);
  const [selection, setSelection] = useState<Selection>({ scope: "element", pageId: "home", sectionId: "hero", elementId: "hero-heading" });
  const [device, setDevice] = useState<Device>(() => window.innerWidth <= 820 ? "Mobile" : "Desktop");
  const [panel, setPanel] = useState<Panel>("Layers");
  const [tab, setTab] = useState<InspectorTab>("Content");
  const [tool, setTool] = useState<Tool>("select");
  const [grid, setGrid] = useState(true);
  const [mobileSheet, setMobileSheet] = useState<"none" | "panel" | "inspector" | "more">("none");
  const [vectors, setVectors] = useState<Vector[]>([]);
  const [versions, setVersions] = useState<Version[]>([]);
  const [notice, setNotice] = useState("Local prototype — no production or store connection");
  const [aiOpen, setAiOpen] = useState(false);
  const [aiProposal, setAiProposal] = useState(false);
  const [validateOpen, setValidateOpen] = useState(false);
  const [releaseOpen, setReleaseOpen] = useState(false);
  const [checks, setChecks] = useState<Record<string, boolean>>({ content: false, responsive: false, access: false, permission: false });
  const [preview, setPreview] = useState(false);
  const [comparisonSide, setComparisonSide] = useState<"before" | "after">("after");
  const canvasRef = useRef<HTMLDivElement>(null);

  const activePage = document.pages.find(page => page.id === document.activePageId)!;
  const selectedSection = activePage.sections.find(section => section.id === selection.sectionId);
  const selectedElement = selectedSection?.elements.find(element => element.id === selection.elementId);
  const selected = selection.scope === "page" ? activePage : selection.scope === "section" ? selectedSection : selectedElement;
  const selectedStyle = selected ? resolveStyle(selected, device) : {};
  const isMobile = device === "Mobile";
  const completedChecks = Object.values(checks).filter(Boolean).length;
  const baselinePage = baselineDocument.pages.find(page => page.id === activePage.id);

  const commit = (next: DocumentState, message: string) => {
    const nextHistory = [...history.slice(0, historyIndex + 1), clone(next)];
    setDocument(next); setHistory(nextHistory); setHistoryIndex(nextHistory.length - 1); setNotice(message);
  };
  const patchDocument = (mapper: (current: DocumentState) => DocumentState, message: string) => commit(mapper(clone(document)), message);
  const updateSelected = (patch: Partial<Style> | { text?: string; asset?: string; visible?: boolean; locked?: boolean }, responsive = false) => {
    if (!selected) return;
    patchDocument(current => ({ ...current, pages: current.pages.map(page => page.id !== selection.pageId ? page : { ...page, sections: page.sections.map(section => {
      if (selection.scope === "section" && section.id === selection.sectionId) return responsive ? { ...section, overrides: { ...section.overrides, [device]: { ...section.overrides[device], ...(patch as Partial<Style>) } } } : { ...section, ...(patch as Partial<Section>), style: { ...section.style, ...(patch as Partial<Style>) } };
      if (selection.scope === "element" && section.id === selection.sectionId) return { ...section, elements: section.elements.map(element => element.id !== selection.elementId ? element : responsive ? { ...element, overrides: { ...element.overrides, [device]: { ...element.overrides[device], ...(patch as Partial<Style>) } } } : { ...element, ...(patch as Partial<ElementNode>), style: { ...element.style, ...(patch as Partial<Style>) } }) };
      return section;
    }) } ) }), "Draft updated locally");
  };
  const selectPage = (pageId: string) => { const page = document.pages.find(item => item.id === pageId)!; setDocument({ ...document, activePageId: pageId }); setSelection({ scope: "page", pageId }); setNotice(`${page.name} local draft opened`); };
  const selectSection = (section: Section) => { setSelection({ scope: "section", pageId: activePage.id, sectionId: section.id }); setTab("Style"); setTool("select"); };
  const selectElement = (section: Section, element: ElementNode) => { setSelection({ scope: "element", pageId: activePage.id, sectionId: section.id, elementId: element.id }); setTab("Content"); setTool("select"); };
  const addSection = (type: Section["type"] = "blank") => {
    const section: Section = { id: uid("section"), name: type === "blank" ? "New section" : `${type[0]!.toUpperCase()}${type.slice(1)} section`, type, visible: true, locked: false, overrides: {}, style: { background: "#f0f3f9", padding: 46, bottomShape: "none", shapeHeight: 24 }, elements: [templateElement("text", "Section heading")] };
    patchDocument(current => ({ ...current, pages: current.pages.map(page => page.id === activePage.id ? { ...page, sections: [...page.sections, section] } : page) }), "Section added locally"); setSelection({ scope: "section", pageId: activePage.id, sectionId: section.id }); setPanel("Layers");
  };
  const addElement = (kind: ElementNode["kind"], name: string) => {
    const target = selectedSection ?? activePage.sections.find(section => section.id !== "footer")!;
    const element = templateElement(kind, name);
    patchDocument(current => ({ ...current, pages: current.pages.map(page => page.id !== activePage.id ? page : { ...page, sections: page.sections.map(section => section.id === target.id ? { ...section, elements: [...section.elements, element] } : section) }) }), `${name} added locally`);
    setSelection({ scope: "element", pageId: activePage.id, sectionId: target.id, elementId: element.id }); setPanel("Layers");
  };
  const addPage = () => { const page: Page = { id: uid("page"), name: `New page ${document.pages.length + 1}`, path: "/new-page", style: { background: "#f7f5ef" }, sections: [] }; patchDocument(current => ({ pages: [...current.pages, page], activePageId: page.id }), "Independent local page created"); setSelection({ scope: "page", pageId: page.id }); setPanel("Pages"); };
  const removeSelected = () => {
    if (selection.scope === "element" && selectedSection && selectedElement) patchDocument(current => ({ ...current, pages: current.pages.map(page => page.id !== activePage.id ? page : { ...page, sections: page.sections.map(section => section.id === selectedSection.id ? { ...section, elements: section.elements.filter(element => element.id !== selectedElement.id) } : section) }) }), "Element removed locally");
    if (selection.scope === "section" && selectedSection) patchDocument(current => ({ ...current, pages: current.pages.map(page => page.id !== activePage.id ? page : { ...page, sections: page.sections.filter(section => section.id !== selectedSection.id) }) }), "Section removed locally");
    setSelection({ scope: "page", pageId: activePage.id });
  };
  const duplicateSelected = () => {
    if (selection.scope === "element" && selectedSection && selectedElement) { const duplicate = { ...clone(selectedElement), id: uid(selectedElement.kind), name: `${selectedElement.name} copy` }; patchDocument(current => ({ ...current, pages: current.pages.map(page => page.id !== activePage.id ? page : { ...page, sections: page.sections.map(section => section.id === selectedSection.id ? { ...section, elements: [...section.elements, duplicate] } : section) }) }), "Element duplicated locally"); setSelection({ scope: "element", pageId: activePage.id, sectionId: selectedSection.id, elementId: duplicate.id }); }
    if (selection.scope === "section" && selectedSection) { const duplicate = { ...clone(selectedSection), id: uid("section"), name: `${selectedSection.name} copy`, elements: selectedSection.elements.map(item => ({ ...item, id: uid(item.kind) })) }; patchDocument(current => ({ ...current, pages: current.pages.map(page => page.id !== activePage.id ? page : { ...page, sections: [...page.sections, duplicate] }) }), "Section duplicated locally"); setSelection({ scope: "section", pageId: activePage.id, sectionId: duplicate.id }); }
  };
  const reorderSection = (direction: -1 | 1) => { if (!selectedSection) return; const currentIndex = activePage.sections.findIndex(section => section.id === selectedSection.id); const nextIndex = currentIndex + direction; if (nextIndex < 0 || nextIndex >= activePage.sections.length) return; patchDocument(current => ({ ...current, pages: current.pages.map(page => { if (page.id !== activePage.id) return page; const sections = [...page.sections]; [sections[currentIndex], sections[nextIndex]] = [sections[nextIndex]!, sections[currentIndex]!]; return { ...page, sections }; }) }), "Section order updated locally"); };
  const undo = () => { if (historyIndex === 0) return; const next = history[historyIndex - 1]!; setHistoryIndex(historyIndex - 1); setDocument(clone(next)); setNotice("Draft restored from history"); };
  const redo = () => { if (historyIndex >= history.length - 1) return; const next = history[historyIndex + 1]!; setHistoryIndex(historyIndex + 1); setDocument(clone(next)); setNotice("Draft restored from history"); };
  const saveVersion = () => { const item = { id: uid("version"), label: `Version ${versions.length + 1}`, snapshot: clone(document), time: "Saved just now" }; setVersions([item, ...versions]); setNotice("Local version saved"); };
  const restoreVersion = (version: Version) => { commit(clone(version.snapshot), `${version.label} restored locally`); setSelection({ scope: "page", pageId: version.snapshot.activePageId }); };
  const startVector = (event: React.MouseEvent<HTMLDivElement>) => { if (tool === "select" || !selectedSection || !canvasRef.current) return; const bounds = canvasRef.current.getBoundingClientRect(); const point = { x: Math.round(((event.clientX - bounds.left) / bounds.width) * 100), y: Math.round(((event.clientY - bounds.top) / bounds.height) * 100) }; setVectors(current => { const last = current[current.length - 1]; if (!last || last.sectionId !== selectedSection.id || tool === "pen") return [...current, { id: uid("vector"), pageId: activePage.id, sectionId: selectedSection.id, points: [point], color: "#4261aa", weight: tool === "pencil" ? 2 : 3 }]; return current.map((path, index) => index === current.length - 1 ? { ...path, points: [...path.points, point] } : path); }); setNotice(`${tool === "pen" ? "Vector point" : "Pencil stroke"} added locally`); };
  const applyAi = () => { if (!selectedElement) return; updateSelected({ color: "#244ca4", fontSize: Math.max(14, (selectedStyle.fontSize ?? 18) + 3) }); setAiProposal(false); setAiOpen(false); onModeChange("Manual"); setNotice("Sample AI proposal applied to local draft"); };
  const openAiReview = () => { onModeChange("AI proposal"); setAiOpen(true); };
  const closeAiReview = () => { onModeChange("Manual"); setAiOpen(false); };

  useEffect(() => { const onKey = (event: KeyboardEvent) => { if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "z") { event.preventDefault(); event.shiftKey ? redo() : undo(); } }; window.addEventListener("keydown", onKey); return () => window.removeEventListener("keydown", onKey); });
  useEffect(() => { if (mode === "AI proposal") setAiOpen(true); }, [mode]);

  return <div className={`studio ${preview ? "previewing" : ""}`}>
    <header className="studio-topbar">
      <div className="brand"><button className="icon" onClick={onBack} aria-label="Back to workspace"><ArrowLeft size={17}/></button><div><strong>FERIX<span>RG</span></strong><small>MANUAL EDITOR</small></div><em>Local only</em></div>
      <div className="history"><button className="icon" aria-label="Undo" disabled={historyIndex === 0} onClick={undo}><Undo2 size={16}/></button><button className="icon" aria-label="Redo" disabled={historyIndex === history.length - 1} onClick={redo}><Redo2 size={16}/></button><button className="label-button" onClick={saveVersion}><RotateCcw size={15}/><span>Versions</span></button></div>
      <div className="device-switch" aria-label="Preview device">{([Monitor, Tablet, Smartphone] as const).map((Icon, index) => { const name = (["Desktop", "Tablet", "Mobile"] as Device[])[index]!; return <button key={name} className={device === name ? "active" : ""} aria-pressed={device === name} onClick={() => setDevice(name)}><Icon size={15}/><span>{name}</span></button>; })}</div>
      <div className="top-actions"><button className="label-button preview-toggle" onClick={() => setPreview(!preview)}><Eye size={16}/><span>{preview ? "Edit" : "Preview"}</span></button><button className="label-button" onClick={() => setNotice("Draft saved locally in this prototype session")}><Save size={16}/><span>Save</span></button><button className="release" onClick={() => setReleaseOpen(true)}><ShieldCheck size={16}/><span>Release</span></button></div>
    </header>
    <div className="context-bar"><span><WandSparkles size={14}/>{context.toolName}</span><span>{context.projectTitle} · local-only storefront</span><span>{notice}</span></div>
    <main className="studio-body">
      {!preview && <aside className={`left-panel ${mobileSheet === "panel" ? "show-mobile" : ""}`}>
        <div className="panel-tabs">{([{ id: "Add", icon: Plus }, { id: "Layers", icon: Layers3 }, { id: "Pages", icon: FilePlus2 }, { id: "Assets", icon: Image }, { id: "Components", icon: Boxes }] as const).map(item => <button key={item.id} className={panel === item.id ? "active" : ""} onClick={() => { setPanel(item.id); setMobileSheet("panel"); }}><item.icon size={16}/><span>{item.id}</span></button>)}</div>
        <div className="panel-content"><button className="mobile-close" aria-label="Close panel" onClick={() => setMobileSheet("none")}><X size={17}/></button><SidePanel panel={panel} activePage={activePage} selection={selection} document={document} vectors={vectors} onSelectPage={selectPage} onSelectSection={selectSection} onSelectElement={selectElement} onAddSection={addSection} onAddElement={addElement} onAddPage={addPage} onAsset={(asset) => selectedElement ? updateSelected({ asset }) : setNotice("Select an image element before replacing its asset")} /></div>
      </aside>}
      <section className="canvas-column">
        {preview ? <ComparisonWorkspace before={baselinePage} after={activePage} device={device} mobileSide={comparisonSide} onMobileSideChange={setComparisonSide} onEdit={() => setPreview(false)} /> : <>
          <div className="canvas-toolbar"><div><span>EDIT MODE</span><strong>{activePage.name}</strong></div><div className="tool-row"><button className={tool === "select" ? "active" : ""} onClick={() => setTool("select")}><MousePointer2 size={14}/>Select</button><button className={tool === "pen" ? "active" : ""} onClick={() => setTool("pen")}><Paintbrush size={14}/>Pen</button><button className={tool === "pencil" ? "active" : ""} onClick={() => setTool("pencil")}><Pencil size={14}/>Pencil</button><button className={grid ? "active" : ""} onClick={() => setGrid(!grid)}><Grid2X2 size={14}/>Grid</button></div></div>
          <div className="canvas-stage">
            <div className="storefront-viewport" aria-label="Scrollable editable storefront" tabIndex={0}>
              <div ref={canvasRef} onClick={startVector} className={`storefront device-${device.toLowerCase()} ${grid ? "grid-on" : ""}`} style={css(resolveStyle(activePage, device))}>
                <div className="browser-bar"><i/><i/><i/><span>preview.your-store.com</span><b>{device}</b></div>
                <StorefrontHeader page={activePage} selected={selection} device={device} onSelect={selectElement}/>
                {activePage.sections.filter(section => section.visible).map(section => <StoreSection key={section.id} page={activePage} section={section} selection={selection} device={device} onSelectSection={selectSection} onSelectElement={selectElement} />)}
                <VectorOverlay vectors={vectors.filter(path => path.pageId === activePage.id)} selectedSection={selection.sectionId} />
              </div>
            </div>
          </div>
        </>}
      </section>
      {!preview && <aside className={`inspector ${mobileSheet === "inspector" ? "show-mobile" : ""}`}>
        <div className="sheet-handle"/><div className="inspector-heading"><div><span>{selection.scope} selected</span><h2>{selected?.name ?? "No selection"}</h2></div><button className="mobile-close" aria-label="Close properties" onClick={() => setMobileSheet("none")}><X size={17}/></button></div>
        <div className="inspector-tabs">{(["Content", "Style", "Layout", "Shape", "Responsive", "Effects"] as InspectorTab[]).map(name => <button className={tab === name ? "active" : ""} onClick={() => setTab(name)} key={name}>{name}</button>)}</div>
        <Inspector tab={tab} selected={selected} selection={selection} style={selectedStyle} device={device} onPatch={updateSelected} onAi={openAiReview} onRemove={removeSelected} onDuplicate={duplicateSelected} onMove={reorderSection}/>
      </aside>}
    </main>
    {!preview && selection.scope !== "page" && <div className="quick-actions"><button onClick={() => { setTab("Content"); setMobileSheet("inspector"); }}>Edit</button><button onClick={() => { setTab("Style"); setMobileSheet("inspector"); }}>Style</button><button onClick={duplicateSelected}>Duplicate</button><button className="danger" onClick={removeSelected}>Delete</button></div>}
    {!preview && <div className="status"><span><i/> {notice}</span><span>{device} · Local draft · {grid ? "Grid on" : "Grid off"}</span><div><button onClick={() => { setTab("Style"); setMobileSheet("inspector"); }}>Properties</button><button onClick={() => setVersionsOpen(setNotice, versions.length)}> {versions.length || 1} versions</button><button onClick={openAiReview}>Compare</button><button onClick={() => setValidateOpen(true)}>Validate</button></div></div>}
    {!preview && <nav className="mobile-nav"><button className={tool === "select" ? "active" : ""} onClick={() => setTool("select")}><MousePointer2 size={18}/><span>Select</span></button><button onClick={() => { setPanel("Add"); setMobileSheet("panel"); }}><Plus size={19}/><span>Add</span></button><button onClick={() => { setPanel("Layers"); setMobileSheet("panel"); }}><Layers3 size={18}/><span>Layers</span></button><button onClick={openAiReview}><Sparkles size={18}/><span>AI</span></button><button onClick={() => setMobileSheet(mobileSheet === "more" ? "none" : "more")}><MoreHorizontal size={19}/><span>More</span></button></nav>}
    {mobileSheet === "more" && <div className="more-sheet"><button onClick={() => { setPanel("Pages"); setMobileSheet("panel"); }}><FilePlus2 size={16}/>Pages</button><button onClick={() => { setPanel("Assets"); setMobileSheet("panel"); }}><Image size={16}/>Assets</button><button onClick={() => { setPanel("Components"); setMobileSheet("panel"); }}><Boxes size={16}/>Components</button><button onClick={() => setValidateOpen(true)}><ClipboardCheck size={16}/>Validate</button><button onClick={saveVersion}><RotateCcw size={16}/>Versions</button></div>}
    {aiOpen && <AiDialog proposal={aiProposal} onPropose={() => setAiProposal(true)} onApply={applyAi} onClose={closeAiReview} />}
    {validateOpen && <ValidationDialog checks={checks} setChecks={setChecks} onClose={() => setValidateOpen(false)} onRelease={() => { setValidateOpen(false); setReleaseOpen(true); }} />}
    {releaseOpen && <ReleaseDialog complete={completedChecks === 4} onClose={() => setReleaseOpen(false)} />}
    {versions.length > 0 && (
      <VersionsDrawer versions={versions} onRestore={restoreVersion} />
    )}
  </div>;
}

function setVersionsOpen(setNotice: (message: string) => void, count: number) { setNotice(`${count || 1} local version${count === 1 ? "" : "s"} available. Save a version from the top toolbar before restoring.`); }

function ComparisonWorkspace({ before, after, device, mobileSide, onMobileSideChange, onEdit }: { before?: Page; after: Page; device: Device; mobileSide: "before" | "after"; onMobileSideChange: (side: "before" | "after") => void; onEdit: () => void }) {
  return <section className="comparison-workspace" aria-label="Local before and after comparison">
    <header className="comparison-header">
      <div><span>LOCAL DRAFT COMPARISON</span><h2>Before and after</h2><p>Compare the starting sample with your current local edits.</p></div>
      <button className="comparison-edit" onClick={onEdit}><MousePointer2 size={15}/>Return to editing</button>
    </header>
    <div className="comparison-mobile-switch" aria-label="Choose mobile comparison view">
      <button className={mobileSide === "before" ? "active" : ""} aria-pressed={mobileSide === "before"} onClick={() => onMobileSideChange("before")}>Before</button>
      <button className={mobileSide === "after" ? "active" : ""} aria-pressed={mobileSide === "after"} onClick={() => onMobileSideChange("after")}>After</button>
    </div>
    <div className="comparison-grid">
      {before ? <ComparisonStorefront label="Before" page={before} device={device} active={mobileSide === "before"} /> : <article className={`comparison-empty ${mobileSide === "before" ? "active" : ""}`}><strong>Before unavailable</strong><span>This page was created in the local editor, so there is no starting sample state to compare.</span></article>}
      <ComparisonStorefront label="After" page={after} device={device} active={mobileSide === "after"} />
    </div>
    <footer className="comparison-note">This is an in-browser local comparison. It does not create a connected-store preview, render, export, or publish action.</footer>
  </section>;
}

function ComparisonStorefront({ label, page, device, active }: { label: "Before" | "After"; page: Page; device: Device; active: boolean }) {
  const emptySelection: Selection = { scope: "page", pageId: page.id };
  const noop = () => undefined;
  return <article className={`comparison-card ${label.toLowerCase()} ${active ? "active" : ""}`}>
    <header><strong>{label}</strong><span>{label === "Before" ? "Starting sample" : "Current local edits"}</span></header>
    <div className="comparison-viewport" aria-label={`${label} storefront preview`} tabIndex={0}>
      <div className={`storefront device-${device.toLowerCase()}`} style={css(resolveStyle(page, device))}>
        <div className="browser-bar"><i/><i/><i/><span>preview.your-store.com</span><b>{label}</b></div>
        <StorefrontHeader page={page} selected={emptySelection} device={device} onSelect={noop}/>
        {page.sections.filter(section => section.visible).map(section => <StoreSection key={section.id} page={page} section={section} selection={emptySelection} device={device} onSelectSection={noop} onSelectElement={noop} />)}
      </div>
    </div>
  </article>;
}

function SidePanel({ panel, activePage, selection, document, onSelectPage, onSelectSection, onSelectElement, onAddSection, onAddElement, onAddPage, onAsset }: { panel: Panel; activePage: Page; selection: Selection; document: DocumentState; vectors: Vector[]; onSelectPage: (id: string) => void; onSelectSection: (section: Section) => void; onSelectElement: (section: Section, element: ElementNode) => void; onAddSection: (type?: Section["type"]) => void; onAddElement: (kind: ElementNode["kind"], name: string) => void; onAddPage: () => void; onAsset: (asset: string) => void }) {
  if (panel === "Add") return <><PanelTitle eyebrow="Add to page" title="Elements"/><div className="add-groups"><AddGroup title="Layout" items={[["Section", () => onAddSection("blank")], ["Hero", () => onAddSection("hero")], ["Container", () => onAddElement("container", "Container")], ["Columns", () => onAddElement("card", "Columns")]]}/><AddGroup title="Content" items={[["Heading", () => onAddElement("text", "Heading")], ["Text", () => onAddElement("text", "Text")], ["Button", () => onAddElement("button", "Button")], ["Image", () => onAddElement("image", "Image")]]}/><AddGroup title="Commerce" items={[["Product grid", () => onAddElement("card", "Product grid")], ["Product card", () => onAddElement("card", "Product card")], ["Collection", () => onAddElement("card", "Collection")]]}/><AddGroup title="Draw & shape" items={[["Rectangle", () => onAddElement("shape", "Rectangle")], ["Ellipse", () => onAddElement("shape", "Ellipse")], ["Line", () => onAddElement("shape", "Line")], ["Vector", () => onAddElement("vector", "Vector path")]]}/></div></>;
  if (panel === "Layers") return <><PanelTitle eyebrow="Document structure" title="Layers"/><div className="layer-tree"><button className={selection.scope === "page" ? "layer selected" : "layer"} onClick={() => onSelectPage(activePage.id)}><ChevronDown size={14}/><LayoutPanelTop size={14}/><b>{activePage.name}</b></button>{activePage.sections.map(section => <div key={section.id}><button className={selection.sectionId === section.id && selection.scope === "section" ? "layer selected indent-1" : "layer indent-1"} onClick={() => onSelectSection(section)}><ChevronDown size={13}/><Layers3 size={13}/><span>{section.name}</span></button>{section.elements.map(element => <button key={element.id} className={selection.elementId === element.id ? "layer selected indent-2" : "layer indent-2"} onClick={() => onSelectElement(section, element)}><span className="kind-dot">{element.kind === "image" ? "▧" : element.kind === "button" ? "□" : element.kind === "shape" ? "○" : "T"}</span><span>{element.name}</span></button>)}</div>)}</div></>;
  if (panel === "Pages") return <><PanelTitle eyebrow="Website pages" title="Pages" action={<button className="icon" onClick={onAddPage} aria-label="Create page"><Plus size={16}/></button>}/><div className="page-list">{document.pages.map(page => <button className={page.id === activePage.id ? "active" : ""} key={page.id} onClick={() => onSelectPage(page.id)}><FilePlus2 size={16}/><span>{page.name}</span>{page.id === activePage.id && <ShieldCheck size={15}/>}</button>)}</div></>;
  if (panel === "Assets") return <><PanelTitle eyebrow="Local sample assets" title="Assets"/><label className="asset-upload"><Upload size={16}/>Choose a local image<input type="file" accept="image/*" onChange={(event) => event.target.files?.[0] && onAsset(event.target.files[0].name)} /></label><div className="asset-grid">{["Form study", "Clay vessel", "Linen texture", "Studio shadow", "Tide object", "Soft grain"].map((asset, index) => <button key={asset} className={`asset asset-${index}`} onClick={() => onAsset(asset)}><i/><span>{asset}</span></button>)}</div></>;
  return <><PanelTitle eyebrow="Reusable local blocks" title="Components"/><div className="component-list">{["Hero split", "Product grid", "Newsletter", "Editorial card", "Store notice"].map((name, index) => <button onClick={() => index === 0 ? onAddSection("hero") : onAddElement("card", name)} key={name}><Boxes size={16}/><span>{name}</span><Plus size={14}/></button>)}</div><button className="save-component" onClick={() => onAddElement("card", "Saved component")}>Save selected as a component</button></>;
}
function PanelTitle({ eyebrow, title, action }: { eyebrow: string; title: string; action?: React.ReactNode }) { return <div className="panel-title"><div><span>{eyebrow}</span><h2>{title}</h2></div>{action}</div>; }
function AddGroup({ title, items }: { title: string; items: [string, () => void][] }) { return <section className="add-group"><span>{title}</span><div>{items.map(([name, onClick]) => <button onClick={onClick} key={name}><Plus size={13}/>{name}</button>)}</div></section>; }

function StorefrontHeader({ page, selected, device, onSelect }: { page: Page; selected: Selection; device: Device; onSelect: (section: Section, element: ElementNode) => void }) {
  const section = page.sections[0]; const logo: ElementNode = { id: "logo", kind: "text", name: "Brand logo", text: "NOVA", visible: true, locked: false, overrides: {}, style: { color: "#172039", fontSize: 16 } };
  return <header className="site-header"><button className={selected.elementId === logo.id ? "selected-node" : ""} onClick={(event) => { event.stopPropagation(); onSelect(section!, logo); }} style={css(resolveStyle(logo, device))}>{logo.text}</button><nav>{device === "Mobile" ? <Menu size={17}/> : "Shop · Collections · Journal"}</nav><Circle size={15}/></header>;
}
function StoreSection({ page, section, selection, device, onSelectSection, onSelectElement }: { page: Page; section: Section; selection: Selection; device: Device; onSelectSection: (section: Section) => void; onSelectElement: (section: Section, element: ElementNode) => void }) {
  const style = resolveStyle(section, device); const selected = selection.scope === "section" && selection.sectionId === section.id; const visible = section.elements.filter(element => element.visible); const find = (id: string) => visible.find(element => element.id === id); const selectable = (element?: ElementNode) => element && { className: selection.elementId === element.id ? "selected-node" : "", onClick: (event: React.MouseEvent) => { event.stopPropagation(); onSelectElement(section, element); }, style: css(resolveStyle(element, device)) };
  return <section className={`site-section ${section.type} ${selected ? "selected-section" : ""}`} style={css(style)} onClick={() => onSelectSection(section)}>
    {style.topShape && style.topShape !== "none" && (
      <Divider shape={style.topShape} edge="top" height={style.shapeHeight ?? 26} color={style.background ?? "#fff"} />
    )}
    {section.type === "hero" && <div className="hero-content"><div className="hero-copy">{find("hero-kicker") && <button {...selectable(find("hero-kicker"))} className={`${selectable(find("hero-kicker"))?.className ?? ""} kicker`}>{find("hero-kicker")?.text}</button>}{visible.filter(item => item.id !== "hero-kicker" && item.kind !== "image").map(item => <ElementView key={item.id} element={item} device={device} selected={selection.elementId === item.id} onSelect={() => onSelectElement(section, item)}/>)}</div>{visible.filter(item => item.kind === "image").map(item => <ElementView key={item.id} element={item} device={device} selected={selection.elementId === item.id} onSelect={() => onSelectElement(section, item)}/>)}</div>}
    {section.type === "products" && <div className="products-content">{visible.map(item => <ElementView key={item.id} element={item} device={device} selected={selection.elementId === item.id} onSelect={() => onSelectElement(section, item)}/>)}</div>}
    {section.type === "story" && <div className="story-content">{visible.map(item => <ElementView key={item.id} element={item} device={device} selected={selection.elementId === item.id} onSelect={() => onSelectElement(section, item)}/>)}</div>}
    {section.type === "footer" && <div className="footer-content">{visible.map(item => <ElementView key={item.id} element={item} device={device} selected={selection.elementId === item.id} onSelect={() => onSelectElement(section, item)}/>)}</div>}
    {section.type === "blank" && <div className="blank-content">{visible.map(item => <ElementView key={item.id} element={item} device={device} selected={selection.elementId === item.id} onSelect={() => onSelectElement(section, item)}/>)}</div>}
    {style.bottomShape && style.bottomShape !== "none" && (
      <Divider shape={style.bottomShape} edge="bottom" height={style.shapeHeight ?? 26} color={nextColor(page, section)} />
    )}
  </section>;
}
function nextColor(page: Page, section: Section) { const index = page.sections.findIndex(item => item.id === section.id); return page.sections[index + 1]?.style.background ?? section.style.background ?? "#fff"; }
function ElementView({ element, device, selected, onSelect }: { element: ElementNode; device: Device; selected: boolean; onSelect: () => void }) { const style = resolveStyle(element, device); const common = { className: selected ? "selected-node" : "", onClick: (event: React.MouseEvent) => { event.stopPropagation(); onSelect(); }, style: css(style) }; if (element.kind === "button") return <button {...common} className={`${common.className} store-button`}>{element.text}</button>; if (element.kind === "image") return <button {...common} className={`${common.className} store-image`}><span>{element.asset ?? "Image"}</span></button>; if (element.kind === "card") return <button {...common} className={`${common.className} store-card`}>{element.name.toLowerCase().includes("grid") || element.name.toLowerCase().includes("product") || element.text?.includes("|") ? <div className="product-cards">{(element.text ?? "Product one | Product two | Product three").split("|").map((item, index) => <span key={`${item}-${index}`}><i className={`tile tile-${index}`}/><b>{item.trim()}</b><small>${[48, 28, 34][index] ?? 32}</small></span>)}</div> : element.text ?? element.name}</button>; if (element.kind === "shape" || element.kind === "vector") return <button {...common} className={`${common.className} store-shape`}><i/></button>; return <button {...common} className={`${common.className} store-text`}>{(element.text ?? element.name).split("\n").map((line, index) => <span key={`${line}-${index}`}>{line}</span>)}</button>; }
function Divider({ shape, edge, height, color }: { shape: Exclude<Shape, "none">; edge: "top" | "bottom"; height: number; color: string }) { const paths: Record<Exclude<Shape, "none">, string> = { wave: "M0 12 C12 2 25 2 37 12 S62 22 75 12 S88 2 100 12 V24 H0 Z", curve: "M0 0 C25 23 75 23 100 0 V24 H0 Z", angle: "M0 0 L100 18 V24 H0 Z", "u-shape": "M0 0 C18 0 23 20 50 20 S82 0 100 0 V24 H0 Z", "w-shape": "M0 0 L25 18 L50 3 L75 18 L100 0 V24 H0 Z", custom: "M0 8 L18 2 L39 17 L61 5 L80 20 L100 7 V24 H0 Z" }; return <span className={`divider ${edge}`} style={{ height }} aria-label={`${shape} ${edge} divider`}><svg viewBox="0 0 100 24" preserveAspectRatio="none"><path d={paths[shape]} fill={color}/></svg></span>; }
function VectorOverlay({ vectors, selectedSection }: { vectors: Vector[]; selectedSection?: string }) { return <svg className="vector-overlay" viewBox="0 0 100 100" preserveAspectRatio="none">{vectors.map(path => <g key={path.id}><polyline points={path.points.map(point => `${point.x},${point.y}`).join(" ")} fill="none" stroke={path.color} strokeWidth={path.weight / 2} vectorEffect="non-scaling-stroke"/>{path.sectionId === selectedSection && path.points.map((point, index) => <circle key={index} cx={point.x} cy={point.y} r="1.4" fill="#fff" stroke={path.color} vectorEffect="non-scaling-stroke"/>)}</g>)}</svg>; }

function Inspector({ tab, selected, selection, style, device, onPatch, onAi, onRemove, onDuplicate, onMove }: { tab: InspectorTab; selected?: Page | Section | ElementNode; selection: Selection; style: Style; device: Device; onPatch: (patch: Partial<Style> | { text?: string; asset?: string; visible?: boolean; locked?: boolean }, responsive?: boolean) => void; onAi: () => void; onRemove: () => void; onDuplicate: () => void; onMove: (direction: -1 | 1) => void }) {
  if (!selected) return <div className="inspector-content">Select an item on the canvas.</div>;
  const shapeVisible = selection.scope === "section";
  return <div className="inspector-content">
    {tab === "Content" && <><InspectorSection title="Content">{"text" in selected && <label>Text<textarea value={(selected as ElementNode).text ?? ""} onChange={event => onPatch({ text: event.target.value })}/></label>}{"asset" in selected && <label>Asset<input value={(selected as ElementNode).asset ?? ""} onChange={event => onPatch({ asset: event.target.value })}/></label>}<label>Display name<input value={selected.name} readOnly aria-label="Display name"/></label></InspectorSection><InspectorSection title={`Typography · ${device}`}><Range label="Size" value={style.fontSize ?? 16} min={10} max={72} onChange={value => onPatch({ fontSize: value }, true)}/><Color label="Text" value={style.color ?? "#172039"} onChange={value => onPatch({ color: value }, true)}/></InspectorSection><button className="ai-inline" onClick={onAi}><Sparkles size={16}/>Ask AI about this selection</button></>}
    {tab === "Style" && <><InspectorSection title={`Appearance · ${device}`}><Color label="Fill" value={style.background ?? "#eef1f7"} onChange={value => onPatch({ background: value }, true)}/><Color label="Text" value={style.color ?? "#172039"} onChange={value => onPatch({ color: value }, true)}/><Range label="Opacity" value={Math.round((style.opacity ?? 1) * 100)} min={10} max={100} suffix="%" onChange={value => onPatch({ opacity: value / 100 }, true)}/><Range label="Radius" value={style.radius ?? 0} min={0} max={48} suffix="px" onChange={value => onPatch({ radius: value }, true)}/></InspectorSection><InspectorSection title="Shadow"><select value={style.shadow ?? "none"} onChange={event => onPatch({ shadow: event.target.value as Style["shadow"] }, true)}><option value="none">None</option><option value="soft">Soft</option><option value="medium">Medium</option></select></InspectorSection></>}
    {tab === "Layout" && <><InspectorSection title={`Layout · ${device}`}><label>Width<select value={style.width ?? "auto"} onChange={event => onPatch({ width: event.target.value as Style["width"] }, true)}><option value="auto">Auto</option><option value="contained">Contained</option><option value="full">Full width</option></select></label><label>Display<select value={style.display ?? "flex"} onChange={event => onPatch({ display: event.target.value as Style["display"] }, true)}><option value="flex">Flex</option><option value="grid">Grid</option><option value="block">Block</option></select></label><label>Direction<select value={style.direction ?? "column"} onChange={event => onPatch({ direction: event.target.value as Style["direction"] }, true)}><option value="column">Column</option><option value="row">Row</option></select></label><Range label="Padding" value={style.padding ?? 0} min={0} max={100} suffix="px" onChange={value => onPatch({ padding: value }, true)}/><Range label="Gap" value={style.gap ?? 12} min={0} max={72} suffix="px" onChange={value => onPatch({ gap: value }, true)}/></InspectorSection>{selection.scope === "section" && <InspectorSection title="Section order"><div className="button-pair"><button onClick={() => onMove(-1)}><ChevronLeft size={16}/>Move up</button><button onClick={() => onMove(1)}>Move down<ChevronRight size={16}/></button></div></InspectorSection>}</>}
    {tab === "Shape" && <><InspectorSection title={shapeVisible ? "Section shape divider" : "Element shape"}>{shapeVisible ? <><label>Top edge<select value={style.topShape ?? "none"} onChange={event => onPatch({ topShape: event.target.value as Shape })}><ShapeOptions/></select></label><label>Bottom edge<select value={style.bottomShape ?? "none"} onChange={event => onPatch({ bottomShape: event.target.value as Shape })}><ShapeOptions/></select></label><Range label="Shape height" value={style.shapeHeight ?? 28} min={12} max={100} suffix="px" onChange={value => onPatch({ shapeHeight: value })}/><p>Wave, curve, angle, U, W, and custom-vector transitions join the adjacent sections in this prototype.</p></> : <><Range label="Corner radius" value={style.radius ?? 0} min={0} max={80} suffix="px" onChange={value => onPatch({ radius: value }, true)}/><p>Select a section in Layers to control its top and bottom transitions.</p></>}</InspectorSection></>}
    {tab === "Responsive" && <><InspectorSection title={`Current canvas: ${device}`}><p>Changes made in Style, Layout, and Content can be saved as this device's local override. Switch Desktop, Tablet, or Mobile in the top toolbar to inspect each canvas.</p><button className="wide-button" onClick={() => onPatch({ fontSize: style.fontSize ?? 16, padding: style.padding ?? 0 }, true)}>Save current values as {device} override</button></InspectorSection></>}
    {tab === "Effects" && <><InspectorSection title="Visibility & locking"><div className="button-pair"><button onClick={() => onPatch({ visible: !(selected as ElementNode | Section).visible })}><Eye size={15}/>{(selected as ElementNode | Section).visible ? "Hide" : "Show"}</button><button onClick={() => onPatch({ locked: !(selected as ElementNode | Section).locked })}><ShieldCheck size={15}/>{(selected as ElementNode | Section).locked ? "Unlock" : "Lock"}</button></div></InspectorSection><InspectorSection title="Actions"><div className="button-pair"><button onClick={onDuplicate}><Copy size={15}/>Duplicate</button><button className="danger-button" onClick={onRemove}><Trash2 size={15}/>Delete</button></div></InspectorSection></>}
  </div>;
}
function ShapeOptions() { return <><option value="none">None</option><option value="wave">Wave</option><option value="curve">Curve</option><option value="angle">Angle</option><option value="u-shape">U shape</option><option value="w-shape">W shape</option><option value="custom">Custom vector</option></>; }
function InspectorSection({ title, children }: { title: string; children: React.ReactNode }) { return <section className="inspector-section"><h3>{title}<ChevronDown size={14}/></h3>{children}</section>; }
function Range({ label, value, min, max, suffix = "px", onChange }: { label: string; value: number; min: number; max: number; suffix?: string; onChange: (value: number) => void }) { return <label className="range-label"><span>{label}<em>{value}{suffix}</em></span><input type="range" min={min} max={max} value={value} onChange={event => onChange(Number(event.target.value))}/></label>; }
function Color({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) { return <label className="color-label"><span>{label}<em>{value}</em></span><input type="color" value={value.startsWith("#") ? value : "#172039"} onChange={event => onChange(event.target.value)}/></label>; }

function AiDialog({ proposal, onPropose, onApply, onClose }: { proposal: boolean; onPropose: () => void; onApply: () => void; onClose: () => void }) { return <div className="modal-backdrop"><section className="modal ai-modal"><button className="modal-close" onClick={onClose}><X size={18}/></button><span className="modal-eyebrow"><Sparkles size={16}/>AI review — prototype only</span><h2>Prepare a reviewable change</h2><p>This prototype does not call an AI service. It creates a safe sample proposal so you can test the review flow without changing a store.</p>{!proposal ? <><label>Instruction<textarea defaultValue="Improve hierarchy while keeping the calm editorial tone."/></label><button className="primary" onClick={onPropose}><Bot size={16}/>Create sample proposal</button></> : <div className="proposal"><div><span>Current</span><strong>48 px / #172039</strong></div><ArrowLeft size={15}/><div><span>Proposed</span><strong>51 px / #244ca4</strong></div><p>AI proposals remain reviewable. Nothing is applied automatically.</p><div className="button-pair"><button onClick={onClose}>Reject</button><button className="primary" onClick={onApply}>Apply to local draft</button></div></div>}</section></div>; }
function ValidationDialog({ checks, setChecks, onClose, onRelease }: { checks: Record<string, boolean>; setChecks: React.Dispatch<React.SetStateAction<Record<string, boolean>>>; onClose: () => void; onRelease: () => void }) { const items = [{ id: "content", label: "Content reviewed", text: "Headings, links, and calls-to-action have been checked." }, { id: "responsive", label: "Responsive preview reviewed", text: "Desktop, tablet, and mobile layouts have been inspected." }, { id: "access", label: "Accessibility review completed", text: "Color contrast and touch targets were reviewed." }, { id: "permission", label: "Release permission confirmed", text: "A user explicitly approved the release request." }]; const done = Object.values(checks).filter(Boolean).length; return <div className="modal-backdrop"><section className="modal validation"><button className="modal-close" onClick={onClose}><X size={18}/></button><span className="modal-eyebrow"><ClipboardCheck size={16}/>Release readiness</span><h2>Validate before requesting release</h2><p>{done} of 4 checks complete. Prototype release remains blocked until all checks are confirmed.</p>{items.map(item => <label className="check-row" key={item.id}><input type="checkbox" checked={checks[item.id] ?? false} onChange={() => setChecks(current => ({ ...current, [item.id]: !current[item.id] }))}/><span><b>{item.label}</b><small>{item.text}</small></span></label>)}<button className="primary" disabled={done < 4} onClick={onRelease}>Continue to release review</button></section></div>; }
function ReleaseDialog({ complete, onClose }: { complete: boolean; onClose: () => void }) { return <div className="modal-backdrop"><section className="modal release-modal"><button className="modal-close" onClick={onClose}><X size={18}/></button><ShieldCheck size={30}/><h2>{complete ? "Ready to request release" : "Release is protected"}</h2><p>{complete ? "This is an isolated prototype. Confirming here will not publish, transfer files, or change a real store." : "Complete the validation checklist first. No automatic publishing is available in this prototype."}</p><button className="primary" disabled={!complete} onClick={onClose}>{complete ? "Confirm prototype review" : "Validation required"}</button></section></div>; }
function VersionsDrawer({ versions, onRestore }: { versions: Version[]; onRestore: (version: Version) => void }) { return <aside className="versions-drawer"><span>Local versions</span>{versions.slice(0, 3).map(version => <button key={version.id} onClick={() => onRestore(version)}><RotateCcw size={14}/><span>{version.label}<small>{version.time}</small></span></button>)}</aside>; }
