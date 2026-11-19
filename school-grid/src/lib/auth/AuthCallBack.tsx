import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { SupaBaseClientFunction } from '../lib/SupaBaseClient/SupaBaseClientFunction';
import { resolveUserRoleAccess } from '../lib/auth/resolveUserRole';

/* Landing page for Google (OAuth) sign-in: /auth/callback */
export default function AuthCallback() {
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    const supabase = SupaBaseClientFunction();

    const finish = async (): Promise<void> => {
      try {
        // Supabase exchanges the code in the URL for a session automatically
        const { data, error: sessionError } = await supabase.auth.getSession();
        if (sessionError) throw sessionError;
        const user = data.session?.user;
        if (!user) throw new Error('Google sign-in did not return a session.');

        const { dashboardPath } = await resolveUserRoleAccess(
          user.id,
          user.user_metadata?.role,
          user.app_metadata?.role
        );
        if (active) navigate(dashboardPath, { replace: true });
      } catch (err) {
        if (active) setError(err instanceof Error ? err.message : 'Sign-in failed.');
      }
    };

    void finish();
    return () => {
      active = false;
    };
  }, [navigate]);

  return (
    <div className="flex min-h-dvh items-center justify-center bg-slate-50 p-4">
      <div className="flex w-full max-w-sm flex-col items-center gap-3 rounded-2xl border border-slate-100 bg-white p-6 text-center shadow-xl">
        {error ? (
          <>
            <p className="text-sm text-rose-700">{error}</p>
            <Link
              to="/login"
              replace
              className="inline-flex h-11 w-full items-center justify-center rounded-lg border border-slate-200 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              Back to login
            </Link>
          </>
        ) : (
          <>
            <Loader2 className="h-6 w-6 animate-spin text-indigo-600" />
            <p className="text-sm font-medium text-slate-700">Finishing sign-in...</p>
          </>
        )}
      </div>
    </div>
  );
}