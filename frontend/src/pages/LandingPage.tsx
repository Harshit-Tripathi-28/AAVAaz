import { Link } from "react-router-dom";
import {
  Building2,
  ShieldCheck,
  Users,
  FileCheck2,
  ArrowRight,
  Sparkles,
} from "lucide-react";
import { useAuth } from "../context/AuthContext.js";

export function LandingPage() {
  const { isAuthenticated } = useAuth();

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col justify-between font-sans">
      {/* Top Header */}
      <header className="border-b border-slate-200 bg-white/80 backdrop-blur sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-lg bg-indigo-600 flex items-center justify-center text-white shadow-sm font-bold text-xl tracking-wider">
              आ
            </div>
            <div>
              <span className="text-xl font-bold tracking-tight text-slate-900">AAVAaz</span>
              <span className="text-xs font-semibold ml-2 px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 border border-indigo-200/60 uppercase">
                Production
              </span>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            {isAuthenticated ? (
              <Link
                to="/app"
                className="inline-flex items-center px-4 py-2 text-sm font-semibold rounded-lg text-white bg-indigo-600 hover:bg-indigo-700 shadow-sm transition-colors"
              >
                Go to Workspace
                <ArrowRight className="w-4 h-4 ml-1.5" />
              </Link>
            ) : (
              <Link
                to="/institutions"
                className="inline-flex items-center px-4 py-2 text-sm font-semibold rounded-lg text-white bg-indigo-600 hover:bg-indigo-700 shadow-sm transition-colors"
              >
                Select Institution
                <ArrowRight className="w-4 h-4 ml-1.5" />
              </Link>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 flex-1 w-full space-y-16">
        {/* Hero Section */}
        <div className="text-center max-w-3xl mx-auto space-y-6">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200">
            <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
            <span>Institutional Concern Resolution Platform</span>
          </div>

          <h1 className="text-4xl sm:text-6xl font-extrabold text-slate-900 tracking-tight leading-tight">
            Your concern. <br className="hidden sm:inline" />
            Your voice. <br className="hidden sm:inline" />
            <span className="text-indigo-600">Your action.</span>
          </h1>

          <p className="text-lg text-slate-600 leading-relaxed">
            A production-grade, multi-tenant platform engineered for real institutional ecosystems.
            Designed for students, faculty, administrative staff, teaching, non-teaching, and hostel teams
            with server-enforced tenant boundaries and permission-based authorization.
          </p>

          <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              to="/institutions"
              className="w-full sm:w-auto inline-flex items-center justify-center px-6 py-3 text-base font-semibold rounded-lg text-white bg-indigo-600 hover:bg-indigo-700 shadow-md transition-colors"
            >
              Sign In to Your Institution
              <ArrowRight className="w-5 h-5 ml-2" />
            </Link>
          </div>
        </div>

        {/* Core Pillars */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 pt-6">
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-3">
            <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
              <Building2 className="w-5 h-5" />
            </div>
            <h3 className="font-semibold text-slate-900 text-base">Multi-Tenancy Isolation</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Row-level tenant boundaries anchored to verified memberships. Tenant context is authenticated
              strictly server-side.
            </p>
          </div>

          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-3">
            <div className="w-10 h-10 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center font-bold">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <h3 className="font-semibold text-slate-900 text-base">Permission-Centric RBAC</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Permissions are the primary authorization primitive. Institutional roles are dynamic containers
              without hardcoded role assumptions.
            </p>
          </div>

          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-3">
            <div className="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
              <Users className="w-5 h-5" />
            </div>
            <h3 className="font-semibold text-slate-900 text-base">Full Institutional Scope</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Serving students, faculty, administrative staff, teaching, non-teaching, and hostel personnel
              across configured units.
            </p>
          </div>

          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-3">
            <div className="w-10 h-10 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
              <FileCheck2 className="w-5 h-5" />
            </div>
            <h3 className="font-semibold text-slate-900 text-base">Stateful Session Security</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Short-lived access tokens in runtime memory only, rotating SHA-256 hashed refresh sessions in
              HTTP-only cookies with CSRF origin defenses.
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-2">
          <div>
            &copy; {new Date().getFullYear()} AAVAaz Institutional Concern Resolution Platform. All rights reserved.
          </div>
          <div className="flex items-center space-x-4">
            <span className="font-medium text-slate-700">&ldquo;Your concern. Your voice. Your action.&rdquo;</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
