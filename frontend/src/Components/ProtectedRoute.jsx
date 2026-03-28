import { Navigate, useLocation } from "react-router-dom";
import { useEffect, useState } from "react";
import { BASE_URL } from "../../config";
import { ShieldOff } from "lucide-react";

/**
 * ProtectedRoute
 * @param {ReactNode} children      - The page to render if access is granted
 * @param {string[]}  allowedRoles  - Optional list of roles that may access this route.
 *                                    If omitted, any logged-in user is allowed.
 */
export default function ProtectedRoute({ children, allowedRoles }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const location = useLocation();

  useEffect(() => {
    const fetchSession = async () => {
      try {
        const res = await fetch(`${BASE_URL}/auth/users/session`, {
          method: "GET",
          credentials: "include",
        });
        const data = await res.json();
        if (data.loggedIn) {
          setUser(data.user);
        } else {
          setUser(null);
        }
      } catch (err) {
        console.error("Failed to fetch session:", err);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    fetchSession();
  }, []);

  // Loading spinner 
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center gap-3 text-gray-500">
          <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm font-medium">Verifying access…</p>
        </div>
      </div>
    );
  }

  // Not logged in → redirect to login
  if (!user) return <Navigate to="/login" replace />;

  // Logged in but wrong role or Super Admin on non-superadmin path → 403 Access Denied
  const isSuperAdminOnWrongPath = user.role === 'super_admin' && !location.pathname.startsWith('/superadmin');

  if (isSuperAdminOnWrongPath || (allowedRoles && !allowedRoles.includes(user.role))) {
    const roleRedirects = {
      citizen: "/citizen",
      dept_admin: "/admin/dashboard",
      super_admin: "/superadmin/dashboard",
    };

    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-red-50 p-6">
        <div className="max-w-md w-full bg-white rounded-3xl shadow-2xl border border-red-100 overflow-hidden">
          {/* Red accent bar */}
          <div className="h-2 bg-gradient-to-r from-red-500 to-rose-600" />

          <div className="p-10 text-center">
            {/* Icon */}
            <div className="inline-flex items-center justify-center w-20 h-20 bg-red-100 rounded-full mb-6">
              <ShieldOff className="w-10 h-10 text-red-500" />
            </div>

            {/* Heading */}
            <h1 className="text-5xl font-black text-gray-900 mb-1">403</h1>
            <h2 className="text-xl font-bold text-gray-700 mb-3">Access Denied</h2>

            {/* Message */}
            <p className="text-gray-500 text-sm leading-relaxed mb-8">
              You don&apos;t have permission to view this page.<br />
              {/* This area is restricted to{" "}
              <span className="font-semibold text-red-600">
                {allowedRoles
                  .map(r => r.replace("_", " ").replace(/\b\w/g, c => c.toUpperCase()))
                  .join(" / ")}
              </span>{" "}
              accounts only. */}
            </p>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <button
                onClick={() => window.history.back()}
                className="px-6 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-semibold text-sm transition-colors"
              >
                ← Go Back
              </button>
              <button
                onClick={() => {
                  window.location.href = roleRedirects[user.role] || "/";
                }}
                className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold text-sm transition-colors shadow-lg shadow-blue-200"
              >
                My Dashboard →
              </button>
            </div>

            {/* Footer info */}
            <p className="text-xs text-gray-400 mt-6">
              Signed in as{" "}
              <span className="font-mono font-semibold text-gray-600">{user.email}</span>
              {" "}·{" "}
              <span className="capitalize">{user.role?.replace("_", " ")}</span>
            </p>
          </div>
        </div>
      </div>
    );
  }

  // ── Authorised → render the protected page
  return children;
}
