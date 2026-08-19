export type ConnectedStore = {
  id: string;
  name: string;
  platform: string;
  url: string;
  initials: string;
  health: number;
  drafts: number;
  openIssues: number;
  lastActivity: string;
  connection: "Connected" | "Needs attention";
};

export const connectedStores: ConnectedStore[] = [
  { id: "atelier-forma", name: "Atelier Forma", platform: "Shopify", url: "atelier-forma.example", initials: "AF", health: 82, drafts: 2, openIssues: 3, lastActivity: "Updated 4 min ago", connection: "Connected" },
  { id: "northlight-home", name: "Northlight Home", platform: "WooCommerce", url: "northlight-home.example", initials: "NH", health: 74, drafts: 1, openIssues: 5, lastActivity: "Updated yesterday", connection: "Connected" },
  { id: "modo-supply", name: "Modo Supply", platform: "Shopify", url: "modo-supply.example", initials: "MS", health: 68, drafts: 0, openIssues: 2, lastActivity: "Updated 3 days ago", connection: "Needs attention" },
];

export const storeQuickActions = [
  { id: "scan", title: "Analyse a storefront", description: "Start with a public URL or an already connected store.", toolId: "storefront-scan", icon: "scan" },
  { id: "evidence", title: "Review screenshots", description: "Use visual evidence when you want a focused review.", toolId: "screenshot-reviewer", icon: "evidence" },
  { id: "draft", title: "Continue a draft", description: "Return to a saved redesign and compare your options.", route: "Visual editor", icon: "draft" },
  { id: "connect", title: "Connect a store", description: "Add Shopify, WooCommerce, or a custom store API.", toolId: "store-publisher", icon: "connect" },
];

export const storeActivities = [
  { id: "a1", storeId: "atelier-forma", title: "Responsive draft saved", description: "Alternative B is ready to compare.", status: "Draft", time: "18 min ago", route: "Visual editor" },
  { id: "a2", storeId: "atelier-forma", title: "Mobile issue found", description: "Purchase action needs clearer hierarchy at 390px.", status: "Needs review", time: "4 min ago", route: "Issues" },
  { id: "a3", storeId: "northlight-home", title: "Storefront scan completed", description: "Five issues are ready for review.", status: "Complete", time: "Yesterday", toolId: "storefront-scan", route: "Tools Library" },
  { id: "a4", storeId: "modo-supply", title: "Connection needs attention", description: "Refresh the store connection before publishing.", status: "Connection", time: "3 days ago", toolId: "store-publisher", route: "Tools Library" },
];
