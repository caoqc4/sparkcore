import { loadProductRoleCollection } from "@/lib/product/roles";

export type ProductAppRouteResolution = {
  workspaceId: string;
  roleCount: number;
  roleId: string | null;
  href: string | null;
};

export async function resolveProductAppRoute(args: {
  supabase: any;
  userId: string;
}): Promise<ProductAppRouteResolution | null> {
  const roleCollection = await loadProductRoleCollection({
    supabase: args.supabase,
    userId: args.userId,
  });

  if (!roleCollection) {
    return null;
  }

  const roleId = roleCollection.recentRoleId;

  return {
    workspaceId: roleCollection.workspaceId,
    roleCount: roleCollection.roles.length,
    roleId,
    href: roleId ? `/app/${encodeURIComponent(roleId)}` : null,
  };
}
