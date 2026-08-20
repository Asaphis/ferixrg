import { getWorkspaceAccess, type WorkspaceRole } from "./db";

const roleRank: Record<WorkspaceRole, number> = {
  viewer: 1,
  billing: 2,
  editor: 3,
  admin: 4,
  owner: 5,
};

export async function requireWorkspaceAccess(userId: number, workspaceId: number, minimumRole: WorkspaceRole = "viewer") {
  const access = await getWorkspaceAccess(userId, workspaceId);
  if (!access || roleRank[access.membership.role] < roleRank[minimumRole]) {
    throw new Error("You do not have permission to access this workspace.");
  }
  return access;
}
