import React, { FC, ReactNode, useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { SupaBaseClientFunction } from '../lib/SupaBase/SupaBaseClient';

export type UserRole = 'SuperAdmin' | 'School';

export interface ProtectedRouteProps {
  children: ReactNode;
  allowedRoles?: UserRole[];
  loginHref?: string;
  unauthorizedHref?: string;
}

interface ProfileRoleRow {
  role: UserRole | null;
}

const DEFAULT_ALLOWED_ROLES: UserRole[] = ['SuperAdmin', 'School'];

const ROLE_DASHBOARD_MAP: Record<UserRole, string> = {
  SuperAdmin: '/super-admin-dashboard',
  School: '/school-admin-dashboard',
};

export const ProtectedRoute: FC<ProtectedRouteProps> = ({
  children,
  allowedRoles = DEFAULT_ALLOWED_ROLES,
  loginHref = '/',
  unauthorizedHref = '/unauthorized',
}) => {
  const [authorized, setAuthorized] = useState<boolean>(false);
  const [checking, setChecking] = useState<boolean>(true);
  const [statusText, setStatusText] = useState<string>('Checking session & permissions...');

  useEffect(() => {
    let isMounted = true;

    const verifyAccess = async (): Promise<void> => {
      try {
        const supabase = SupaBaseClientFunction();

        const { data: userData, error: userError } = await supabase.auth.getUser();
        if (userError || !userData.user) {
          if (isMounted) {
            window.location.href = loginHref;
          }
          return;
        }

        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', userData.user.id)
          .single<ProfileRoleRow>();

        if (profileError || !profile?.role) {
          if (isMounted) {
            setStatusText('Unable to verify role. Redirecting...');
            setTimeout(() => {
              if (isMounted) {
                window.location.href = unauthorizedHref;
              }
            }, 1000);
          }
          return;
        }

        const hasAccess = allowedRoles.includes(profile.role);

        if (!hasAccess) {
          // Send user to their own dashboard if they hold a valid role on a restricted route
          const fallbackDashboard = ROLE_DASHBOARD_MAP[profile.role] ?? unauthorizedHref;
          if (isMounted) {
            setStatusText('Role restricted for this page. Redirecting...');
            setTimeout(() => {
              if (isMounted) {
                window.location.href = fallbackDashboard;
              }
            }, 1000);
          }
          return;
        }

        if (isMounted) {
          setAuthorized(true);
          setChecking(false);
        }
      } catch {
        if (isMounted) {
          window.location.href = loginHref;
        }
      }
    };

    void verifyAccess();

    return () => {
      isMounted = false;
    };
  }, [allowedRoles, loginHref, unauthorizedHref]);

  if (checking) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, y: 12, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.3, ease: 'easeOut' }}
          className="max-w-sm w-full bg-white rounded-2xl shadow-xl border border-slate-100 p-6 flex flex-col items-center gap-3 text-center"
        >
          <svg
            className="animate-spin h-6 w-6 text-indigo-600"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
          <p className="text-sm font-medium text-slate-700">{statusText}</p>
        </motion.div>
      </div>
    );
  }

  if (!authorized) {
    return null;
  }

  return <>{children}</>;
};

export default ProtectedRoute;