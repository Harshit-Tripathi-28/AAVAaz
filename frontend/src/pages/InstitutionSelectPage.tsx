import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Building2, Search, ArrowRight, Loader2, AlertCircle, ArrowLeft, RefreshCw } from "lucide-react";
import { api, ApiClientError } from "../services/apiClient.js";
import { InstitutionPublic } from "../types/api.js";

export function InstitutionSelectPage() {
  const [institutions, setInstitutions] = useState<InstitutionPublic[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const fetchInstitutions = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.get<InstitutionPublic[]>("/institutions");
      setInstitutions(response.data);
    } catch (err) {
      if (err instanceof ApiClientError) {
        setError(`${err.errorCode}: ${err.message}`);
      } else if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Unable to retrieve institutions from the platform");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInstitutions();
  }, []);

  const filteredInstitutions = institutions.filter(
    (inst) =>
      inst.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      inst.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (inst.domain && inst.domain.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col font-sans">
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
            to="/"
            className="inline-flex items-center text-xs font-semibold text-slate-500 hover:text-slate-800 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5 mr-1" />
            Back to Home
          </Link>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-12 flex-1 w-full space-y-8">
        <div className="text-center space-y-3">
          <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center mx-auto shadow-sm">
            <Building2 className="w-6 h-6" />
          </div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
            Select Your Institution
          </h1>
          <p className="text-sm text-slate-600 max-w-xl mx-auto">
            Choose your registered university, college, school, or organization to access your institutional portal.
          </p>
        </div>

        {/* Search Bar */}
        <div className="relative max-w-lg mx-auto">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by institution name, code, or domain..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-slate-300 bg-white text-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 shadow-sm"
          />
        </div>

        {/* Content Area */}
        <div className="space-y-4">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-16 space-y-3 text-slate-500 text-sm">
              <Loader2 className="w-6 h-6 text-indigo-600 animate-spin" />
              <span>Discovering active institutions...</span>
            </div>
          ) : error ? (
            <div className="p-5 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 space-y-3">
              <div className="flex items-center space-x-2 font-semibold text-sm">
                <AlertCircle className="w-4 h-4 text-amber-600" />
                <span>Failed to retrieve institutions</span>
              </div>
              <p className="text-xs text-amber-700">{error}</p>
              <button
                onClick={fetchInstitutions}
                className="inline-flex items-center px-3 py-1.5 rounded-md bg-amber-100 hover:bg-amber-200 text-xs font-semibold text-amber-900 transition-colors"
              >
                <RefreshCw className="w-3.5 h-3.5 mr-1.5" />
                Retry
              </button>
            </div>
          ) : institutions.length === 0 ? (
            <div className="text-center py-14 px-6 bg-white rounded-xl border border-slate-200 shadow-sm space-y-3">
              <Building2 className="w-10 h-10 text-slate-300 mx-auto" />
              <h3 className="text-base font-semibold text-slate-800">No active institutions found</h3>
              <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
                There are currently no active institutions provisioned in the database. Use the platform administrative
                provisioning CLI to securely register the initial institution:
              </p>
              <div className="pt-2">
                <code className="text-xs font-mono bg-slate-100 text-slate-700 px-3 py-1.5 rounded border border-slate-200 inline-block">
                  npm run provision:institution
                </code>
              </div>
            </div>
          ) : filteredInstitutions.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-xl border border-slate-200 shadow-sm">
              <p className="text-sm text-slate-500">
                No institutions match &ldquo;{searchQuery}&rdquo;
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {filteredInstitutions.map((inst) => (
                <div
                  key={inst.id}
                  onClick={() => navigate(`/login?institutionId=${inst.id}`)}
                  className="group bg-white p-5 rounded-xl border border-slate-200 hover:border-indigo-400 hover:shadow-md cursor-pointer transition-all flex flex-col justify-between"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-mono font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                        {inst.code}
                      </span>
                      <span className="text-xs font-semibold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded">
                        {inst.type}
                      </span>
                    </div>
                    <h3 className="text-base font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">
                      {inst.name}
                    </h3>
                    {inst.domain && (
                      <p className="text-xs text-slate-500">Domain: {inst.domain}</p>
                    )}
                  </div>

                  <div className="pt-4 flex items-center justify-between text-xs font-semibold text-indigo-600">
                    <span>Continue to Sign In</span>
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
