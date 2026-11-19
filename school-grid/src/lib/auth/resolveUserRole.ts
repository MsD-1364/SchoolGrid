import { SupaBaseClientFunction } from '../SupaBaseClient/SupaBaseClientFunction';

export type UserRole = string;

export interface ResolvedRoleAccess {
  role: UserRole;
  dashboardPath: string;
}

interface UserRoleJoinRow {
  role_name: string;
  app_roles:
    | {
        dashboard_path: string;
        is_active: boolean;
      }
    | {
        dashboard_path: string;
        is_active: boolean;
      }[]
    | null;
}

const isNonEmptyString = (value: unknown): value is string =>
  typeof value === 'string' && value.trim().length > 0;

export const resolveUserRoleAccess = async (
  userId: string,
  userMetadataRole?: unknown,
  appMetadataRole?: unknown
): Promise<ResolvedRoleAccess> => {
  const supabase = SupaBaseClientFunction();

  // 1. Look up user's assigned role and its configured dashboard_path from DB
  const { data, error } = await supabase
    .from('user_roles')
    .select(
      `
      role_name,
      app_roles (
        dashboard_path,
        is_active
      )
    `
    )
    .eq('user_id', userId)
    .single<UserRoleJoinRow>();

  if (!error && data?.role_name) {
    const roleConfig = Array.isArray(data.app_roles)
      ? data.app_roles[0]
      : data.app_roles;

    if (roleConfig && roleConfig.is_active && isNonEmptyString(roleConfig.dashboard_path)) {
      return {
        role: data.role_name,
        dashboardPath: roleConfig.dashboard_path,
      };
    }
  }

  // 2. Optional fallback if role is stored in app_metadata or user_metadata
  const metadataRole = isNonEmptyString(appMetadataRole)
    ? appMetadataRole.trim()
    : isNonEmptyString(userMetadataRole)
      ? userMetadataRole.trim()
      : null;

  if (metadataRole) {
    const { data: fallbackRoleRow } = await supabase
      .from('app_roles')
      .select('role_name, dashboard_path, is_active')
      .eq('role_name', metadataRole)
      .eq('is_active', true)
      .single<{ role_name: string; dashboard_path: string; is_active: boolean }>();

    if (fallbackRoleRow && isNonEmptyString(fallbackRoleRow.dashboard_path)) {
      return {
        role: fallbackRoleRow.role_name,
        dashboardPath: fallbackRoleRow.dashboard_path,
      };
    }
  }

  throw new Error('No active role or dashboard route is configured for this account.');
};