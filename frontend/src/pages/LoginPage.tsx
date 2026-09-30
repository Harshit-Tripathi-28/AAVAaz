import React, { useState, useEffect } from "react";
import { Link, useNavigate, useSearchParams, useLocation } from "react-router-dom";
import {
  Building2,
  Lock,
  Mail,
  ArrowLeft,
  AlertCircle,
  Loader2,
} from "lucide-react";
import { useAuth } from "../context/AuthContext.js";
import { api, ApiClientError } from "../services/apiClient.js";
import { InstitutionPublic } from "../types/api.js";

export function LoginPage() {
  const [searchParams] = useSearchParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { login, isAuthenticated } = useAuth();

  const institutionIdParam = searchParams.get("institutionId");

  const [institutions, setInstitutions] = useState<InstitutionPublic[]>([]);
  const [selectedInstitutionId, setSelectedInstitutionId] = useState<string>(
    institutionIdParam || ""
  );
  const [selectedInstitution, setSelectedInstitution] =
    useState<InstitutionPublic | null>(null);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // If already authenticated, redirect to app workspace
  useEffect(() => {
    if (isAuthenticated) {
      const from = (location.state as any)?.from?.pathname || "/app";
      navigate(from, { replace: true });
    }
  }, [isAuthenticated, navigate, location]);

  // Load institutions list for selection and context verification
  useEffect(() => {
    async function loadInstitutions() {
      try {
        const res = await api.get<InstitutionPublic[]>("/institutions");
        setInstitutions(res.data);

        if (institutionIdParam) {
          const match = res.data.find((inst) => inst.id === institutionIdParam);
          if (match) {
            setSelectedInstitution(match);
            setSelectedInstitutionId(match.id);
          }
        } else if (res.data.length === 1) {
          setSelectedInstitution(res.data[0]);
          setSelectedInstitutionId(res.data[0].id);
        }
      } catch {
        // Handled silently; submit will validate
      }
    }
    loadInstitutions();
  }, [institutionIdParam]);

  const handleInstitutionChange = (id: string) => {
    setSelectedInstitutionId(id);
    const match = institutions.find((i) => i.id === id);
    setSelectedInstitution(match || null);
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedInstitutionId) {
      setError("Please select an institution to continue");
      return;
    }

    if (!email || !password) {
      setError("Please provide both email and password");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await login(selectedInstitutionId, email, password);
      const from = (location.state as any)?.from?.pathname || "/app";
      navigate(from, { replace: true });
    } catch (err) {
      if (err instanceof ApiClientError) {
        setError(err.message);
      } else if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Authentication failed. Please verify your credentials.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-between font-sans">
      {/* Top Header */}
      <header className="border-b border-slate-200 bg-white sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center space-x-3 text-slate-900 hover:opacity-90">
            <div className="w-9 h-9 rounded-lg bg-indigo-600 flex items-center justify-center text-white font-bold text-lg">
              आ
            </div>
            <span className="text-xl font-bold tracking-tight">AAVAaz</span>
          </Link>
          <Link
            to="/institutions"
            className="inline-flex items-center text-xs font-semibold text-slate-500 hover:text-slate-800 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5 mr-1" />
            Switch Institution
          </Link>
        </div>
      </header>

      {/* Login Box */}
      <main className="max-w-md mx-auto px-4 py-12 flex-1 w-full flex flex-col justify-center">
        <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm space-y-6">
          <div className="text-center space-y-2">
            <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center mx-auto shadow-sm">
              <Lock className="w-5 h-5" />
            </div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
              Institutional Sign In
            </h1>
            <p className="text-xs text-slate-500">
              Access your member account, complaints, requests, and resolutions.
            </p>
          </div>

          {/* Institution Context Badge */}
          {selectedInstitution ? (
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <Building2 className="w-5 h-5 text-indigo-600 flex-shrink-0" />
                <div>
                  <div className="text-xs font-bold text-slate-800">
                    {selectedInstitution.name}
                  </div>
                  <div className="text-[11px] font-mono text-slate-500">
                    Code: {selectedInstitution.code}
                  </div>
                </div>
              </div>
              <Link
                to="/institutions"
                className="text-[11px] font-semibold text-indigo-600 hover:text-indigo-800 underline"
              >
                Change
              </Link>
            </div>
          ) : (
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 block">
                Select Institution
              </label>
              <select
                value={selectedInstitutionId}
                onChange={(e) => handleInstitutionChange(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="">-- Choose an institution --</option>
                {institutions.map((inst) => (
                  <option key={inst.id} value={inst.id}>
                    {inst.name} ({inst.code})
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="p-3.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 flex items-start space-x-2.5 text-xs">
              <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1 font-medium">{error}</div>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 block">
                Institutional Email
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  required
                  placeholder="name@institution.edu"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 block">
                Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 px-4 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm shadow-sm transition-colors flex items-center justify-center space-x-2 disabled:opacity-60"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Verifying credentials...</span>
                </>
              ) : (
                <span>Sign In</span>
              )}
            </button>
          </form>

          <div className="pt-2 border-t border-slate-100 text-center">
            <p className="text-[11px] text-slate-400">
              Access tokens are stored in runtime memory only. Sessions are guarded with HTTP-only cookies and CSRF protections.
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white py-4 text-center text-xs text-slate-400">
        &copy; {new Date().getFullYear()} AAVAaz Institutional Concern Resolution Platform
      </footer>
    </div>
  );
}
