import { useCallback, useEffect, useState } from "react";
import { workspaceClient } from "./workspaceClient";

export type WorkspaceRecord = Record<string, any>;

export type RealWorkspaceData = {
  workspace: WorkspaceRecord | null;
  dashboard: WorkspaceRecord | null;
  stores: WorkspaceRecord[];
  runs: WorkspaceRecord[];
  issues: WorkspaceRecord[];
  reports: WorkspaceRecord[];
  drafts: WorkspaceRecord[];
  validations: WorkspaceRecord[];
  activity: WorkspaceRecord[];
  members: WorkspaceRecord[];
  profile: WorkspaceRecord | null;
  preferences: WorkspaceRecord | null;
  aiReadiness: WorkspaceRecord[];
  subscription: WorkspaceRecord | null;
  usageSummary: WorkspaceRecord | null;
  releases: WorkspaceRecord[];
};

const emptyData: RealWorkspaceData = { workspace: null, dashboard: null, stores: [], runs: [], issues: [], reports: [], drafts: [], validations: [], activity: [], members: [], profile: null, preferences: null, aiReadiness: [], subscription: null, usageSummary: null, releases: [] };

export function useWorkspaceData() {
  const [data, setData] = useState<RealWorkspaceData>(emptyData);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const bootstrap = await workspaceClient.workspace.bootstrap.query() as WorkspaceRecord;
      const workspace = (bootstrap?.workspace ?? bootstrap) as WorkspaceRecord;
      const workspaceId = Number(workspace?.id);
      if (!Number.isInteger(workspaceId) || workspaceId <= 0) throw new Error("Your workspace could not be initialized.");
      const [dashboard, stores, runs, issues, reports, drafts, validations, activity, members, profile, preferences, aiReadiness, subscription, usageSummary, releases] = await Promise.all([
        workspaceClient.workspace.dashboard.query({ workspaceId }),
        workspaceClient.workspace.stores.list.query({ workspaceId }),
        workspaceClient.workspace.toolRuns.query({ workspaceId, limit: 100 }),
        workspaceClient.workspace.issues.query({ workspaceId }),
        workspaceClient.workspace.reports.query({ workspaceId }),
        workspaceClient.workspace.drafts.query({ workspaceId }),
        workspaceClient.workspace.validationRuns.query({ workspaceId, limit: 100 }),
        workspaceClient.workspace.activity.query({ workspaceId, limit: 100 }),
        workspaceClient.workspace.members.query({ workspaceId }),
        workspaceClient.account.profile.query(),
        workspaceClient.account.preferences.query(),
        workspaceClient.workspace.aiProviderReadiness.query(),
        workspaceClient.workspace.subscription.query({ workspaceId }),
        workspaceClient.workspace.usageSummary.query({ workspaceId }),
        workspaceClient.workspace.releases.query({ workspaceId, limit: 100 }),
      ]);
      setData({ workspace, dashboard, stores, runs, issues, reports, drafts, validations, activity, members, profile, preferences, aiReadiness, subscription, usageSummary, releases });
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "We could not load your workspace.");
      setData(emptyData);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void refresh(); }, [refresh]);
  return { data, loading, error, refresh };
}
