import { useEffect, useState } from "react";
import {
  ShieldCheck,
  Building2,
  Users,
  FileCheck2,
  Activity,
  Server,
  Database,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
} from "lucide-react";
import { api, ApiClientError } from "./services/apiClient.js";
import { HealthStatus } from "./types/api.js";

export default function App() {
  const [health, setHealth] = useState<HealthStatus | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [lastChecked, setLastChecked] = useState<Date | null>(null);

  const fetchHealthStatus = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.get<HealthStatus>("/health");
      setHealth(response.data);
      setLastChecked(new Date());
    } catch (err) {
      if (err instanceof ApiClientError) {
        setError(`${err.errorCode}: ${err.message}`);
      } else if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Unable to connect to backend service");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHealthStatus();
  }, []);

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
                Foundation Phase
              </span>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={fetchHealthStatus}
              disabled={loading}
              className="inline-flex items-center px-3 py-1.5 text-xs font-medium rounded-md text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 transition-colors shadow-sm"
            >
              <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${loading ? "animate-spin" : ""}`} />
              Refresh Status
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 flex-1 w-full space-y-10">
        {/* Hero Section */}
        <div className="text-center max-w-3xl mx-auto space-y-4">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200">
            <span>Production Architecture Ready</span>
          </div>
          <h1 className="text-4xl sm:text-5xl font-extrabold text-slate-900 tracking-tight">
            AAVAaz Platform
          </h1>
          <p className="text-xl font-medium text-indigo-600 italic">
            &ldquo;Your concern. Your voice. Your action.&rdquo;
          </p>
          <p className="text-slate-600 text-base leading-relaxed">
            A multi-tenant institutional concern resolution platform built for complete institutional
            ecosystems—supporting students, faculty, administrative staff, teaching, non-teaching, and
            support personnel with tamper-evident accountability and server-enforced security.
          </p>
        </div>

        {/* Real-time System Connectivity Card */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="p-6 border-b border-slate-100 flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center space-x-3">
              <div className="p-2.5 bg-slate-100 rounded-lg text-slate-700">
                <Activity className="w-5 h-5 text-indigo-600" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-slate-900">Backend System Status</h2>
                <p className="text-xs text-slate-500">Live operational probe to REST API gateway (/api/v1/health)</p>
              </div>
            </div>
            {lastChecked && (
              <span className="text-xs text-slate-400">
                Last checked: {lastChecked.toLocaleTimeString()}
              </span>
            )}
          </div>

          <div className="p-6">
            {loading && !health ? (
              <div className="flex items-center justify-center py-8 text-slate-500 text-sm">
                <RefreshCw className="w-5 h-5 animate-spin mr-2 text-indigo-600" />
                Connecting to backend service...
              </div>
            ) : error ? (
              <div className="p-4 rounded-lg bg-amber-50 border border-amber-200 text-amber-800 flex items-start space-x-3">
                <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                <div className="text-sm">
                  <div className="font-semibold">Backend Unreachable or Degraded</div>
                  <div className="mt-1 text-xs text-amber-700">{error}</div>
                  <div className="mt-2 text-xs text-amber-600">
                    Ensure the Node.js backend is running on port 4000 (<code className="font-mono bg-amber-100 px-1 py-0.5 rounded">npm run dev</code> in backend).
                  </div>
                </div>
              </div>
            ) : health ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="p-4 rounded-lg bg-slate-50 border border-slate-200/80">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Gateway Service</span>
                    <Server className="w-4 h-4 text-slate-400" />
                  </div>
                  <div className="mt-2 flex items-center space-x-2">
                    <span className="text-lg font-bold text-slate-800">{health.service}</span>
                    <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-emerald-100 text-emerald-800">
                      {health.environment}
                    </span>
                  </div>
                  <div className="mt-1 text-xs text-slate-500">Uptime: {health.uptimeSeconds}s</div>
                </div>

                <div className="p-4 rounded-lg bg-slate-50 border border-slate-200/80">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Overall Health</span>
                    {health.status === "healthy" ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    ) : (
                      <AlertTriangle className="w-4 h-4 text-amber-500" />
                    )}
                  </div>
                  <div className="mt-2">
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded text-sm font-semibold capitalize ${
                        health.status === "healthy"
                          ? "bg-emerald-100 text-emerald-800"
                          : "bg-amber-100 text-amber-800"
                      }`}
                    >
                      {health.status}
                    </span>
                  </div>
                  <div className="mt-1 text-xs text-slate-500">HTTP 200 OK Response</div>
                </div>

                <div className="p-4 rounded-lg bg-slate-50 border border-slate-200/80">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">PostgreSQL DB</span>
                    <Database className="w-4 h-4 text-slate-400" />
                  </div>
                  <div className="mt-2 flex items-center space-x-2">
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold uppercase ${
                        health.database.healthy
                          ? "bg-emerald-100 text-emerald-800"
                          : "bg-amber-100 text-amber-800"
                      }`}
                    >
                      {health.database.status}
                    </span>
                  </div>
                  <div className="mt-1 text-xs text-slate-500">
                    {health.database.healthy ? "Prisma Client Connected" : "Awaiting DB start / migration"}
                  </div>
                </div>

                <div className="p-4 rounded-lg bg-slate-50 border border-slate-200/80">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Memory Allocation</span>
                    <Activity className="w-4 h-4 text-slate-400" />
                  </div>
                  <div className="mt-2">
                    <span className="text-lg font-bold text-slate-800">{health.memory.heapUsedMb} MB</span>
                    <span className="text-xs text-slate-500 ml-1">/ {health.memory.heapTotalMb} MB</span>
                  </div>
                  <div className="mt-1 text-xs text-slate-500">RSS: {health.memory.rssMb} MB</div>
                </div>
              </div>
            ) : null}
          </div>
        </div>

        {/* Architectural Pillars */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-3">
            <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
              <Building2 className="w-5 h-5" />
            </div>
            <h3 className="font-semibold text-slate-900 text-base">Multi-Tenancy Isolation</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Row-level tenant isolation anchored to <code className="bg-slate-100 px-1 py-0.5 rounded text-slate-800">institutionId</code>.
              Tenant context is authenticated server-side and never trusted from client headers alone.
            </p>
          </div>

          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-3">
            <div className="w-10 h-10 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center font-bold">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <h3 className="font-semibold text-slate-900 text-base">Permission-Centric RBAC</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Permissions are the primary authorization primitive. Roles are configurable groupings without hardcoded
              business logic assumptions.
            </p>
          </div>

          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-3">
            <div className="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
              <Users className="w-5 h-5" />
            </div>
            <h3 className="font-semibold text-slate-900 text-base">Full Institutional Scope</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Engineered for students, faculty, administrative staff, teaching, non-teaching, and hostel personnel across
              configured departments and units.
            </p>
          </div>

          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-3">
            <div className="w-10 h-10 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
              <FileCheck2 className="w-5 h-5" />
            </div>
            <h3 className="font-semibold text-slate-900 text-base">Evidence & Auditability</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Tamper-evident audit logging for state transitions, administrative actions, and resolution verification
              before concerns can be closed.
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white py-6 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-2">
          <div>
            &copy; {new Date().getFullYear()} AAVAaz Institutional Concern Resolution Platform. All rights reserved.
          </div>
          <div className="flex items-center space-x-4">
            <span>Phase 1: Production Foundation</span>
            <span>&bull;</span>
            <span className="font-medium text-slate-700">Zero Mock APIs / Real Typed Schema</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
