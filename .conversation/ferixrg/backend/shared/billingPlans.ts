export type FerixPlan = "free" | "starter" | "growth" | "enterprise";

export const billingPlans: Record<FerixPlan, { label: string; monthlyToolRuns: number | null; monthlyAiCredits: number | null; storageBytes: number | null; seats: number | null }> = {
  free: { label: "Free", monthlyToolRuns: 20, monthlyAiCredits: 0, storageBytes: 1_000_000_000, seats: 3 },
  starter: { label: "Starter", monthlyToolRuns: 150, monthlyAiCredits: 5_000, storageBytes: 10_000_000_000, seats: 10 },
  growth: { label: "Growth", monthlyToolRuns: 1_000, monthlyAiCredits: 50_000, storageBytes: 100_000_000_000, seats: 50 },
  enterprise: { label: "Enterprise", monthlyToolRuns: null, monthlyAiCredits: null, storageBytes: null, seats: null },
};

export function entitlementForPlan(plan: FerixPlan) {
  return billingPlans[plan];
}
