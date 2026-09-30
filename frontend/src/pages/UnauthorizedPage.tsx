import { Link, useLocation } from "react-router-dom";
import { ShieldAlert, ArrowLeft, Home } from "lucide-react";

export function UnauthorizedPage() {
  const location = useLocation();
  const requiredPermission = (location.state as any)?.requiredPermission;
  const requiredRole = (location.state as any)?.requiredRole;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-between font-sans">
      <header className="border-b border-slate-200 bg-white sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center space-x-3 text-slate-900 hover:opacity-90">
            <div className="w-9 h-9 rounded-lg bg-indigo-600 flex items-center justify-center text-white font-bold text-lg">
              आ
            </div>
            <span className="text-xl font-bold tracking-tight">AAVAaz</span>
          </Link>
        </div>
      </header>

      <main className="max-w-md mx-auto px-4 py-16 flex-1 w-full flex flex-col justify-center">
        <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm text-center space-y-5">
          <div className="w-14 h-14 bg-rose-50 text-rose-600 rounded-2xl flex items-center justify-center mx-auto shadow-sm">
            <ShieldAlert className="w-7 h-7" />
          </div>

          <div className="space-y-2">
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
              Access Denied
            </h1>
            <p className="text-xs text-slate-600 leading-relaxed">
              Your authenticated identity does not possess the required authorization to access this area.
            </p>
          </div>

          {(requiredPermission || requiredRole) && (
            <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-200 text-left text-xs space-y-1">
              <span className="font-semibold text-slate-700 block">Required Authorization:</span>
              {requiredPermission && (
                <div className="font-mono text-rose-700 bg-rose-50 px-2 py-1 rounded border border-rose-200">
                  Permission: {requiredPermission}
                </div>
              )}
              {requiredRole && (
                <div className="font-mono text-indigo-700 bg-indigo-50 px-2 py-1 rounded border border-indigo-200">
                  Role: {requiredRole}
                </div>
              )}
            </div>
          )}

          <div className="pt-2 flex flex-col sm:flex-row gap-3">
            <Link
              to="/app"
              className="flex-1 inline-flex items-center justify-center px-4 py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs transition-colors shadow-sm"
            >
              <Home className="w-3.5 h-3.5 mr-1.5" />
              Return to Workspace
            </Link>
            <Link
              to="/"
              className="flex-1 inline-flex items-center justify-center px-4 py-2.5 rounded-lg bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 font-semibold text-xs transition-colors shadow-sm"
            >
              <ArrowLeft className="w-3.5 h-3.5 mr-1.5" />
              Home Page
            </Link>
          </div>
        </div>
      </main>

      <footer className="border-t border-slate-200 bg-white py-4 text-center text-xs text-slate-400">
        &copy; {new Date().getFullYear()} AAVAaz Institutional Concern Resolution Platform
      </footer>
    </div>
  );
}
