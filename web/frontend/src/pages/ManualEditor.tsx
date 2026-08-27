import { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  ArrowDown,
  ArrowUp,
  Box,
  Check,
  ChevronDown,
  ChevronRight,
  Circle,
  Clipboard,
  Code2,
  Columns3,
  Component,
  Copy,
  Eye,
  EyeOff,
  FileImage,
  FilePlus2,
  FolderOpen,
  Frame,
  GripVertical,
  Grid2X2,
  Image as ImageIcon,
  Layers3,
  LayoutPanelTop,
  Lock,
  LockKeyhole,
  Maximize2,
  Menu,
  Minus,
  Monitor,
  MoreHorizontal,
  MousePointer2,
  Move,
  Palette,
  PanelLeft,
  PenTool,
  Plus,
  Redo2,
  RotateCcw,
  Ruler,
  Save,
  Search,
  Settings2,
  ShieldCheck,
  Smartphone,
  Sparkles,
  Square,
  Tablet,
  Trash2,
  Type,
  Undo2,
  Upload,
  Wand2,
  ZoomIn,
  ZoomOut,
} from "lucide-react";
import "./manualEditor.css";

type EditorDevice = "Desktop" | "Tablet" | "Mobile";
type EditorPanel = "Add" | "Layers" | "Pages" | "Assets" | "Components";
type InspectorTab = "Design" | "Responsive" | "Content" | "Advanced";
type NodeKind = "page" | "section" | "container" | "text" | "button" | "image" | "product" | "shape" | "vector";

type EditorNode = {
  id: string;
  parentId: string | null;
  name: string;
  kind: NodeKind;
  visible: boolean;
  locked: boolean;
  content?: string;
  style: {
    color?: string;
    background?: string;
    fontSize?: number;
    width?: string;
    padding?: number;
    radius?: number;
    opacity?: number;
  };
};

type Version = { id: string; label: string; createdAt: string; nodeCount: number };

export type ManualEditorContext = {
  projectTitle: string;
  toolName: string;
  source: string;
  finding: string;
  evidence: string;
  recommendation: string;
  focusLabels: string[];
};

type ManualEditorProps = {
  context: ManualEditorContext;
  mode: "Manual" | "AI proposal";
  onModeChange: (mode: "Manual" | "AI proposal") => void;
  onBack: () => void;
};

const pageId = "page-home";
const initialNodes: EditorNode[] = [
  { id: pageId, parentId: null, name: "Homepage", kind: "page", visible: true, locked: false, style: { background: "#f8f6f1" } },
  { id: "header", parentId: pageId, name: "Header", kind: "section", visible: true, locked: false, style: { background: "#ffffff", padding: 18 } },
  { id: "header-logo", parentId: "header", name: "Brand logo", kind: "text", visible: true, locked: false, content: "NOVA", style: { fontSize: 16, color: "#182033" } },
  { id: "header-navigation", parentId: "header", name: "Navigation", kind: "text", visible: true, locked: false, content: "Shop  ·  Collections  ·  Journal", style: { fontSize: 11, color: "#57627a" } },
  { id: "hero", parentId: pageId, name: "Hero section", kind: "section", visible: true, locked: false, style: { background: "#e8ebf8", padding: 52 } },
  { id: "hero-copy", parentId: "hero", name: "Hero container", kind: "container", visible: true, locked: false, style: { width: "100%", padding: 0 } },
  { id: "hero-heading", parentId: "hero-copy", name: "Hero heading", kind: "text", visible: true, locked: false, content: "Designed to feel\nlike your own.", style: { fontSize: 48, color: "#172039" } },
  { id: "hero-description", parentId: "hero-copy", name: "Hero description", kind: "text", visible: true, locked: false, content: "Quiet utility pieces for the spaces and routines that matter.", style: { fontSize: 15, color: "#53617d" } },
  { id: "hero-cta", parentId: "hero-copy", name: "Primary CTA", kind: "button", visible: true, locked: false, content: "Explore the collection", style: { background: "#173b8f", color: "#ffffff", radius: 6, padding: 12 } },
  { id: "hero-image", parentId: "hero", name: "Hero image", kind: "image", visible: true, locked: false, content: "Featured object", style: { radius: 12 } },
  { id: "products", parentId: pageId, name: "Featured products", kind: "section", visible: true, locked: false, style: { background: "#f8f6f1", padding: 34 } },
  { id: "products-heading", parentId: "products", name: "Section heading", kind: "text", visible: true, locked: false, content: "Made for the everyday", style: { fontSize: 25, color: "#172039" } },
  { id: "product-grid", parentId: "products", name: "Product grid", kind: "product", visible: true, locked: false, content: "Dynamic product collection", style: { radius: 10 } },
  { id: "footer", parentId: pageId, name: "Footer", kind: "section", visible: true, locked: false, style: { background: "#172039", padding: 25 } },
];

const elementGroups: { title: string; items: { label: string; kind: NodeKind; icon: typeof Type }[] }[] = [
  { title: "Layout", items: [{ label: "Section", kind: "section", icon: LayoutPanelTop }, { label: "Container", kind: "container", icon: Box }, { label: "Grid", kind: "container", icon: Grid2X2 }, { label: "Columns", kind: "container", icon: Columns3 }] },
  { title: "Content", items: [{ label: "Heading", kind: "text", icon: Type }, { label: "Text", kind: "text", icon: Clipboard }, { label: "Button", kind: "button", icon: Square }, { label: "Image", kind: "image", icon: ImageIcon }] },
  { title: "Commerce", items: [{ label: "Product grid", kind: "product", icon: Grid2X2 }, { label: "Product block", kind: "product", icon: Box }, { label: "Collection", kind: "product", icon: FolderOpen }] },
  { title: "Draw & shape", items: [{ label: "Rectangle", kind: "shape", icon: Square }, { label: "Ellipse", kind: "shape", icon: Circle }, { label: "Line", kind: "shape", icon: Minus }, { label: "Pen path", kind: "vector", icon: PenTool }] },
];

const componentItems = ["Hero section", "Product card", "Collection feature", "Announcement bar", "Newsletter", "Trust block"];
const assets = ["Palette swatch", "Product still", "Collection image", "Brand mark", "Editorial image"];
const pages = ["Homepage", "Product details", "Collection", "Cart", "About"];

function nodeIcon(kind: NodeKind) {
  if (kind === "section") return LayoutPanelTop;
  if (kind === "container") return Box;
  if (kind === "text") return Type;
  if (kind === "button") return Square;
  if (kind === "image") return ImageIcon;
  if (kind === "product") return Grid2X2;
  if (kind === "vector") return PenTool;
  return Circle;
}

function nodeTemplate(kind: NodeKind, name: string, parentId: string): EditorNode {
  const id = `${kind}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
  const base: EditorNode = { id, parentId, name, kind, visible: true, locked: false, style: { radius: 8, padding: 12 } };
  if (kind === "text") return { ...base, content: name === "Heading" ? "Your new heading" : "Add your text here.", style: { ...base.style, color: "#172039", fontSize: name === "Heading" ? 30 : 14 } };
  if (kind === "button") return { ...base, content: "Button label", style: { ...base.style, background: "#173b8f", color: "#ffffff" } };
  if (kind === "image") return { ...base, content: "New image", style: { ...base.style } };
  if (kind === "product") return { ...base, content: "Store collection", style: { ...base.style } };
  if (kind === "vector") return { ...base, content: "Custom vector path", style: { ...base.style, background: "#d9e3ff" } };
  if (kind === "shape") return { ...base, content: name, style: { ...base.style, background: "#8ea9e8" } };
  return base;
}

export default function ManualEditor({ context, mode, onModeChange, onBack }: ManualEditorProps) {
  const [nodes, setNodes] = useState<EditorNode[]>(initialNodes);
  const [history, setHistory] = useState<EditorNode[][]>([initialNodes]);
  const [historyIndex, setHistoryIndex] = useState(0);
  const [selectedId, setSelectedId] = useState("hero-heading");
  const [activePanel, setActivePanel] = useState<EditorPanel>("Layers");
  const [inspectorTab, setInspectorTab] = useState<InspectorTab>("Design");
  const [device, setDevice] = useState<EditorDevice>("Desktop");
  const [zoom, setZoom] = useState(74);
  const [gridEnabled, setGridEnabled] = useState(true);
  const [guidesEnabled, setGuidesEnabled] = useState(true);
  const [previewing, setPreviewing] = useState(false);
  const [savedState, setSavedState] = useState("Saved locally");
  const [versions, setVersions] = useState<Version[]>([{ id: "version-1", label: "Homepage baseline", createdAt: "Current draft", nodeCount: initialNodes.length }]);
  const [notice, setNotice] = useState("");
  const [mobileInspector, setMobileInspector] = useState(false);
  const [draggedId, setDraggedId] = useState<string | null>(null);

  const selected = nodes.find(node => node.id === selectedId) ?? nodes[0]!;
  const byParent = useMemo(() => nodes.reduce<Record<string, EditorNode[]>>((map, node) => { if (node.parentId) (map[node.parentId] ??= []).push(node); return map; }, {}), [nodes]);
  const rootSections = byParent[pageId] ?? [];
  const selectedSection = selected.kind === "section" || selected.kind === "page" ? selected.id : selected.parentId ?? "hero";
  const children = (id: string) => byParent[id] ?? [];

  useEffect(() => {
    window.localStorage.setItem("ferixrg-manual-editor-draft", JSON.stringify({ nodes, selectedId, device, updatedAt: Date.now() }));
  }, [nodes, selectedId, device]);

  const commit = (next: EditorNode[], label = "Draft updated") => {
    const nextHistory = [...history.slice(0, historyIndex + 1), next];
    setNodes(next);
    setHistory(nextHistory);
    setHistoryIndex(nextHistory.length - 1);
    setSavedState(label);
  };
  const updateSelected = (patch: Partial<EditorNode> | { style: Partial<EditorNode["style"]> }) => {
    if (selected.locked) { setNotice("Unlock this layer before editing it."); return; }
    commit(nodes.map(node => node.id === selected.id ? { ...node, ...patch, style: "style" in patch ? { ...node.style, ...patch.style } : node.style } : node));
  };
  const addElement = (kind: NodeKind, label: string) => {
    const parent = selected.kind === "page" || selected.kind === "section" || selected.kind === "container" ? selected.id : selectedSection;
    const element = nodeTemplate(kind, label, parent);
    commit([...nodes, element], `${label} added locally`);
    setSelectedId(element.id);
    setActivePanel("Layers");
    setNotice(`${label} was added to ${nodes.find(node => node.id === parent)?.name ?? "the page"}.`);
  };
  const duplicateSelected = () => {
    if (selected.kind === "page") return;
    const duplicate = { ...selected, id: `${selected.id}-copy-${Date.now()}`, name: `${selected.name} copy`, locked: false };
    commit([...nodes, duplicate], "Layer duplicated locally");
    setSelectedId(duplicate.id);
  };
  const deleteSelected = () => {
    if (selected.kind === "page") { setNotice("The page root cannot be deleted here."); return; }
    const retained = nodes.filter(node => node.id !== selected.id && node.parentId !== selected.id);
    commit(retained, "Layer removed locally");
    setSelectedId("hero");
  };
  const moveSelected = (direction: "up" | "down") => {
    if (!selected.parentId) return;
    const peers = nodes.filter(node => node.parentId === selected.parentId);
    const index = peers.findIndex(node => node.id === selected.id);
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= peers.length) return;
    const target = peers[targetIndex]!;
    const selectedIndex = nodes.findIndex(node => node.id === selected.id);
    const targetAbsoluteIndex = nodes.findIndex(node => node.id === target.id);
    const reordered = [...nodes];
    [reordered[selectedIndex], reordered[targetAbsoluteIndex]] = [reordered[targetAbsoluteIndex]!, reordered[selectedIndex]!];
    commit(reordered, "Layer order updated locally");
  };
  const moveDraggedElement = (targetParentId: string) => {
    if (!draggedId || draggedId === targetParentId) return;
    const dragged = nodes.find(node => node.id === draggedId);
    const target = nodes.find(node => node.id === targetParentId);
    if (!dragged || !target || dragged.locked || target.kind === "text" || target.kind === "button" || target.kind === "image" || target.kind === "shape" || target.kind === "vector") return;
    if (target.parentId === dragged.id) return;
    commit(nodes.map(node => node.id === draggedId ? { ...node, parentId: targetParentId } : node), "Layer moved locally");
    setSelectedId(draggedId);
    setDraggedId(null);
    setNotice(`${dragged.name} moved into ${target.name}.`);
  };
  const undo = () => { if (historyIndex === 0) return; const nextIndex = historyIndex - 1; setHistoryIndex(nextIndex); setNodes(history[nextIndex]!); setSavedState("Draft restored from history"); };
  const redo = () => { if (historyIndex >= history.length - 1) return; const nextIndex = historyIndex + 1; setHistoryIndex(nextIndex); setNodes(history[nextIndex]!); setSavedState("Draft restored from history"); };
  const saveVersion = () => { const version = { id: `version-${Date.now()}`, label: `Version ${versions.length + 1}`, createdAt: "Saved just now", nodeCount: nodes.length }; setVersions([version, ...versions]); setSavedState("Version saved locally"); setNotice("A local version was created. It can be compared or restored when persistent project storage is connected."); };

  const renderLayerTree = (parentId: string, depth = 0) => children(parentId).map(node => {
    const Icon = nodeIcon(node.kind);
    return <div className={draggedId === node.id ? "manual-layer-row is-dragging" : "manual-layer-row"} key={node.id} style={{ paddingLeft: 12 + depth * 13 }} onDragOver={event => event.preventDefault()} onDrop={() => moveDraggedElement(node.id)}><button className={selected.id === node.id ? "manual-layer-select selected" : "manual-layer-select"} draggable={!node.locked} onDragStart={() => setDraggedId(node.id)} onDragEnd={() => setDraggedId(null)} onClick={() => setSelectedId(node.id)}><GripVertical size={12} /><Icon size={13} /><span>{node.name}</span>{!node.visible && <EyeOff size={12} />}{node.locked && <Lock size={11} />}</button>{children(node.id).length > 0 && <div className="manual-layer-children">{renderLayerTree(node.id, depth + 1)}</div>}</div>;
  });

  const selectedTextStyle = { color: selected.style.color, fontSize: `${selected.style.fontSize ?? 14}px`, opacity: selected.style.opacity ?? 1 };
  const canvasClass = `manual-canvas-frame device-${device.toLowerCase()} ${previewing ? "is-previewing" : ""} ${gridEnabled ? "show-grid" : ""}`;

  return <section className="manual-editor" aria-label="FerixRG Manual Editor">
    <header className="manual-editor-topbar">
      <div className="manual-editor-brand"><button className="manual-icon-button" onClick={onBack} aria-label="Return to result"><ArrowLeft size={17} /></button><div><strong>FERIX<span>RG</span></strong><small>Manual Editor</small></div></div>
      <div className="manual-history-controls"><button className="manual-icon-button" disabled={historyIndex === 0} onClick={undo} aria-label="Undo"><Undo2 size={16} /></button><button className="manual-icon-button" disabled={historyIndex >= history.length - 1} onClick={redo} aria-label="Redo"><Redo2 size={16} /></button><button className="manual-toolbar-label" onClick={saveVersion}><RotateCcw size={14} /><span>Versions</span></button></div>
      <div className="manual-topbar-center"><div className="manual-device-control" aria-label="Preview device">{([{ label: "Desktop", icon: Monitor }, { label: "Tablet", icon: Tablet }, { label: "Mobile", icon: Smartphone }] as const).map(item => { const Icon = item.icon; return <button className={device === item.label ? "active" : ""} onClick={() => setDevice(item.label)} aria-pressed={device === item.label} key={item.label}><Icon size={14} /><span>{item.label}</span></button>; })}</div><div className="manual-zoom"><button onClick={() => setZoom(value => Math.max(45, value - 5))} aria-label="Zoom out"><ZoomOut size={14} /></button><span>{zoom}%</span><button onClick={() => setZoom(value => Math.min(100, value + 5))} aria-label="Zoom in"><ZoomIn size={14} /></button></div></div>
      <div className="manual-topbar-actions"><button className={previewing ? "manual-toolbar-label active" : "manual-toolbar-label"} onClick={() => setPreviewing(value => !value)}><Eye size={14} /><span>{previewing ? "Edit mode" : "Preview"}</span></button><button className="manual-toolbar-label" onClick={saveVersion}><Save size={14} /><span>Save</span></button><button className="manual-publish-button" onClick={() => setNotice("Validation, store permission, and explicit approval are required before publishing.")}><ShieldCheck size={14} /><span>Publish</span></button></div>
    </header>

    <div className="manual-editor-context"><span><Sparkles size={13} /> {context.toolName}</span><span>{context.source}</span><span className="manual-context-finding">{context.finding}</span></div>

    <div className="manual-editor-body">
      <aside className={`manual-left-panel panel-${activePanel.toLowerCase()}`}>
        <nav className="manual-panel-tabs" aria-label="Editor left panel">{([{ label: "Add", icon: Plus }, { label: "Layers", icon: Layers3 }, { label: "Pages", icon: FilePlus2 }, { label: "Assets", icon: ImageIcon }, { label: "Components", icon: Component }] as const).map(item => { const Icon = item.icon; return <button className={activePanel === item.label ? "active" : ""} onClick={() => setActivePanel(item.label)} key={item.label}><Icon size={16} /><span>{item.label}</span></button>; })}</nav>
        <div className="manual-left-content">
          {activePanel === "Add" && <><div className="manual-panel-heading"><div><span>Add to page</span><h2>Elements</h2></div><button className="manual-icon-button"><Search size={15} /></button></div>{elementGroups.map(group => <section className="manual-add-group" key={group.title}><h3>{group.title}</h3><div>{group.items.map(item => { const Icon = item.icon; return <button onClick={() => addElement(item.kind, item.label)} key={item.label}><Icon size={15} /><span>{item.label}</span><Plus size={13} /></button>; })}</div></section>)}</>}
          {activePanel === "Layers" && <><div className="manual-panel-heading"><div><span>Document structure</span><h2>Layers</h2></div><button className="manual-icon-button" onClick={() => setSelectedId(pageId)}><MousePointer2 size={15} /></button></div><div className="manual-layer-root"><button className={selected.id === pageId ? "manual-layer-select selected root" : "manual-layer-select root"} onClick={() => setSelectedId(pageId)}><ChevronDown size={13} /><LayoutPanelTop size={13} /><span>Homepage</span></button>{renderLayerTree(pageId)}</div></>}
          {activePanel === "Pages" && <><div className="manual-panel-heading"><div><span>Website pages</span><h2>Pages</h2></div><button className="manual-icon-button" onClick={() => setNotice("New page creation will be saved to the selected project when project persistence is connected.")}><Plus size={15} /></button></div><div className="manual-page-list">{pages.map((page, index) => <button className={index === 0 ? "active" : ""} onClick={() => index === 0 ? setSelectedId(pageId) : setNotice(`${page} page is available for project editing after page persistence is connected.`)} key={page}><FilePlus2 size={15} /><span>{page}</span>{index === 0 && <Check size={14} />}</button>)}</div></>}
          {activePanel === "Assets" && <><div className="manual-panel-heading"><div><span>Reusable files</span><h2>Assets</h2></div><button className="manual-icon-button" onClick={() => setNotice("File upload opens here when the selected workspace has secure asset storage.")}><Upload size={15} /></button></div><button className="manual-upload-slot" onClick={() => setNotice("File upload is ready to connect to secure workspace storage.")}><Upload size={18} /><strong>Upload asset</strong><small>Image, video, SVG, font, or file</small></button><div className="manual-asset-grid">{assets.map((asset, index) => <button onClick={() => addElement("image", asset)} key={asset}><i className={`asset-shade shade-${index}`} /><span>{asset}</span></button>)}</div></>}
          {activePanel === "Components" && <><div className="manual-panel-heading"><div><span>Reusable building blocks</span><h2>Components</h2></div><button className="manual-icon-button" onClick={() => setNotice("Select any section and save it as a reusable component.")}><Plus size={15} /></button></div><div className="manual-component-list">{componentItems.map((item, index) => <button onClick={() => addElement(index < 2 ? "product" : "section", item)} key={item}><Component size={15} /><span><strong>{item}</strong><small>{index < 2 ? "Store-aware block" : "Reusable section"}</small></span><Plus size={13} /></button>)}</div></>}
        </div>
      </aside>

      <main className="manual-canvas-area">
        <div className="manual-canvas-toolbar"><div><span>{previewing ? "Preview mode" : "Edit mode"}</span><strong>{context.projectTitle}</strong></div><div className="manual-canvas-tools"><button className={gridEnabled ? "active" : ""} onClick={() => setGridEnabled(value => !value)}><Grid2X2 size={14} /> Grid</button><button className={guidesEnabled ? "active" : ""} onClick={() => setGuidesEnabled(value => !value)}><Ruler size={14} /> Guides</button><button><Maximize2 size={14} /> Fit</button></div></div>
        <div className="manual-canvas-stage">
          {guidesEnabled && <><i className="manual-guide vertical-guide" /><i className="manual-guide horizontal-guide" /></>}
          <article className={canvasClass} style={{ transform: `scale(${zoom / 100})` }}>
            <div className="canvas-browser"><i /><i /><i /><span>preview.your-store.com</span><em>{device}</em></div>
            {rootSections.filter(section => section.visible).map(section => <CanvasSection key={section.id} node={section} selectedId={selected.id} onSelect={setSelectedId} onDropElement={moveDraggedElement} children={children(section.id)} nestedChildren={children} textStyle={selectedTextStyle} />)}
          </article>
        </div>
      </main>

      <aside className={mobileInspector ? "manual-right-panel mobile-open" : "manual-right-panel"}>
        <div className="manual-inspector-heading"><div><span>{selected.kind === "page" ? "Page settings" : `${selected.kind} selected`}</span><h2>{selected.name}</h2></div><button className="manual-mobile-inspector-close" onClick={() => setMobileInspector(false)}><XMark /></button></div>
        <nav className="manual-inspector-tabs">{(["Design", "Responsive", "Content", "Advanced"] as InspectorTab[]).map(tab => <button className={inspectorTab === tab ? "active" : ""} onClick={() => setInspectorTab(tab)} key={tab}>{tab}</button>)}</nav>
        <div className="manual-inspector-content">
          {inspectorTab === "Design" && <><InspectorSection title="Layout"><ControlRow label="Width" value={selected.style.width ?? "Auto"} control={<select value={selected.style.width ?? "Auto"} onChange={event => updateSelected({ style: { width: event.target.value } })}><option>Auto</option><option>Full width</option><option>Contained</option><option>Custom</option></select>} /><ControlRow label="Padding" value={`${selected.style.padding ?? 0}px`} control={<input type="range" min="0" max="96" value={selected.style.padding ?? 0} onChange={event => updateSelected({ style: { padding: Number(event.target.value) } })} />} /><ControlRow label="Radius" value={`${selected.style.radius ?? 0}px`} control={<input type="range" min="0" max="32" value={selected.style.radius ?? 0} onChange={event => updateSelected({ style: { radius: Number(event.target.value) } })} />} /></InspectorSection><InspectorSection title="Appearance"><ControlRow label="Fill" value={selected.style.background ?? "None"} control={<input type="color" value={colorValue(selected.style.background, "#173b8f")} onChange={event => updateSelected({ style: { background: event.target.value } })} />} /><ControlRow label="Text" value={selected.style.color ?? "Default"} control={<input type="color" value={colorValue(selected.style.color, "#172039")} onChange={event => updateSelected({ style: { color: event.target.value } })} />} /><ControlRow label="Opacity" value={`${Math.round((selected.style.opacity ?? 1) * 100)}%`} control={<input type="range" min="20" max="100" value={(selected.style.opacity ?? 1) * 100} onChange={event => updateSelected({ style: { opacity: Number(event.target.value) / 100 } })} />} /></InspectorSection></>}
          {inspectorTab === "Responsive" && <><InspectorSection title="Current breakpoint"><div className="manual-breakpoints">{(["Desktop", "Tablet", "Mobile"] as EditorDevice[]).map(item => <button className={device === item ? "active" : ""} onClick={() => setDevice(item)} key={item}>{item}</button>)}</div></InspectorSection><InspectorSection title="Visibility"><div className="manual-visibility-row"><span>Show on this device</span><button className={selected.visible ? "manual-toggle active" : "manual-toggle"} onClick={() => updateSelected({ visible: !selected.visible })}><i /></button></div><p className="manual-property-note">Breakpoint-specific values are stored with the selected element when the project persistence layer is connected.</p></InspectorSection><InspectorSection title="Viewport"><ControlRow label="Mode" value={device} control={<select value={device} onChange={event => setDevice(event.target.value as EditorDevice)}><option>Desktop</option><option>Tablet</option><option>Mobile</option></select>} /><ControlRow label="Custom" value="Add" control={<button className="manual-inline-action" onClick={() => setNotice("Custom breakpoints can be added to this project’s responsive profile.")}>Add breakpoint</button>} /></InspectorSection></>}
          {inspectorTab === "Content" && <><InspectorSection title="Content"><label className="manual-field-label">{selected.kind === "text" ? "Text" : selected.kind === "button" ? "Button label" : "Element label"}<textarea value={selected.content ?? ""} onChange={event => updateSelected({ content: event.target.value })} disabled={selected.locked} /></label></InspectorSection><InspectorSection title="Typography"><ControlRow label="Size" value={`${selected.style.fontSize ?? 14}px`} control={<input type="range" min="10" max="72" value={selected.style.fontSize ?? 14} onChange={event => updateSelected({ style: { fontSize: Number(event.target.value) } })} />} /><ControlRow label="Font" value="Inter" control={<select><option>Inter</option><option>Space Grotesk</option><option>System serif</option></select>} /></InspectorSection><button className="manual-ai-inline" onClick={() => onModeChange("AI proposal")}><Sparkles size={15} /><span>Ask AI about this element</span><ChevronRight size={14} /></button></>}
          {inspectorTab === "Advanced" && <><InspectorSection title="Element"><ControlRow label="Position" value="Relative" control={<select><option>Static</option><option>Relative</option><option>Absolute</option><option>Fixed</option><option>Sticky</option></select>} /><ControlRow label="Layer" value="0" control={<input type="number" defaultValue="0" />} /></InspectorSection><InspectorSection title="Actions"><button className="manual-advanced-option"><Code2 size={14} /> Custom CSS <ChevronRight size={14} /></button><button className="manual-advanced-option"><ShieldCheck size={14} /> Accessibility <ChevronRight size={14} /></button><button className="manual-advanced-option"><Wand2 size={14} /> Interactions <ChevronRight size={14} /></button></InspectorSection></>}
        </div>
        <footer className="manual-layer-actions"><button onClick={() => updateSelected({ locked: !selected.locked })} aria-label={selected.locked ? "Unlock selected element" : "Lock selected element"}>{selected.locked ? <LockKeyhole size={15} /> : <Lock size={15} />}</button><button onClick={() => updateSelected({ visible: !selected.visible })} aria-label={selected.visible ? "Hide selected element" : "Show selected element"}>{selected.visible ? <Eye size={15} /> : <EyeOff size={15} />}</button><button onClick={duplicateSelected} aria-label="Duplicate selected element"><Copy size={15} /></button><button onClick={() => moveSelected("up")} aria-label="Move selected element up"><ArrowUp size={15} /></button><button onClick={() => moveSelected("down")} aria-label="Move selected element down"><ArrowDown size={15} /></button><button className="danger" onClick={deleteSelected} aria-label="Delete selected element"><Trash2 size={15} /></button></footer>
      </aside>
    </div>

    <footer className="manual-editor-statusbar"><div><span className="manual-save-state"><Check size={13} /> {savedState}</span><span>{device} · {zoom}%</span><span>{gridEnabled ? "Grid on" : "Grid off"}</span><span>Selected: {selected.name}</span></div><div><button onClick={() => setMobileInspector(true)}><Settings2 size={14} /> Properties</button><button onClick={saveVersion}><RotateCcw size={14} /> {versions.length} versions</button><button onClick={() => setNotice("Validation review checks responsive, accessibility, content, and release requirements before publishing.")}><ShieldCheck size={14} /> Validate</button></div></footer>
    {mode === "AI proposal" && <section className="manual-ai-proposal"><div><span><Sparkles size={15} /> AI proposal mode</span><strong>Review changes before applying them.</strong><p>{context.recommendation}</p></div><div><button className="manual-toolbar-label" onClick={() => onModeChange("Manual")}>Return to manual</button><button className="manual-publish-button" onClick={() => setNotice("AI changes remain a reviewable proposal until you approve individual changes.")}>Review proposal <ChevronRight size={15} /></button></div></section>}
    {notice && <div className="manual-editor-notice" role="status"><Check size={15} /> <span>{notice}</span><button onClick={() => setNotice("")}>Dismiss</button></div>}
  </section>;
}

function CanvasSection({ node, selectedId, onSelect, onDropElement, children, nestedChildren, textStyle }: { node: EditorNode; selectedId: string; onSelect: (id: string) => void; onDropElement: (targetParentId: string) => void; children: EditorNode[]; nestedChildren: (id: string) => EditorNode[]; textStyle: { color?: string; fontSize: string; opacity: number } }) {
  const selected = selectedId === node.id;
  const findNode = (id: string) => children.find(item => item.id === id) ?? nestedChildren(id)[0];
  const heading = nestedChildren("hero-copy").find(item => item.id === "hero-heading");
  const description = nestedChildren("hero-copy").find(item => item.id === "hero-description");
  const cta = nestedChildren("hero-copy").find(item => item.id === "hero-cta");
  const headerLogo = nestedChildren("header").find(item => item.id === "header-logo");
  const headerNavigation = nestedChildren("header").find(item => item.id === "header-navigation");
  const extraChildren = [...children, ...nestedChildren("hero-copy")].filter(item => !["header-logo", "header-navigation", "hero-copy", "hero-heading", "hero-description", "hero-cta", "hero-image", "products-heading", "product-grid"].includes(item.id) && item.visible);
  if (node.id === "header") return <section className={selected ? "manual-canvas-section selected" : "manual-canvas-section canvas-header"} onDragOver={event => event.preventDefault()} onDrop={() => onDropElement(node.id)} onClick={() => onSelect(node.id)}><div className="canvas-header-inner"><button className={selectedId === headerLogo?.id ? "canvas-node selected" : "canvas-node"} onClick={event => { event.stopPropagation(); if (headerLogo) onSelect(headerLogo.id); }}><strong>{headerLogo?.content ?? "NOVA"}</strong></button><button className={selectedId === headerNavigation?.id ? "canvas-node selected" : "canvas-node"} onClick={event => { event.stopPropagation(); if (headerNavigation) onSelect(headerNavigation.id); }}><span>{headerNavigation?.content}</span></button><i /></div></section>;
  if (node.id === "hero") return <section className={selected ? "manual-canvas-section selected canvas-hero" : "manual-canvas-section canvas-hero"} onDragOver={event => event.preventDefault()} onDrop={() => onDropElement(node.id)} onClick={() => onSelect(node.id)}><div className="canvas-hero-copy"><span className="canvas-kicker">NEW SEASON</span><button className={selectedId === heading?.id ? "canvas-node canvas-heading selected" : "canvas-node canvas-heading"} onClick={event => { event.stopPropagation(); if (heading) onSelect(heading.id); }} style={selectedId === heading?.id ? textStyle : undefined}>{(heading?.content ?? "Designed to feel\nlike your own.").split("\n").map(line => <span key={line}>{line}</span>)}</button><button className={selectedId === description?.id ? "canvas-node canvas-description selected" : "canvas-node canvas-description"} onClick={event => { event.stopPropagation(); if (description) onSelect(description.id); }} style={selectedId === description?.id ? textStyle : undefined}>{description?.content}</button><button className={selectedId === cta?.id ? "canvas-node canvas-cta selected" : "canvas-node canvas-cta"} onClick={event => { event.stopPropagation(); if (cta) onSelect(cta.id); }} style={{ background: cta?.style.background, color: cta?.style.color, borderRadius: cta?.style.radius }}>{cta?.content}</button>{extraChildren.map(child => <button className={selectedId === child.id ? "canvas-inserted-node selected" : "canvas-inserted-node"} onClick={event => { event.stopPropagation(); onSelect(child.id); }} key={child.id}>{child.kind === "shape" || child.kind === "vector" ? <i style={{ background: child.style.background }} /> : <span>{child.content ?? child.name}</span>}</button>)}</div><button className={selectedId === "hero-image" ? "canvas-product-object selected" : "canvas-product-object"} onClick={event => { event.stopPropagation(); onSelect("hero-image"); }}><div className="canvas-object-shadow" /><div className="canvas-object-shape" /><span>Selected image</span></button></section>;
  if (node.id === "products") return <section className={selected ? "manual-canvas-section selected canvas-products" : "manual-canvas-section canvas-products"} onDragOver={event => event.preventDefault()} onDrop={() => onDropElement(node.id)} onClick={() => onSelect(node.id)}><button className={selectedId === "products-heading" ? "canvas-node canvas-products-heading selected" : "canvas-node canvas-products-heading"} onClick={event => { event.stopPropagation(); onSelect("products-heading"); }}>Made for the everyday</button><button className={selectedId === "product-grid" ? "canvas-product-grid selected" : "canvas-product-grid"} onClick={event => { event.stopPropagation(); onSelect("product-grid"); }}>{["Clay vessel", "Field towel", "Carry case"].map((item, index) => <span key={item}><i className={`product-tile tile-${index}`} /><b>{item}</b><small>${index === 0 ? "$48" : index === 1 ? "$28" : "$34"}</small></span>)}</button>{children.filter(item => !["products-heading", "product-grid"].includes(item.id) && item.visible).map(child => <button className={selectedId === child.id ? "canvas-inserted-node selected" : "canvas-inserted-node"} onClick={event => { event.stopPropagation(); onSelect(child.id); }} key={child.id}>{child.kind === "shape" || child.kind === "vector" ? <i style={{ background: child.style.background }} /> : <span>{child.content ?? child.name}</span>}</button>)}</section>;
  return <section className={selected ? "manual-canvas-section selected canvas-footer" : "manual-canvas-section canvas-footer"} onDragOver={event => event.preventDefault()} onDrop={() => onDropElement(node.id)} onClick={() => onSelect(node.id)}><strong>NOVA</strong><span>Made for a slower everyday.</span></section>;
}

function InspectorSection({ title, children }: { title: string; children: React.ReactNode }) {
  return <section className="manual-inspector-section"><h3>{title}<ChevronDown size={14} /></h3>{children}</section>;
}

function ControlRow({ label, value, control }: { label: string; value: string; control: React.ReactNode }) {
  return <label className="manual-control-row"><span>{label}<small>{value}</small></span>{control}</label>;
}

function colorValue(value: string | undefined, fallback: string) {
  return value?.startsWith("#") ? value : fallback;
}

function XMark() { return <span aria-hidden="true">×</span>; }
