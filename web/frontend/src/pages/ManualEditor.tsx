import { useEffect, useMemo, useRef, useState } from "react";
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
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from "../components/ui/drawer";
import { useIsMobile } from "../hooks/useMobile";
import "./manualEditor.css";

type EditorDevice = "Desktop" | "Tablet" | "Mobile";
type EditorPanel = "Add" | "Layers" | "Pages" | "Assets" | "Components";
type InspectorTab = "Design" | "Layout" | "Responsive" | "Content" | "Advanced";
type MobileSheet = "library" | "properties" | "ai" | "more" | null;
type NodeKind = "page" | "section" | "container" | "text" | "button" | "image" | "product" | "shape" | "vector";

type EditorStyle = {
  color?: string;
  background?: string;
  fontSize?: number;
  width?: string;
  padding?: number;
  radius?: number;
  opacity?: number;
};

type EditorNode = {
  id: string;
  parentId: string | null;
  name: string;
  kind: NodeKind;
  visible: boolean;
  locked: boolean;
  content?: string;
  style: EditorStyle;
  responsive?: Partial<Record<EditorDevice, Partial<EditorStyle>>>;
};

type Version = { id: string; label: string; createdAt: string; nodeCount: number };
type Point = { x: number; y: number };
type VectorPath = { id: string; label: string; points: Point[]; kind: "pen" | "pencil"; stroke: string; fill: string; closed?: boolean };
type DrawingTool = "select" | "pen" | "pencil";
type EditorDocument = { nodes: EditorNode[]; vectorPaths: VectorPath[] };

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
  initialPanel?: EditorPanel;
  initialInspectorTab?: InspectorTab;
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
const initialPages = ["Homepage", "Product details", "Collection", "Cart", "About"];

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

export default function ManualEditor({ context, mode, onModeChange, onBack, initialPanel = "Layers", initialInspectorTab = "Design" }: ManualEditorProps) {
  const isMobileViewport = useIsMobile();
  const initializedDevice = useRef(false);
  const [nodes, setNodes] = useState<EditorNode[]>(initialNodes);
  const [history, setHistory] = useState<EditorDocument[]>([{ nodes: initialNodes, vectorPaths: [] }]);
  const [historyIndex, setHistoryIndex] = useState(0);
  const [selectedId, setSelectedId] = useState("hero-heading");
  const [activePanel, setActivePanel] = useState<EditorPanel>(initialPanel);
  const [inspectorTab, setInspectorTab] = useState<InspectorTab>(initialInspectorTab);
  const [device, setDevice] = useState<EditorDevice>("Desktop");
  const [zoom, setZoom] = useState(74);
  const [gridEnabled, setGridEnabled] = useState(true);
  const [guidesEnabled, setGuidesEnabled] = useState(true);
  const [previewing, setPreviewing] = useState(false);
  const [savedState, setSavedState] = useState("Saved locally");
  const [versions, setVersions] = useState<Version[]>([{ id: "version-1", label: "Homepage baseline", createdAt: "Current draft", nodeCount: initialNodes.length }]);
  const [notice, setNotice] = useState("");
  const [mobileInspector, setMobileInspector] = useState(false);
  const [mobileSheet, setMobileSheet] = useState<MobileSheet>(null);
  const [addSearch, setAddSearch] = useState("");
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [projectPages, setProjectPages] = useState(initialPages);
  const [activePage, setActivePage] = useState("Homepage");
  const [assetItems, setAssetItems] = useState<{ id: string; name: string; url?: string; type: "generated" | "upload" }[]>(assets.map((name, index) => ({ id: `asset-${index}`, name, type: "generated" })));
  const [savedComponents, setSavedComponents] = useState<string[]>([]);
  const assetInputRef = useRef<HTMLInputElement>(null);
  const [drawingTool, setDrawingTool] = useState<DrawingTool>("select");
  const [vectorPaths, setVectorPaths] = useState<VectorPath[]>([]);
  const [draftPoints, setDraftPoints] = useState<Point[]>([]);
  const [isDrawing, setIsDrawing] = useState(false);
  const [selectedVectorPoint, setSelectedVectorPoint] = useState<number | null>(null);
  const [comparisonOpen, setComparisonOpen] = useState(false);
  const [validationOpen, setValidationOpen] = useState(false);
  const [validationReviewed, setValidationReviewed] = useState(false);
  const [releaseOpen, setReleaseOpen] = useState(false);

  const selected = nodes.find(node => node.id === selectedId) ?? nodes[0]!;
  const selectedStyle = { ...selected.style, ...(selected.responsive?.[device] ?? {}) };
  const byParent = useMemo(() => nodes.reduce<Record<string, EditorNode[]>>((map, node) => { if (node.parentId) (map[node.parentId] ??= []).push(node); return map; }, {}), [nodes]);
  const rootSections = byParent[pageId] ?? [];
  const selectedSection = selected.kind === "section" || selected.kind === "page" ? selected.id : selected.parentId ?? "hero";
  const children = (id: string) => byParent[id] ?? [];
  const filteredElementGroups = useMemo(() => {
    const query = addSearch.trim().toLowerCase();
    if (!query) return elementGroups;
    return elementGroups.map(group => ({ ...group, items: group.items.filter(item => item.label.toLowerCase().includes(query) || group.title.toLowerCase().includes(query)) })).filter(group => group.items.length > 0);
  }, [addSearch]);

  useEffect(() => {
    window.localStorage.setItem("ferixrg-manual-editor-draft", JSON.stringify({ nodes, vectorPaths, selectedId, device, updatedAt: Date.now() }));
  }, [nodes, vectorPaths, selectedId, device]);

  useEffect(() => {
    if (!initializedDevice.current && isMobileViewport) {
      setDevice("Mobile");
      initializedDevice.current = true;
    }
  }, [isMobileViewport]);

  const commit = (nextNodes: EditorNode[], label = "Draft updated", nextVectorPaths = vectorPaths) => {
    const nextDocument = { nodes: nextNodes, vectorPaths: nextVectorPaths };
    const nextHistory = [...history.slice(0, historyIndex + 1), nextDocument];
    setNodes(nextNodes);
    setVectorPaths(nextVectorPaths);
    setHistory(nextHistory);
    setHistoryIndex(nextHistory.length - 1);
    setSavedState(label);
  };
  const updateSelected = (patch: Partial<EditorNode> | { style: Partial<EditorNode["style"]> }) => {
    if (selected.locked) { setNotice("Unlock this layer before editing it."); return; }
    commit(nodes.map(node => node.id === selected.id ? { ...node, ...patch, style: "style" in patch ? { ...node.style, ...patch.style } : node.style } : node));
  };
  const updateCurrentDeviceStyle = (style: Partial<EditorStyle>) => {
    if (selected.locked) { setNotice("Unlock this layer before editing it."); return; }
    commit(nodes.map(node => node.id === selected.id ? { ...node, responsive: { ...node.responsive, [device]: { ...node.responsive?.[device], ...style } } } : node));
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
  const undo = () => { if (historyIndex === 0) return; const nextIndex = historyIndex - 1; const previous = history[nextIndex]!; setHistoryIndex(nextIndex); setNodes(previous.nodes); setVectorPaths(previous.vectorPaths); setSavedState("Draft restored from history"); };
  const redo = () => { if (historyIndex >= history.length - 1) return; const nextIndex = historyIndex + 1; const following = history[nextIndex]!; setHistoryIndex(nextIndex); setNodes(following.nodes); setVectorPaths(following.vectorPaths); setSavedState("Draft restored from history"); };
  const saveVersion = () => { const version = { id: `version-${Date.now()}`, label: `Version ${versions.length + 1}`, createdAt: "Saved just now", nodeCount: nodes.length }; setVersions([version, ...versions]); setSavedState("Version saved locally"); setNotice("A local version was created. It can be compared or restored when persistent project storage is connected."); };
  const createPage = () => { const name = `New page ${projectPages.length + 1}`; setProjectPages(current => [...current, name]); setActivePage(name); setNotice(`${name} was created as a local project page.`); };
  const uploadAsset = (file: File | undefined) => { if (!file) return; const asset = { id: `upload-${Date.now()}`, name: file.name, url: URL.createObjectURL(file), type: "upload" as const }; setAssetItems(current => [asset, ...current]); setNotice(`${file.name} was added to this browser’s local asset library.`); };
  const saveSelectedAsComponent = () => { const componentName = `${selected.name} component`; if (savedComponents.includes(componentName)) { setNotice(`${componentName} is already in the local component library.`); return; } setSavedComponents(current => [componentName, ...current]); setNotice(`${componentName} was saved for reuse in this local project draft.`); };
  const pointFromEvent = (event: React.PointerEvent<SVGSVGElement>): Point => { const box = event.currentTarget.getBoundingClientRect(); return { x: Math.max(0, Math.min(860, ((event.clientX - box.left) / box.width) * 860)), y: Math.max(0, Math.min(525, ((event.clientY - box.top) / box.height) * 525)) }; };
  const startDrawing = (event: React.PointerEvent<SVGSVGElement>) => { if (drawingTool === "select") return; const point = pointFromEvent(event); if (drawingTool === "pen") { setDraftPoints(current => [...current, point]); return; } setDraftPoints([point]); setIsDrawing(true); event.currentTarget.setPointerCapture(event.pointerId); };
  const continueDrawing = (event: React.PointerEvent<SVGSVGElement>) => { if (!isDrawing || drawingTool !== "pencil") return; const point = pointFromEvent(event); setDraftPoints(current => { const previous = current[current.length - 1]; return previous && Math.hypot(previous.x - point.x, previous.y - point.y) < 2 ? current : [...current, point]; }); };
  const finishDrawing = () => { if (!isDrawing || drawingTool !== "pencil") return; setIsDrawing(false); if (draftPoints.length > 1) saveVectorPath(draftPoints, "pencil"); };
  const saveVectorPath = (points: Point[], kind: "pen" | "pencil") => { if (points.length < 2) { setNotice("Add at least two nodes to create a path."); return; } const id = `vector-${Date.now()}`; const path = { id, label: `${kind === "pen" ? "Pen" : "Pencil"} path ${vectorPaths.length + 1}`, points, kind, stroke: "#315fc0", fill: "transparent" } satisfies VectorPath; commit([...nodes, { id, parentId: "hero", name: path.label, kind: "vector", visible: true, locked: false, content: "Custom vector path", style: { background: path.stroke } }], "Vector path added locally", [...vectorPaths, path]); setSelectedId(id); setDraftPoints([]); setDrawingTool("select"); setNotice(`${path.label} was added to the canvas and Layers.`); };
  const finishPenPath = () => { if (drawingTool !== "pen") return; saveVectorPath(draftPoints, "pen"); };
  const updateVectorPoint = (axis: "x" | "y", value: number) => { if (selected.kind !== "vector" || selectedVectorPoint === null) return; const nextPaths = vectorPaths.map(path => path.id !== selected.id ? path : { ...path, points: path.points.map((point, index) => index === selectedVectorPoint ? { ...point, [axis]: value } : point) }); commit(nodes, "Vector node updated locally", nextPaths); };
  const removeVectorPoint = () => { if (selected.kind !== "vector" || selectedVectorPoint === null) return; const nextPaths = vectorPaths.map(path => path.id !== selected.id ? path : { ...path, points: path.points.filter((_, index) => index !== selectedVectorPoint) }); commit(nodes, "Vector node removed locally", nextPaths); setSelectedVectorPoint(null); setNotice("Vector node removed. The change remains in your local draft history."); };
  const updateVectorPath = (patch: Partial<VectorPath>) => { if (selected.kind !== "vector") return; commit(nodes, "Vector path updated locally", vectorPaths.map(path => path.id === selected.id ? { ...path, ...patch } : path)); };
  const duplicateVectorPath = () => { const path = vectorPaths.find(item => item.id === selected.id); if (!path) return; const id = `vector-${Date.now()}`; const duplicate = { ...path, id, label: `${path.label} copy`, points: path.points.map(point => ({ x: Math.min(850, point.x + 14), y: Math.min(515, point.y + 14) })) }; commit([...nodes, { id, parentId: "hero", name: duplicate.label, kind: "vector", visible: true, locked: false, content: "Custom vector path", style: { background: duplicate.stroke } }], "Vector path duplicated locally", [...vectorPaths, duplicate]); setSelectedId(id); setNotice(`${duplicate.label} was added as an editable copy.`); };
  const deleteVectorPath = () => { if (selected.kind !== "vector") return; commit(nodes.filter(node => node.id !== selected.id), "Custom vector graphic removed locally", vectorPaths.filter(path => path.id !== selected.id)); setSelectedId("hero"); setSelectedVectorPoint(null); setNotice("Custom vector graphic removed from the local draft."); };
  const saveVectorGraphic = () => { const path = vectorPaths.find(item => item.id === selected.id); if (!path) return; const graphicName = `${path.label} graphic`; if (!savedComponents.includes(graphicName)) setSavedComponents(current => [graphicName, ...current]); setNotice(`${graphicName} was saved to the reusable local component library.`); };
  const openMobileLibrary = (panel: EditorPanel) => { setActivePanel(panel); setMobileInspector(false); setMobileSheet("library"); };
  const openMobileInspector = (tab: InspectorTab = "Content") => { setInspectorTab(tab); setMobileInspector(true); setMobileSheet("properties"); };
  const closeMobileSheet = () => { setMobileInspector(false); setMobileSheet(null); };

  const renderLayerTree = (parentId: string, depth = 0) => children(parentId).map(node => {
    const Icon = nodeIcon(node.kind);
    return <div className={draggedId === node.id ? "manual-layer-row is-dragging" : "manual-layer-row"} key={node.id} style={{ paddingLeft: 12 + depth * 13 }} onDragOver={event => event.preventDefault()} onDrop={() => moveDraggedElement(node.id)}><button className={selected.id === node.id ? "manual-layer-select selected" : "manual-layer-select"} draggable={!node.locked} onDragStart={() => setDraggedId(node.id)} onDragEnd={() => setDraggedId(null)} onClick={() => setSelectedId(node.id)}><GripVertical size={12} /><Icon size={13} /><span>{node.name}</span>{!node.visible && <EyeOff size={12} />}{node.locked && <Lock size={11} />}</button>{children(node.id).length > 0 && <div className="manual-layer-children">{renderLayerTree(node.id, depth + 1)}</div>}</div>;
  });

  const selectedTextStyle = { color: selectedStyle.color, fontSize: `${selectedStyle.fontSize ?? 14}px`, opacity: selectedStyle.opacity ?? 1 };
  const canvasClass = `manual-canvas-frame device-${device.toLowerCase()} ${previewing ? "is-previewing" : ""} ${gridEnabled ? "show-grid" : ""}`;
  const selectedVectorPath = vectorPaths.find(path => path.id === selected.id);
  const validationItems = [
    { label: "Responsive review", detail: `${device} layout is available for review`, state: selected.responsive?.[device] ? "Ready" : "Needs review" },
    { label: "Accessibility", detail: "Confirm image alternatives and heading order before release", state: "Needs review" },
    { label: "Content", detail: "Review links, calls to action, and dynamic content bindings", state: "Needs review" },
    { label: "Store permissions", detail: "A connected store and release approval are required", state: "Blocked" },
  ];

  return <section className="manual-editor" aria-label="FerixRG Manual Editor">
    <header className="manual-editor-topbar">
      <div className="manual-editor-brand"><button className="manual-icon-button" onClick={onBack} aria-label="Return to result"><ArrowLeft size={17} /></button><div><strong>FERIX<span>RG</span></strong><small>Manual Editor</small></div></div>
      <div className="manual-history-controls"><button className="manual-icon-button" disabled={historyIndex === 0} onClick={undo} aria-label="Undo"><Undo2 size={16} /></button><button className="manual-icon-button" disabled={historyIndex >= history.length - 1} onClick={redo} aria-label="Redo"><Redo2 size={16} /></button><button className="manual-toolbar-label" onClick={saveVersion}><RotateCcw size={14} /><span>Versions</span></button></div>
      <div className="manual-topbar-center"><div className="manual-device-control" aria-label="Preview device">{([{ label: "Desktop", icon: Monitor }, { label: "Tablet", icon: Tablet }, { label: "Mobile", icon: Smartphone }] as const).map(item => { const Icon = item.icon; return <button className={device === item.label ? "active" : ""} onClick={() => setDevice(item.label)} aria-pressed={device === item.label} key={item.label}><Icon size={14} /><span>{item.label}</span></button>; })}</div><div className="manual-zoom"><button onClick={() => setZoom(value => Math.max(45, value - 5))} aria-label="Zoom out"><ZoomOut size={14} /></button><span>{zoom}%</span><button onClick={() => setZoom(value => Math.min(100, value + 5))} aria-label="Zoom in"><ZoomIn size={14} /></button></div></div>
      <div className="manual-topbar-actions"><button className={previewing ? "manual-toolbar-label active" : "manual-toolbar-label"} onClick={() => setPreviewing(value => !value)}><Eye size={14} /><span>{previewing ? "Edit mode" : "Preview"}</span></button><button className="manual-toolbar-label" onClick={saveVersion}><Save size={14} /><span>Save</span></button><button className="manual-publish-button" onClick={() => setReleaseOpen(true)}><ShieldCheck size={14} /><span>Publish</span></button></div>
    </header>

    <div className="manual-editor-context"><span><Sparkles size={13} /> {context.toolName}</span><span>{context.source}</span><span className="manual-context-finding">{context.finding}</span></div>

    <div className="manual-editor-body">
      <aside className={`manual-left-panel panel-${activePanel.toLowerCase()} ${mobileSheet === "library" ? "mobile-open" : ""}`}>
        <nav className="manual-panel-tabs" aria-label="Editor left panel">{([{ label: "Add", icon: Plus }, { label: "Layers", icon: Layers3 }, { label: "Pages", icon: FilePlus2 }, { label: "Assets", icon: ImageIcon }, { label: "Components", icon: Component }] as const).map(item => { const Icon = item.icon; return <button className={activePanel === item.label ? "active" : ""} onClick={() => setActivePanel(item.label)} key={item.label}><Icon size={16} /><span>{item.label}</span></button>; })}</nav>
        <div className="manual-left-content">
          {activePanel === "Add" && <><div className="manual-panel-heading"><div><span>Add to page</span><h2>Elements</h2></div><button className="manual-mobile-panel-dismiss" onClick={closeMobileSheet} aria-label="Close add panel"><XMark /></button></div><label className="manual-add-search"><Search size={14} /><input value={addSearch} onChange={event => setAddSearch(event.target.value)} placeholder="Search components" aria-label="Search components" /></label>{filteredElementGroups.length ? filteredElementGroups.map(group => <section className="manual-add-group" key={group.title}><h3>{group.title}</h3><div>{group.items.map(item => { const Icon = item.icon; return <button onClick={() => addElement(item.kind, item.label)} key={item.label}><Icon size={15} /><span>{item.label}</span><Plus size={13} /></button>; })}</div></section>) : <p className="manual-empty-search">No matching components. Try another search.</p>}</>}
          {activePanel === "Layers" && <><div className="manual-panel-heading"><div><span>Document structure</span><h2>Layers</h2></div><button className="manual-mobile-panel-dismiss" onClick={closeMobileSheet} aria-label="Close layers panel"><XMark /></button></div><div className="manual-layer-root"><button className={selected.id === pageId ? "manual-layer-select selected root" : "manual-layer-select root"} onClick={() => setSelectedId(pageId)}><ChevronDown size={13} /><LayoutPanelTop size={13} /><span>Homepage</span></button>{renderLayerTree(pageId)}</div></>}
          {activePanel === "Pages" && <><div className="manual-panel-heading"><div><span>Website pages</span><h2>Pages</h2></div><div className="manual-panel-heading-actions"><button className="manual-icon-button" onClick={createPage} aria-label="Create page"><Plus size={15} /></button><button className="manual-mobile-panel-dismiss" onClick={closeMobileSheet} aria-label="Close pages panel"><XMark /></button></div></div><div className="manual-page-list">{projectPages.map(page => <button className={page === activePage ? "active" : ""} onClick={() => { setActivePage(page); if (page === "Homepage") setSelectedId(pageId); else setNotice(`${page} is selected. Its independent page canvas will persist when project page storage is connected.`); }} key={page}><FilePlus2 size={15} /><span>{page}</span>{page === activePage && <Check size={14} />}</button>)}</div></>}
          {activePanel === "Assets" && <><input ref={assetInputRef} className="manual-file-input" type="file" accept="image/*,video/*,.svg,.pdf,.txt,.woff,.woff2" onChange={event => { uploadAsset(event.target.files?.[0]); event.currentTarget.value = ""; }} /><div className="manual-panel-heading"><div><span>Reusable files</span><h2>Assets</h2></div><div className="manual-panel-heading-actions"><button className="manual-icon-button" onClick={() => assetInputRef.current?.click()} aria-label="Upload asset"><Upload size={15} /></button><button className="manual-mobile-panel-dismiss" onClick={closeMobileSheet} aria-label="Close assets panel"><XMark /></button></div></div><button className="manual-upload-slot" onClick={() => assetInputRef.current?.click()}><Upload size={18} /><strong>Upload asset</strong><small>Image, video, SVG, font, or file</small></button><div className="manual-asset-grid">{assetItems.map((asset, index) => <button onClick={() => addElement("image", asset.name)} key={asset.id}>{asset.url ? <img src={asset.url} alt="" /> : <i className={`asset-shade shade-${index % 5}`} />}<span>{asset.name}</span></button>)}</div></>}
          {activePanel === "Components" && <><div className="manual-panel-heading"><div><span>Reusable building blocks</span><h2>Components</h2></div><div className="manual-panel-heading-actions"><button className="manual-icon-button" onClick={saveSelectedAsComponent} aria-label="Save selected component"><Plus size={15} /></button><button className="manual-mobile-panel-dismiss" onClick={closeMobileSheet} aria-label="Close components panel"><XMark /></button></div></div><button className="manual-save-component" onClick={saveSelectedAsComponent}><Component size={15} /><span><strong>Save selected layer</strong><small>Reuse {selected.name} in this project</small></span><Plus size={13} /></button><div className="manual-component-list">{[...savedComponents, ...componentItems].map((item, index) => <button onClick={() => addElement(index < 2 || /product/i.test(item) ? "product" : "section", item)} key={item}><Component size={15} /><span><strong>{item}</strong><small>{savedComponents.includes(item) ? "Saved local component" : index < 2 ? "Store-aware block" : "Reusable section"}</small></span><Plus size={13} /></button>)}</div></>}
        </div>
      </aside>

      <main className="manual-canvas-area">
        <div className="manual-canvas-toolbar"><div><span>{previewing ? "Preview mode" : "Edit mode"}</span><strong>{context.projectTitle}</strong></div><div className="manual-canvas-tools"><button className={drawingTool === "select" ? "active" : ""} onClick={() => { setDrawingTool("select"); setDraftPoints([]); }}><MousePointer2 size={14} /> Select</button><button className={drawingTool === "pen" ? "active" : ""} onClick={() => { setDrawingTool("pen"); setDraftPoints([]); }}><PenTool size={14} /> Pen</button><button className={drawingTool === "pencil" ? "active" : ""} onClick={() => { setDrawingTool("pencil"); setDraftPoints([]); }}><Move size={14} /> Pencil</button>{drawingTool === "pen" && <button className="manual-canvas-confirm" onClick={finishPenPath}><Check size={14} /> Finish path</button>}<button className={gridEnabled ? "active" : ""} onClick={() => setGridEnabled(value => !value)}><Grid2X2 size={14} /> Grid</button><button className={guidesEnabled ? "active" : ""} onClick={() => setGuidesEnabled(value => !value)}><Ruler size={14} /> Guides</button><button><Maximize2 size={14} /> Fit</button></div></div>
        <div className="manual-canvas-stage">
          {guidesEnabled && <><i className="manual-guide vertical-guide" /><i className="manual-guide horizontal-guide" /></>}
          <article className={canvasClass} style={{ transform: `scale(${zoom / 100})` }}>
            <div className="canvas-browser"><i /><i /><i /><span>preview.your-store.com</span><em>{device}</em></div>
            {rootSections.filter(section => section.visible).map(section => <CanvasSection key={section.id} node={section} selectedId={selected.id} onSelect={setSelectedId} onDropElement={moveDraggedElement} children={children(section.id)} nestedChildren={children} textStyle={selectedTextStyle} />)}
            <svg className={drawingTool === "select" ? "manual-vector-overlay" : "manual-vector-overlay is-drawing"} viewBox="0 0 860 525" onPointerDown={startDrawing} onPointerMove={continueDrawing} onPointerUp={finishDrawing} onPointerLeave={finishDrawing} aria-label="Vector drawing canvas">
              {vectorPaths.map(path => <g key={path.id}><polyline points={pointList(path.closed ? [...path.points, path.points[0]!] : path.points)} fill={path.fill} stroke={path.stroke} strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" onPointerDown={event => { event.stopPropagation(); setSelectedId(path.id); setDrawingTool("select"); }} />{selected.id === path.id && path.points.map((point, index) => <circle key={`${path.id}-${index}`} cx={point.x} cy={point.y} r="8" className={selectedVectorPoint === index ? "manual-vector-node selected" : "manual-vector-node"} onPointerDown={event => { event.stopPropagation(); setSelectedVectorPoint(index); }} />)}</g>)}
              {draftPoints.length > 0 && <polyline points={pointList(draftPoints)} fill="none" stroke="#6aaeff" strokeWidth="4" strokeDasharray={drawingTool === "pen" ? "0" : "5 3"} strokeLinecap="round" strokeLinejoin="round" />}
            </svg>
          </article>
        </div>
      </main>

      <aside className={mobileInspector || mobileSheet === "properties" ? "manual-right-panel mobile-open" : "manual-right-panel"}>
        <div className="manual-inspector-heading"><div><span>{selected.kind === "page" ? "Page settings" : `${selected.kind} selected`}</span><h2>{selected.name}</h2></div><button className="manual-mobile-inspector-close" onClick={closeMobileSheet}><XMark /></button></div>
        <nav className="manual-inspector-tabs">{([{ value: "Content", desktop: "Content", mobile: "Text" }, { value: "Design", desktop: "Design", mobile: "Style" }, { value: "Layout", desktop: "Layout", mobile: "Layout" }, { value: "Responsive", desktop: "Responsive", mobile: "Device" }, { value: "Advanced", desktop: "Advanced", mobile: "Effects" }] as const).map(tab => <button className={inspectorTab === tab.value ? "active" : ""} onClick={() => setInspectorTab(tab.value)} key={tab.value}><span className="manual-tab-desktop">{tab.desktop}</span><span className="manual-tab-mobile">{tab.mobile}</span></button>)}</nav>
        <div className="manual-inspector-content">
          {inspectorTab === "Design" && <><InspectorSection title="Layout"><ControlRow label="Width" value={selectedStyle.width ?? "Auto"} control={<select value={selectedStyle.width ?? "Auto"} onChange={event => updateCurrentDeviceStyle({ width: event.target.value })}><option>Auto</option><option>Full width</option><option>Contained</option><option>Custom</option></select>} /><ControlRow label="Padding" value={`${selectedStyle.padding ?? 0}px`} control={<input type="range" min="0" max="96" value={selectedStyle.padding ?? 0} onChange={event => updateCurrentDeviceStyle({ padding: Number(event.target.value) })} />} /><ControlRow label="Radius" value={`${selectedStyle.radius ?? 0}px`} control={<input type="range" min="0" max="32" value={selectedStyle.radius ?? 0} onChange={event => updateCurrentDeviceStyle({ radius: Number(event.target.value) })} />} /></InspectorSection><InspectorSection title={`Appearance · ${device}`}><ControlRow label="Fill" value={selectedStyle.background ?? "None"} control={<input type="color" value={colorValue(selectedStyle.background, "#173b8f")} onChange={event => updateCurrentDeviceStyle({ background: event.target.value })} />} /><ControlRow label="Text" value={selectedStyle.color ?? "Default"} control={<input type="color" value={colorValue(selectedStyle.color, "#172039")} onChange={event => updateCurrentDeviceStyle({ color: event.target.value })} />} /><ControlRow label="Opacity" value={`${Math.round((selectedStyle.opacity ?? 1) * 100)}%`} control={<input type="range" min="20" max="100" value={(selectedStyle.opacity ?? 1) * 100} onChange={event => updateCurrentDeviceStyle({ opacity: Number(event.target.value) / 100 })} />} /></InspectorSection></>}
          {inspectorTab === "Layout" && <><InspectorSection title={`Layout · ${device}`}><ControlRow label="Display" value="Flex" control={<select><option>Block</option><option>Flex</option><option>Grid</option><option>Inline</option><option>None</option></select>} /><ControlRow label="Direction" value="Column" control={<select><option>Row</option><option>Column</option><option>Row reverse</option><option>Column reverse</option></select>} /><ControlRow label="Align" value="Start" control={<select><option>Start</option><option>Center</option><option>End</option><option>Stretch</option></select>} /><ControlRow label="Gap" value="16px" control={<input type="range" min="0" max="64" defaultValue="16" />} /></InspectorSection><InspectorSection title="Size & position"><ControlRow label="Width" value={selectedStyle.width ?? "Auto"} control={<select value={selectedStyle.width ?? "Auto"} onChange={event => updateCurrentDeviceStyle({ width: event.target.value })}><option>Auto</option><option>Full width</option><option>Contained</option><option>Custom</option></select>} /><ControlRow label="Position" value="Relative" control={<select><option>Static</option><option>Relative</option><option>Absolute</option><option>Fixed</option><option>Sticky</option></select>} /><ControlRow label="Overflow" value="Visible" control={<select><option>Visible</option><option>Hidden</option><option>Auto</option><option>Scroll</option></select>} /></InspectorSection><InspectorSection title="Spacing"><ControlRow label="Padding" value={`${selectedStyle.padding ?? 0}px`} control={<input type="range" min="0" max="96" value={selectedStyle.padding ?? 0} onChange={event => updateCurrentDeviceStyle({ padding: Number(event.target.value) })} />} /><ControlRow label="Margin" value="0px" control={<input type="range" min="0" max="96" defaultValue="0" />} /></InspectorSection></>}
          {inspectorTab === "Responsive" && <><InspectorSection title="Current breakpoint"><div className="manual-breakpoints">{(["Desktop", "Tablet", "Mobile"] as EditorDevice[]).map(item => <button className={device === item ? "active" : ""} onClick={() => setDevice(item)} key={item}>{item}</button>)}</div></InspectorSection><InspectorSection title="Visibility"><div className="manual-visibility-row"><span>Show on this device</span><button className={selected.visible ? "manual-toggle active" : "manual-toggle"} onClick={() => updateSelected({ visible: !selected.visible })}><i /></button></div><p className="manual-property-note">Breakpoint-specific values are stored with the selected element when the project persistence layer is connected.</p></InspectorSection><InspectorSection title="Viewport"><ControlRow label="Mode" value={device} control={<select value={device} onChange={event => setDevice(event.target.value as EditorDevice)}><option>Desktop</option><option>Tablet</option><option>Mobile</option></select>} /><ControlRow label="Custom" value="Add" control={<button className="manual-inline-action" onClick={() => setNotice("Custom breakpoints can be added to this project’s responsive profile.")}>Add breakpoint</button>} /></InspectorSection></>}
          {inspectorTab === "Content" && <><InspectorSection title="Content"><label className="manual-field-label">{selected.kind === "text" ? "Text" : selected.kind === "button" ? "Button label" : "Element label"}<textarea value={selected.content ?? ""} onChange={event => updateSelected({ content: event.target.value })} disabled={selected.locked} /></label></InspectorSection><InspectorSection title={`Typography · ${device}`}><ControlRow label="Size" value={`${selectedStyle.fontSize ?? 14}px`} control={<input type="range" min="10" max="72" value={selectedStyle.fontSize ?? 14} onChange={event => updateCurrentDeviceStyle({ fontSize: Number(event.target.value) })} />} /><ControlRow label="Font" value="Inter" control={<select><option>Inter</option><option>Space Grotesk</option><option>System serif</option></select>} /></InspectorSection><button className="manual-ai-inline" onClick={() => onModeChange("AI proposal")}><Sparkles size={15} /><span>Ask AI about this element</span><ChevronRight size={14} /></button></>}
          {inspectorTab === "Advanced" && <><InspectorSection title="Effects"><ControlRow label="Opacity" value={`${Math.round((selectedStyle.opacity ?? 1) * 100)}%`} control={<input type="range" min="20" max="100" value={(selectedStyle.opacity ?? 1) * 100} onChange={event => updateCurrentDeviceStyle({ opacity: Number(event.target.value) / 100 })} />} /><ControlRow label="Shadow" value="Soft" control={<select><option>None</option><option>Soft</option><option>Medium</option><option>Large</option></select>} /><ControlRow label="Animation" value="None" control={<select><option>None</option><option>Fade</option><option>Slide</option><option>Scale</option><option>Zoom</option></select>} /></InspectorSection><InspectorSection title="Interaction"><ControlRow label="Trigger" value="On click" control={<select><option>On click</option><option>On hover</option><option>On focus</option><option>On load</option><option>On scroll</option></select>} /><ControlRow label="Action" value="Open URL" control={<select><option>Open URL</option><option>Open page</option><option>Open modal</option><option>Scroll to section</option><option>Trigger animation</option></select>} /></InspectorSection>{selectedVectorPath && <InspectorSection title="Vector path"><p className="manual-property-note">{selectedVectorPath.kind === "pen" ? "Pen path" : "Pencil path"} · {selectedVectorPath.points.length} nodes · {selectedVectorPath.closed ? "Closed" : "Open"}</p><ControlRow label="Node" value={selectedVectorPoint === null ? "Choose" : `${selectedVectorPoint + 1}`} control={<select value={selectedVectorPoint ?? ""} onChange={event => setSelectedVectorPoint(event.target.value === "" ? null : Number(event.target.value))}><option value="">Choose a node</option>{selectedVectorPath.points.map((_, index) => <option value={index} key={index}>Node {index + 1}</option>)}</select>} />{selectedVectorPoint !== null && selectedVectorPath.points[selectedVectorPoint] && <><ControlRow label="X coordinate" value={`${Math.round(selectedVectorPath.points[selectedVectorPoint].x)}`} control={<input type="range" min="0" max="860" value={selectedVectorPath.points[selectedVectorPoint].x} onChange={event => updateVectorPoint("x", Number(event.target.value))} />} /><ControlRow label="Y coordinate" value={`${Math.round(selectedVectorPath.points[selectedVectorPoint].y)}`} control={<input type="range" min="0" max="525" value={selectedVectorPath.points[selectedVectorPoint].y} onChange={event => updateVectorPoint("y", Number(event.target.value))} />} /><button className="manual-inline-danger" onClick={removeVectorPoint}><Trash2 size={13} /> Remove node</button></>}<ControlRow label="Stroke" value={selectedVectorPath.stroke} control={<input type="color" value={selectedVectorPath.stroke} onChange={event => updateVectorPath({ stroke: event.target.value })} />} /><div className="manual-vector-actions"><button onClick={() => updateVectorPath({ closed: !selectedVectorPath.closed })}>{selectedVectorPath.closed ? "Open path" : "Close path"}</button><button onClick={duplicateVectorPath}>Duplicate</button><button onClick={saveVectorGraphic}>Save graphic</button><button className="danger" onClick={deleteVectorPath}>Delete</button></div></InspectorSection>}<InspectorSection title="Advanced actions"><button className="manual-advanced-option"><Code2 size={14} /> Custom CSS <ChevronRight size={14} /></button><button className="manual-advanced-option" onClick={() => setValidationOpen(true)}><ShieldCheck size={14} /> Accessibility <ChevronRight size={14} /></button><button className="manual-advanced-option"><Wand2 size={14} /> Timeline <ChevronRight size={14} /></button></InspectorSection></>}
        </div>
        <footer className="manual-layer-actions"><button onClick={() => updateSelected({ locked: !selected.locked })} aria-label={selected.locked ? "Unlock selected element" : "Lock selected element"}>{selected.locked ? <LockKeyhole size={15} /> : <Lock size={15} />}</button><button onClick={() => updateSelected({ visible: !selected.visible })} aria-label={selected.visible ? "Hide selected element" : "Show selected element"}>{selected.visible ? <Eye size={15} /> : <EyeOff size={15} />}</button><button onClick={duplicateSelected} aria-label="Duplicate selected element"><Copy size={15} /></button><button onClick={() => moveSelected("up")} aria-label="Move selected element up"><ArrowUp size={15} /></button><button onClick={() => moveSelected("down")} aria-label="Move selected element down"><ArrowDown size={15} /></button><button className="danger" onClick={deleteSelected} aria-label="Delete selected element"><Trash2 size={15} /></button></footer>
      </aside>
    </div>

    <div className="manual-mobile-context-toolbar" aria-label="Selected element actions"><span>{selected.name}</span><button onClick={() => openMobileInspector("Content")}>Edit</button><button onClick={() => openMobileInspector("Design")}>Style</button><button onClick={() => setNotice("Use Layers to move this element into a compatible container.")}>Move</button><button onClick={duplicateSelected}>Duplicate</button><button className="danger" onClick={deleteSelected}>Delete</button></div>
    <footer className="manual-editor-statusbar"><div><span className="manual-save-state"><Check size={13} /> {savedState}</span><span>{device} · {zoom}%</span><span>{gridEnabled ? "Grid on" : "Grid off"}</span><span>Selected: {selected.name}</span></div><div><button onClick={() => openMobileInspector("Content")}><Settings2 size={14} /> Properties</button><button onClick={saveVersion}><RotateCcw size={14} /> {versions.length} versions</button><button onClick={() => setComparisonOpen(true)}><Eye size={14} /> Compare</button><button onClick={() => setValidationOpen(true)}><ShieldCheck size={14} /> Validate</button></div></footer>
    <nav className="manual-mobile-studio-nav" aria-label="Mobile editor navigation"><button className={mobileSheet === null ? "active" : ""} onClick={closeMobileSheet}><MousePointer2 size={18} /><span>Select</span></button><button className={mobileSheet === "library" && activePanel === "Add" ? "active" : ""} onClick={() => openMobileLibrary("Add")}><Plus size={18} /><span>Add</span></button><button className={mobileSheet === "library" && activePanel === "Layers" ? "active" : ""} onClick={() => openMobileLibrary("Layers")}><Layers3 size={18} /><span>Layers</span></button><button className={mobileSheet === "ai" ? "active" : ""} onClick={() => { setMobileInspector(false); setMobileSheet("ai"); }}><Sparkles size={18} /><span>AI</span></button><button className={mobileSheet === "more" ? "active" : ""} onClick={() => { setMobileInspector(false); setMobileSheet("more"); }}><MoreHorizontal size={19} /><span>More</span></button></nav>
    <Drawer open={mobileSheet === "ai" || mobileSheet === "more"} onOpenChange={open => { if (!open) closeMobileSheet(); }}><DrawerContent className="manual-mobile-drawer">{mobileSheet === "ai" ? <><DrawerHeader><DrawerTitle>AI Design Copilot</DrawerTitle><p>Review a proposal before any change is applied.</p></DrawerHeader><div className="manual-mobile-drawer-content"><label className="manual-ai-prompt">What would you like to change?<textarea defaultValue={`Improve ${selected.name} while preserving the approved focus.`} /></label><button className="manual-ai-inline" onClick={() => onModeChange("AI proposal")}><Sparkles size={15} /><span>Analyze selected {selected.kind}</span><ChevronRight size={14} /></button><button className="manual-toolbar-label" onClick={() => { setComparisonOpen(true); closeMobileSheet(); }}><Eye size={14} /> Review proposal</button></div></> : <><DrawerHeader><DrawerTitle>Studio tools</DrawerTitle><p>Every editor capability remains available on mobile.</p></DrawerHeader><div className="manual-mobile-drawer-content manual-more-actions"><button onClick={() => { openMobileInspector("Responsive"); }}><Smartphone size={17} /><span><strong>Responsive</strong><small>{device} is active</small></span><ChevronRight size={15} /></button><button onClick={() => { saveVersion(); closeMobileSheet(); }}><RotateCcw size={17} /><span><strong>Versions</strong><small>{versions.length} local versions</small></span><ChevronRight size={15} /></button><button onClick={() => { setComparisonOpen(true); closeMobileSheet(); }}><Eye size={17} /><span><strong>Preview & compare</strong><small>Review before and after</small></span><ChevronRight size={15} /></button><button onClick={() => { setValidationOpen(true); closeMobileSheet(); }}><ShieldCheck size={17} /><span><strong>Validate</strong><small>Check before release</small></span><ChevronRight size={15} /></button><button onClick={() => { setReleaseOpen(true); closeMobileSheet(); }}><Save size={17} /><span><strong>Release</strong><small>Approval required</small></span><ChevronRight size={15} /></button></div></>}</DrawerContent></Drawer>
    {mode === "AI proposal" && <section className="manual-ai-proposal"><div><span><Sparkles size={15} /> AI proposal mode</span><strong>Review changes before applying them.</strong><p>{context.recommendation}</p></div><div><button className="manual-toolbar-label" onClick={() => onModeChange("Manual")}>Return to manual</button><button className="manual-publish-button" onClick={() => setNotice("AI changes remain a reviewable proposal until you approve individual changes.")}>Review proposal <ChevronRight size={15} /></button></div></section>}
    {comparisonOpen && <EditorModal title="Review before and after" onClose={() => setComparisonOpen(false)}><div className="manual-compare-grid"><div><span>Before</span><div className="manual-compare-scene before"><strong>Current</strong><i /><b>Original layout</b></div></div><div><span>After</span><div className="manual-compare-scene after"><strong>Proposal</strong><i /><b>Reviewable draft</b></div></div></div><p className="manual-modal-copy">The before state remains unchanged until you explicitly save a draft. This editor does not apply a proposal automatically.</p><button className="manual-publish-button" onClick={() => { setComparisonOpen(false); saveVersion(); }}>Save review version <Save size={14} /></button></EditorModal>}
    {validationOpen && <EditorModal title="Validation review" onClose={() => setValidationOpen(false)}><p className="manual-modal-copy">Validation is a review checklist. It does not publish changes or bypass store permissions.</p><div className="manual-validation-list">{validationItems.map(item => <div key={item.label}><span className={`validation-state ${item.state.toLowerCase().replace(" ", "-")}`}>{item.state}</span><strong>{item.label}</strong><small>{item.detail}</small></div>)}</div><div className="manual-modal-actions"><button className="manual-toolbar-label" onClick={() => setValidationOpen(false)}>Close</button><button className="manual-publish-button" onClick={() => { setValidationReviewed(true); setValidationOpen(false); setNotice("Validation review recorded locally. Store access and an approval request are still required for release."); }}>Record review <Check size={14} /></button></div></EditorModal>}
    {releaseOpen && <EditorModal title="Release approval" onClose={() => setReleaseOpen(false)}><p className="manual-modal-copy">Release remains blocked until this draft has a reviewed validation, a connected store with the required scope, and an explicit approval. No publish action is available here.</p><div className="manual-release-steps"><span className="done"><Check size={14} /> Draft saved locally</span><span className={validationReviewed ? "done" : "waiting"}>{validationReviewed ? <Check size={14} /> : <Circle size={14} />} Validation review {validationReviewed ? "recorded" : "required"}</span><span className="blocked"><Lock size={14} /> Store connection and permission required</span><span className="blocked"><Lock size={14} /> Explicit release approval required</span></div><div className="manual-modal-actions"><button className="manual-toolbar-label" onClick={() => setReleaseOpen(false)}>Return to editor</button><button className="manual-publish-button" disabled={!validationReviewed} onClick={() => { setReleaseOpen(false); setNotice("Release approval request prepared. Publishing remains unavailable until a permitted connected store confirms the approval."); }}>Request approval <ChevronRight size={14} /></button></div></EditorModal>}
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

function pointList(points: Point[]) {
  return points.map(point => `${point.x},${point.y}`).join(" ");
}

function EditorModal({ title, children, onClose }: { title: string; children: React.ReactNode; onClose: () => void }) {
  return <div className="manual-modal-backdrop" role="presentation"><section className="manual-editor-modal" role="dialog" aria-modal="true" aria-label={title}><header><div><span>Manual Editor</span><h2>{title}</h2></div><button className="manual-icon-button" onClick={onClose} aria-label="Close dialog"><XMark /></button></header>{children}</section></div>;
}

function XMark() { return <span aria-hidden="true">×</span>; }
