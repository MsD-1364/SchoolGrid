/* One place for role names and dashboard routes.
   ROLES must match `user_roles.role_name` in Supabase.
   DASHBOARD_PATHS should match `app_roles.dashboard_path`. */
   export const ROLES = {
    SUPER_ADMIN: 'SuperAdmin',
    SCHOOL: 'School',
  } as const;
  
  export const DASHBOARD_PATHS = {
    SUPER_ADMIN: '/super-admin-dashboard',
    SCHOOL: '/school-admin-dashboard',
  } as const;