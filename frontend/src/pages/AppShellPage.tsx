import { useState } from "react";

import {
  Building2,
  User,
  ShieldCheck,
  Key,
  LogOut,
  CheckCircle2,
  Lock,
  ChevronDown,
  ChevronUp,
  Cpu,
} from "lucide-react";
import { useAuth } from "../context/AuthContext.js";

export function AppShellPage() {
  const { user, tenant, roles, permissions, logout, hasPermission } = useAuth();
  const [showAllPermissions, setShowAllPermissions] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      await logout();
    } finally {
      setLoggingOut(false);
    }
  };

  // Group permissions by module
  const permissionsByModule = permissions.reduce<Record<string, string[]>>((acc, perm) => {
    const moduleName = perm.split(":")[0]?.toUpperCase() || "GENERAL";
    if (!acc[moduleName]) acc[moduleName] = [];
    acc[moduleName].push(perm);
    return acc;
  }, {});

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col font-sans">
      {/* Top Navigation */}
      <header className="border-b border-slate-200 bg-white sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-lg bg-indigo-600 flex items-center justify-center text-white font-bold text-lg">
              आ
            </div>
            <div>
              <span className="text-xl font-bold tracking-tight text-slate-900">AAVAaz</span>
              <span className="text-xs font-semibold ml-2 px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200 uppercase">
                Authenticated
              </span>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <div className="hidden sm:flex items-center space-x-2 text-xs text-slate-600 bg-slate-100 px-3 py-1.5 rounded-lg border border-slate-200">
              <Building2 className="w-3.5 h-3.5 text-indigo-600" />
              <span className="font-semibold text-slate-800">{tenant?.name}</span>
              <span className="font-mono text-slate-400">({tenant?.code})</span>
            </div>

            <button
              onClick={handleLogout}
              disabled={loggingOut}
              className="inline-flex items-center px-3 py-1.5 text-xs font-semibold rounded-lg text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 hover:text-rose-600 transition-colors shadow-sm disabled:opacity-50"
            >
              <LogOut className="w-3.5 h-3.5 mr-1.5" />
              Sign Out
            </button>
          </div>
        </div>
      </header>

      {/* Main Workspace */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 flex-1 w-full space-y-8">
        {/* Welcome Banner */}
        <div className="bg-gradient-to-r from-indigo-900 to-slate-900 text-white p-8 rounded-2xl shadow-sm space-y-3">
          <div className="inline-flex items-center space-x-2 px-3 py-0.5 rounded-full text-xs font-medium bg-indigo-500/20 text-indigo-200 border border-indigo-400/30">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            <span>Authenticated Workspace Foundation</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Welcome, {user?.firstName} {user?.lastName}
          </h1>
          <p className="text-xs sm:text-sm text-indigo-100/80 max-w-2xl leading-relaxed">
            You are authenticated into the <span className="font-semibold text-white">{tenant?.name}</span> tenant.
            Your operational permissions have been loaded directly from the server-verified session.
          </p>
        </div>

        {/* Security & Token Architecture Indicator */}
        <div className="p-4 rounded-xl bg-indigo-50 border border-indigo-200/80 text-indigo-950 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-lg bg-indigo-600 text-white">
              <Cpu className="w-4 h-4" />
            </div>
            <div>
              <div className="font-bold">In-Memory Access Token Architecture</div>
              <div className="text-indigo-800 text-[11px]">
                Access token is held strictly in runtime memory. Refresh token is protected by HTTP-only cookie and CSRF origin verification.
              </div>
            </div>
          </div>
          <div className="flex items-center space-x-2 font-mono text-[11px] bg-white px-2.5 py-1 rounded border border-indigo-200 text-indigo-700">
            <span>Storage: 0 bytes in localStorage</span>
          </div>
        </div>

        {/* 3-Column Identity Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Identity Card */}
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
            <div className="flex items-center space-x-2.5 text-slate-900 font-bold text-base pb-3 border-b border-slate-100">
              <User className="w-5 h-5 text-indigo-600" />
              <h2>User Identity</h2>
            </div>
            <div className="space-y-3 text-xs">
              <div>
                <span className="text-slate-400 block font-medium">Full Name</span>
                <span className="font-bold text-slate-800 text-sm">
                  {user?.firstName} {user?.lastName}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block font-medium">Institutional Email</span>
                <span className="font-semibold text-slate-800">{user?.email}</span>
              </div>
              <div>
                <span className="text-slate-400 block font-medium">Account Status</span>
                <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-100 text-emerald-800">
                  {user?.status}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block font-medium">User Identifier (UUID)</span>
                <span className="font-mono text-[11px] text-slate-500 break-all">{user?.id}</span>
              </div>
            </div>
          </div>

          {/* Tenant Context Card */}
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
            <div className="flex items-center space-x-2.5 text-slate-900 font-bold text-base pb-3 border-b border-slate-100">
              <Building2 className="w-5 h-5 text-indigo-600" />
              <h2>Tenant Context</h2>
            </div>
            <div className="space-y-3 text-xs">
              <div>
                <span className="text-slate-400 block font-medium">Institution Name</span>
                <span className="font-bold text-slate-800 text-sm">{tenant?.name}</span>
              </div>
              <div>
                <span className="text-slate-400 block font-medium">Institution Code (Slug)</span>
                <span className="font-mono font-semibold text-slate-800">{tenant?.code}</span>
              </div>
              <div>
                <span className="text-slate-400 block font-medium">Institution Type</span>
                <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-indigo-50 text-indigo-700">
                  {tenant?.type}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block font-medium">Tenant Boundary ID</span>
                <span className="font-mono text-[11px] text-slate-500 break-all">{tenant?.id}</span>
              </div>
            </div>
          </div>

          {/* Assigned Roles Card */}
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
            <div className="flex items-center space-x-2.5 text-slate-900 font-bold text-base pb-3 border-b border-slate-100">
              <ShieldCheck className="w-5 h-5 text-indigo-600" />
              <h2>Assigned Roles</h2>
            </div>
            <div className="space-y-3 text-xs">
              <p className="text-slate-500 text-[11px]">
                Configured institutional roles assigned to your identity:
              </p>
              {roles.length === 0 ? (
                <div className="p-3 bg-slate-50 rounded-lg text-slate-500 italic">
                  No roles assigned.
                </div>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {roles.map((r) => (
                    <span
                      key={r}
                      className="px-2.5 py-1 rounded-md text-xs font-mono font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200/60"
                    >
                      {r}
                    </span>
                  ))}
                </div>
              )}
              <div className="pt-2 text-[11px] text-slate-400 border-t border-slate-100 leading-relaxed">
                Roles are groupings of permissions. Business logic verifies permissions, never hardcoded roles.
              </div>
            </div>
          </div>
        </div>

        {/* Permissions Primitive Section */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-slate-100 flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
                <Key className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Effective Permissions ({permissions.length})
                </h3>
                <p className="text-xs text-slate-500">
                  Granular permission primitives verified and authorized server-side
                </p>
              </div>
            </div>

            <button
              onClick={() => setShowAllPermissions(!showAllPermissions)}
              className="inline-flex items-center text-xs font-semibold text-indigo-600 hover:text-indigo-800"
            >
              {showAllPermissions ? (
                <>
                  <ChevronUp className="w-4 h-4 mr-1" />
                  Collapse Details
                </>
              ) : (
                <>
                  <ChevronDown className="w-4 h-4 mr-1" />
                  View All Permissions
                </>
              )}
            </button>
          </div>

          <div className="p-6">
            {permissions.length === 0 ? (
              <div className="p-4 rounded-lg bg-amber-50 text-amber-800 text-xs">
                No active permissions loaded.
              </div>
            ) : (
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {Object.entries(permissionsByModule).map(([moduleName, perms]) => (
                    <div
                      key={moduleName}
                      className="p-3.5 rounded-lg bg-slate-50 border border-slate-200 space-y-2"
                    >
                      <span className="text-[11px] font-bold text-slate-500 tracking-wider uppercase block">
                        Module: {moduleName}
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {perms.map((p) => (
                          <span
                            key={p}
                            className="font-mono text-[11px] px-2 py-0.5 rounded bg-white border border-slate-200 text-slate-800"
                          >
                            {p}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Permission-Guarded Authorization Demonstration */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-4">
          <div className="flex items-center space-x-2.5 text-slate-900 font-bold text-base pb-3 border-b border-slate-100">
            <Lock className="w-5 h-5 text-indigo-600" />
            <h3>Authorization Guard Demonstration</h3>
          </div>
          <p className="text-xs text-slate-600 leading-relaxed">
            In AAVAaz, server-side middleware (`requirePermissions`) guarantees that client actions are
            strictly authorized. The UI dynamically reflects your verified permission state:
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
            <div className="p-4 rounded-lg border border-slate-200 bg-slate-50 space-y-2">
              <span className="text-xs font-bold text-slate-800 block">Submit Concern</span>
              <code className="text-[11px] font-mono text-slate-500 block">concern:create</code>
              <div>
                {hasPermission("concern:create") ? (
                  <span className="inline-flex items-center text-xs font-semibold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded">
                    <CheckCircle2 className="w-3 h-3 mr-1" />
                    Authorized
                  </span>
                ) : (
                  <span className="inline-flex items-center text-xs font-semibold text-rose-700 bg-rose-100 px-2 py-0.5 rounded">
                    Missing Permission
                  </span>
                )}
              </div>
            </div>

            <div className="p-4 rounded-lg border border-slate-200 bg-slate-50 space-y-2">
              <span className="text-xs font-bold text-slate-800 block">Manage Users</span>
              <code className="text-[11px] font-mono text-slate-500 block">user:manage</code>
              <div>
                {hasPermission("user:manage") ? (
                  <span className="inline-flex items-center text-xs font-semibold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded">
                    <CheckCircle2 className="w-3 h-3 mr-1" />
                    Authorized
                  </span>
                ) : (
                  <span className="inline-flex items-center text-xs font-semibold text-rose-700 bg-rose-100 px-2 py-0.5 rounded">
                    Missing Permission
                  </span>
                )}
              </div>
            </div>

            <div className="p-4 rounded-lg border border-slate-200 bg-slate-50 space-y-2">
              <span className="text-xs font-bold text-slate-800 block">Audit Log Access</span>
              <code className="text-[11px] font-mono text-slate-500 block">audit:read</code>
              <div>
                {hasPermission("audit:read") ? (
                  <span className="inline-flex items-center text-xs font-semibold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded">
                    <CheckCircle2 className="w-3 h-3 mr-1" />
                    Authorized
                  </span>
                ) : (
                  <span className="inline-flex items-center text-xs font-semibold text-rose-700 bg-rose-100 px-2 py-0.5 rounded">
                    Missing Permission
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white py-4 text-center text-xs text-slate-400">
        &copy; {new Date().getFullYear()} AAVAaz Institutional Concern Resolution Platform &bull; Session Active
      </footer>
    </div>
  );
}
