import React, { useEffect, useMemo, useState } from "react";
import {
  Zap,
  FilePlus2,
  Search,
  LayoutDashboard,
  ShieldAlert,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Download,
  Phone,
  Mail,
  MapPin,
  Copy,
  Check,
  Star,
  ArrowUpRight,
  Paperclip,
  RefreshCw,
  Globe,
  X,
  Lock,
  LogOut,
  ShieldCheck,
  Building2
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend
} from "recharts";
import { api } from "./api/client";

const STATUS_STYLES = {
  Submitted: "bg-slate-100 text-slate-700 border-slate-300",
  Assigned: "bg-blue-50 text-blue-700 border-blue-200",
  "In Progress": "bg-amber-50 text-amber-800 border-amber-200",
  Escalated: "bg-red-50 text-red-700 border-red-200",
  Resolved: "bg-emerald-50 text-emerald-700 border-emerald-200",
  Closed: "bg-teal-50 text-teal-800 border-teal-200"
};

const PRIORITY_STYLES = {
  Critical: "bg-red-600 text-white",
  High: "bg-orange-500 text-white",
  Medium: "bg-amber-400 text-slate-900",
  Low: "bg-slate-200 text-slate-700"
};

const PIE_COLORS = ["#0f294a", "#d97706", "#0284c7", "#dc2626", "#059669", "#7c3aed"];

const LABELS = {
  en: {
    org: "Bihar State Power Transmission Company Limited",
    subtitle: "Web-Based Grievance Redressal & Monitoring Portal",
    navDashboard: "Public Dashboard",
    navLodge: "Lodge Grievance",
    navTrack: "Track Status",
    navConsole: "Officer Console"
  },
  hi: {
    org: "बिहार स्टेट पावर ट्रांसमिशन कंपनी लिमिटेड (BSPTCL)",
    subtitle: "वेब-आधारित शिकायत निवारण एवं निगरानी पोर्टल",
    navDashboard: "निगरानी डैशबोर्ड",
    navLodge: "शिकायत दर्ज करें",
    navTrack: "स्थिति ट्रैक करें",
    navConsole: "अधिकारी कंसोल"
  }
};

function formatDate(iso) {
  if (!iso) return "-";
  return new Date(iso).toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  });
}

function isSlaBreached(g) {
  if (!g || g.status === "Resolved" || g.status === "Closed") return false;
  return new Date(g.slaDeadline).getTime() < Date.now();
}

export default function App() {
  const [meta, setMeta] = useState(null);
  const [stats, setStats] = useState(null);
  const [grievances, setGrievances] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Auth / RBAC State (null = Public Citizen)
  const [authUser, setAuthUser] = useState(null);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [loginError, setLoginError] = useState("");

  const [activeTab, setActiveTab] = useState("dashboard");
  const [lang, setLang] = useState("en");
  const [toast, setToast] = useState(null);

  // Lodge Form
  const [form, setForm] = useState({
    complainantName: "",
    complainantType: "Citizen / Landowner",
    mobile: "",
    email: "",
    zone: "Patna Zone",
    gss: "220/132/33 kV GSS Khagaul",
    voltageLevel: "220 kV",
    category: "Transmission Line Fault / Tripping",
    priority: "High",
    subject: "",
    description: "",
    attachmentName: ""
  });
  const [receipt, setReceipt] = useState(null);
  const [copiedId, setCopiedId] = useState(false);

  // Track State
  const [trackQuery, setTrackQuery] = useState("");
  const [trackedList, setTrackedList] = useState([]);
  const [trackError, setTrackError] = useState("");
  const [fbRating, setFbRating] = useState(5);
  const [fbText, setFbText] = useState("");

  // Officer Console Filters & Action Modal
  const [filters, setFilters] = useState({
    search: "",
    zone: "All",
    status: "All",
    slaOnly: false
  });
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [actionStatus, setActionStatus] = useState("In Progress");
  const [actionOfficer, setActionOfficer] = useState("");
  const [actionRemark, setActionRemark] = useState("");

  const showToast = (message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  async function refreshPublic() {
    try {
      setLoading(true);
      setError("");
      const [m, s] = await Promise.all([api.getMeta(), api.getStats()]);
      setMeta(m);
      setStats(s);
    } catch (err) {
      setError(err.message || "Unable to connect to BSPTCL backend API.");
    } finally {
      setLoading(false);
    }
  }

  async function refreshOfficerGrievances() {
    try {
      const list = await api.listGrievances();
      setGrievances(list);
    } catch (err) {
      setGrievances([]);
    }
  }

  useEffect(() => {
    refreshPublic();
    const token = localStorage.getItem("bsptcl_auth_token");
    if (token) {
      api
        .getMe()
        .then((res) => {
          setAuthUser(res.user);
          return refreshOfficerGrievances();
        })
        .catch(() => {
          localStorage.removeItem("bsptcl_auth_token");
        });
    }
  }, []);

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setLoginError("");
    try {
      const res = await api.login(loginEmail, loginPassword);
      localStorage.setItem("bsptcl_auth_token", res.token);
      setAuthUser(res.user);
      setShowLoginModal(false);
      setLoginEmail("");
      setLoginPassword("");
      await refreshOfficerGrievances();
      setActiveTab("console");
      showToast(`Signed in as ${res.user.role} (${res.user.zone}).`);
    } catch (err) {
      setLoginError(err.message);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("bsptcl_auth_token");
    setAuthUser(null);
    setGrievances([]);
    if (activeTab === "console") setActiveTab("dashboard");
    showToast("Logged out. Returned to Public Citizen Portal.");
  };

  const filteredGrievances = useMemo(() => {
    return grievances.filter((g) => {
      if (filters.zone !== "All" && g.zone !== filters.zone) return false;
      if (filters.status !== "All" && g.status !== filters.status) return false;
      if (filters.slaOnly && !isSlaBreached(g)) return false;
      if (filters.search.trim()) {
        const q = filters.search.trim().toLowerCase();
        return (
          g.id.toLowerCase().includes(q) ||
          g.complainantName.toLowerCase().includes(q) ||
          g.mobile.includes(q) ||
          g.subject.toLowerCase().includes(q) ||
          g.gss.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [grievances, filters]);

  const handleZoneChange = (newZone) => {
    const firstGss = meta?.zones?.[newZone]?.gssList?.[0] || "";
    setForm((prev) => ({ ...prev, zone: newZone, gss: firstGss }));
  };

  const handleLodgeSubmit = async (e) => {
    e.preventDefault();
    try {
      const created = await api.createGrievance(form);
      setReceipt(created);
      showToast(`Grievance ${created.id} registered successfully.`);
      setForm((prev) => ({
        ...prev,
        complainantName: "",
        mobile: "",
        email: "",
        subject: "",
        description: "",
        attachmentName: ""
      }));
      await refreshPublic();
      if (authUser) await refreshOfficerGrievances();
    } catch (err) {
      showToast(err.message, "error");
    }
  };

  const handleTrackSearch = async (queryOverride) => {
    const q = (queryOverride ?? trackQuery).trim();
    if (!q) return;
    setTrackQuery(q);
    setTrackError("");
    try {
      const results = await api.trackGrievance(q);
      setTrackedList(results);
    } catch (err) {
      setTrackedList([]);
      setTrackError(err.message);
    }
  };

  const handleOfficerUpdate = async (e) => {
    e.preventDefault();
    if (!selectedTicket) return;
    try {
      await api.updateGrievance(selectedTicket.id, {
        status: actionStatus,
        assignedTo: actionOfficer || selectedTicket.assignedTo,
        remark: actionRemark
      });
      showToast(`Updated ${selectedTicket.id} to ${actionStatus}.`);
      setSelectedTicket(null);
      setActionRemark("");
      await Promise.all([refreshPublic(), refreshOfficerGrievances()]);
    } catch (err) {
      showToast(err.message, "error");
    }
  };

  const handleCitizenEscalate = async (ticketId) => {
    try {
      await api.escalateByCitizen(ticketId);
      showToast(`Ticket ${ticketId} escalated to HQ Monitoring Cell.`);
      await refreshPublic();
      if (authUser) await refreshOfficerGrievances();
      if (trackQuery) handleTrackSearch(trackQuery);
    } catch (err) {
      showToast(err.message, "error");
    }
  };

  const handleAutoEscalate = async () => {
    try {
      const res = await api.autoEscalate();
      showToast(
        res.escalatedCount > 0
          ? `Auto-escalated ${res.escalatedCount} SLA-breached ticket(s) to HQ.`
          : "All SLA-breached tickets are already escalated."
      );
      await Promise.all([refreshPublic(), refreshOfficerGrievances()]);
    } catch (err) {
      showToast(err.message, "error");
    }
  };

  const handleFeedbackSubmit = async (ticketId) => {
    try {
      await api.submitFeedback(ticketId, { rating: fbRating, feedback: fbText });
      showToast("Thank you! Feedback recorded and ticket closed.");
      setFbText("");
      await refreshPublic();
      if (authUser) await refreshOfficerGrievances();
      handleTrackSearch(ticketId);
    } catch (err) {
      showToast(err.message, "error");
    }
  };

  const exportCsv = () => {
    const headers = [
      "Tracking ID",
      "Complainant",
      "Mobile",
      "Zone",
      "GSS",
      "Voltage",
      "Category",
      "Priority",
      "Status",
      "Assigned To",
      "Created At",
      "SLA Deadline"
    ];
    const rows = filteredGrievances.map((g) =>
      [
        g.id,
        g.complainantName,
        g.mobile,
        g.zone,
        g.gss,
        g.voltageLevel,
        g.category,
        g.priority,
        g.status,
        g.assignedTo,
        g.createdAt,
        g.slaDeadline
      ]
        .map((v) => `"${String(v ?? "").replace(/"/g, '""')}"`)
        .join(",")
    );
    const csv = [headers.join(","), ...rows].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `BSPTCL_Grievances_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    showToast(`Exported ${filteredGrievances.length} records to CSV.`);
  };

  const copyTrackingId = (id) => {
    navigator.clipboard?.writeText(id).catch(() => {});
    setCopiedId(true);
    setTimeout(() => setCopiedId(false), 2000);
  };

  const t = LABELS[lang];

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900">
      {/* Top Official Utility Strip */}
      <div className="bg-[#091c34] text-slate-200 text-xs py-2 px-4 border-b border-slate-800">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap items-center gap-4">
            <span className="inline-flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-amber-400" />
              Vidyut Bhawan, Bailey Road, Patna – 800001
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Mail className="w-3.5 h-3.5 text-amber-400" />
              dgrcell@bsptcl.bihar.gov.in
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Phone className="w-3.5 h-3.5 text-amber-400" />
              Vigilance: 0612-2505559
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setLang(lang === "en" ? "hi" : "en")}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-amber-300 font-medium transition"
            >
              <Globe className="w-3.5 h-3.5" />
              {lang === "en" ? "हिंदी" : "English"}
            </button>

            {authUser ? (
              <div className="inline-flex items-center gap-2 bg-emerald-950/70 border border-emerald-700/60 px-2.5 py-1 rounded text-emerald-200">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                <span className="font-semibold">
                  {authUser.role} ({authUser.zone})
                </span>
                <button
                  onClick={handleLogout}
                  className="ml-1 inline-flex items-center gap-1 text-red-300 hover:text-white font-semibold"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  Logout
                </button>
              </div>
            ) : (
              <button
                onClick={() => setShowLoginModal(true)}
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded bg-amber-500 hover:bg-amber-400 text-slate-950 font-semibold transition"
              >
                <Lock className="w-3.5 h-3.5" />
                Officer / Admin Login
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Main Header */}
      <header className="bg-[#0f294a] text-white shadow-md">
        <div className="max-w-7xl mx-auto px-4 py-4 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-amber-500/20 border border-amber-400/50 flex items-center justify-center shrink-0">
              <Zap className="w-6 h-6 text-amber-400" />
            </div>
            <div>
              <h1 className="text-lg sm:text-xl font-bold tracking-tight leading-tight">{t.org}</h1>
              <p className="text-xs sm:text-sm text-amber-300 font-medium">{t.subtitle}</p>
            </div>
          </div>

          <nav className="flex flex-wrap items-center gap-1.5">
            {[
              { id: "dashboard", label: t.navDashboard, icon: LayoutDashboard, protected: false },
              { id: "lodge", label: t.navLodge, icon: FilePlus2, protected: false },
              { id: "track", label: t.navTrack, icon: Search, protected: false },
              { id: "console", label: t.navConsole, icon: ShieldAlert, protected: true }
            ]
              .filter((item) => !item.protected || Boolean(authUser))
              .map((item) => {
                const Icon = item.icon;
                const active = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => setActiveTab(item.id)}
                    className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-medium transition ${
                      active ? "bg-amber-500 text-slate-950 shadow-sm" : "text-slate-200 hover:bg-white/10"
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    {item.label}
                  </button>
                );
              })}
          </nav>
        </div>
      </header>

      {/* Safety Notice Banner */}
      <div className="bg-amber-50 border-b border-amber-200 px-4 py-2 text-xs text-amber-900">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
            <span>
              <strong>Grid Safety Advisory:</strong> Maintain safe clearance from 132 kV / 220 kV / 400 kV transmission lines &amp; towers. Report sparking or conductor sag immediately as <strong>Critical</strong> priority.
            </span>
          </div>
          <button
            onClick={() => {
              refreshPublic();
              if (authUser) refreshOfficerGrievances();
            }}
            className="inline-flex items-center gap-1 text-amber-800 hover:text-amber-950 font-semibold"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
            Sync Live Data
          </button>
        </div>
      </div>

      {/* Toast */}
      {toast && (
        <div
          className={`fixed bottom-5 right-5 z-50 px-4 py-3 rounded-xl shadow-lg text-sm font-medium flex items-center gap-2 ${
            toast.type === "error" ? "bg-red-600 text-white" : "bg-[#0f294a] text-white"
          }`}
        >
          <CheckCircle2 className="w-4 h-4 text-amber-400" />
          {toast.message}
        </div>
      )}

      {/* Main Content */}
      <main className="max-w-7xl w-full mx-auto px-4 py-6 flex-1">
        {error && (
          <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-200 text-red-800 text-sm flex items-center justify-between">
            <span>{error}</span>
            <button onClick={refreshPublic} className="underline font-semibold">
              Retry
            </button>
          </div>
        )}

        {/* TAB 1: PUBLIC / MONITORING DASHBOARD */}
        {activeTab === "dashboard" && stats && (
          <div className="space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <h2 className="text-lg font-bold text-[#0f294a] flex items-center gap-2">
                  <Building2 className="w-5 h-5 text-amber-600" />
                  State-Wide Transmission Grievance Transparency Dashboard
                </h2>
                <p className="text-xs text-slate-500">
                  {authUser
                    ? `Signed in as ${authUser.name} — Viewing official monitoring metrics`
                    : "Public aggregate statistics across BSPTCL's 5 Transmission Zones (individual records are restricted to authenticated officers)"}
                </p>
              </div>
              <button
                onClick={() => setActiveTab("lodge")}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#0f294a] hover:bg-[#163a66] text-white text-xs font-semibold transition"
              >
                <FilePlus2 className="w-4 h-4 text-amber-400" />
                Lodge New Grievance
              </button>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-6 gap-4">
              {[
                { label: "Total Grievances", value: stats.total, color: "text-[#0f294a]" },
                { label: "Open / Assigned", value: stats.open, color: "text-blue-700" },
                { label: "In Progress", value: stats.inProgress, color: "text-amber-600" },
                { label: "Resolved / Closed", value: stats.resolved, color: "text-emerald-600" },
                { label: "SLA Breached", value: stats.slaBreached, color: "text-red-600" },
                { label: "Avg. Resolution", value: `${stats.avgResolutionHours}h`, color: "text-indigo-700" }
              ].map((kpi) => (
                <div key={kpi.label} className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
                  <p className="text-xs font-medium text-slate-500">{kpi.label}</p>
                  <p className={`text-2xl font-extrabold mt-1 ${kpi.color}`}>{kpi.value}</p>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
                <h3 className="text-base font-bold text-slate-900">Transmission Zone-Wise Grievance Load</h3>
                <p className="text-xs text-slate-500 mb-4">Active vs. Resolved tickets across BSPTCL's 5 Transmission Zones</p>
                <div className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={stats.byZone}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                      <XAxis dataKey="zone" tick={{ fontSize: 12 }} />
                      <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="active" name="Active / Open" fill="#d97706" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="resolved" name="Resolved / Closed" fill="#0f294a" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
                <h3 className="text-base font-bold text-slate-900">Grievances by Category</h3>
                <p className="text-xs text-slate-500 mb-4">Distribution across operational domains</p>
                <div className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={stats.byCategory}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="45%"
                        outerRadius={76}
                        innerRadius={40}
                      >
                        {stats.byCategory.map((_, i) => (
                          <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend wrapperStyle={{ fontSize: "11px" }} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            {/* Officer-Only Watchlist or Citizen Quick-Action Banner */}
            {authUser ? (
              <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
                <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
                  <div>
                    <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                      <Clock className="w-4 h-4 text-red-600" />
                      SLA Breach &amp; Priority Escalation Watchlist ({authUser.zone})
                    </h3>
                    <p className="text-xs text-slate-500">Restricted official view — visible only to authenticated BSPTCL officers</p>
                  </div>
                  {authUser.role === "HQ Admin" && (
                    <button
                      onClick={handleAutoEscalate}
                      className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white text-xs font-semibold transition"
                    >
                      <ArrowUpRight className="w-4 h-4" />
                      Run Auto-Escalation Sweep
                    </button>
                  )}
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-left">
                    <thead className="bg-slate-50 text-slate-600 text-xs uppercase">
                      <tr>
                        <th className="py-2.5 px-3">Tracking ID</th>
                        <th className="py-2.5 px-3">Zone / GSS</th>
                        <th className="py-2.5 px-3">Subject</th>
                        <th className="py-2.5 px-3">Priority</th>
                        <th className="py-2.5 px-3">Status</th>
                        <th className="py-2.5 px-3">SLA</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {grievances
                        .filter((g) => !["Resolved", "Closed"].includes(g.status))
                        .slice(0, 5)
                        .map((g) => (
                          <tr key={g.id} className="hover:bg-slate-50">
                            <td className="py-2.5 px-3 font-mono font-semibold text-[#0f294a]">{g.id}</td>
                            <td className="py-2.5 px-3">
                              <div className="font-medium">{g.zone}</div>
                              <div className="text-xs text-slate-500">{g.gss}</div>
                            </td>
                            <td className="py-2.5 px-3 max-w-xs truncate">{g.subject}</td>
                            <td className="py-2.5 px-3">
                              <span className={`px-2 py-0.5 rounded text-xs font-semibold ${PRIORITY_STYLES[g.priority]}`}>
                                {g.priority}
                              </span>
                            </td>
                            <td className="py-2.5 px-3">
                              <span className={`px-2 py-0.5 rounded border text-xs font-medium ${STATUS_STYLES[g.status]}`}>
                                {g.status}
                              </span>
                            </td>
                            <td className="py-2.5 px-3 text-xs font-semibold">
                              {isSlaBreached(g) ? (
                                <span className="text-red-600">Breached</span>
                              ) : (
                                <span className="text-emerald-700">Within SLA</span>
                              )}
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : (
              <div className="bg-[#0f294a] text-white rounded-2xl p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-sm">
                <div>
                  <h3 className="text-base font-bold">Need to report a Transmission Line, GSS, or RoW issue?</h3>
                  <p className="text-xs text-slate-300 mt-1">
                    Citizens, DISCOMs, vendors, and employees can lodge a grievance online or track an existing ticket by Tracking ID / Mobile Number without logging in.
                  </p>
                </div>
                <div className="flex flex-wrap gap-2 shrink-0">
                  <button
                    onClick={() => setActiveTab("lodge")}
                    className="px-4 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold"
                  >
                    Lodge Grievance
                  </button>
                  <button
                    onClick={() => setActiveTab("track")}
                    className="px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-white text-xs font-semibold"
                  >
                    Track Status
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 2: LODGE GRIEVANCE */}
        {activeTab === "lodge" && meta && (
          <div className="max-w-3xl mx-auto bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
            <h2 className="text-xl font-bold text-[#0f294a]">Lodge a New BSPTCL Grievance</h2>
            <p className="text-sm text-slate-500 mt-1 mb-6">
              Submit transmission line, Grid Sub-Station (GSS), RoW compensation, vendor billing, or HR grievances directly to the concerned Transmission Zone.
            </p>

            <form onSubmit={handleLodgeSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Full Name *</label>
                  <input
                    required
                    value={form.complainantName}
                    onChange={(e) => setForm({ ...form, complainantName: e.target.value })}
                    placeholder="e.g., Ramesh Kumar"
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Stakeholder Type *</label>
                  <select
                    value={form.complainantType}
                    onChange={(e) => setForm({ ...form, complainantType: e.target.value })}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                  >
                    <option>Citizen / Landowner</option>
                    <option>DISCOM / Open Access Consumer</option>
                    <option>BSPTCL Employee</option>
                    <option>Contractor / Vendor</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Mobile Number (10-digit) *</label>
                  <input
                    required
                    pattern="[6-9][0-9]{9}"
                    value={form.mobile}
                    onChange={(e) => setForm({ ...form, mobile: e.target.value })}
                    placeholder="98XXXXXXXX"
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Email Address</label>
                  <input
                    type="email"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    placeholder="name@example.com"
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Transmission Zone *</label>
                  <select
                    value={form.zone}
                    onChange={(e) => handleZoneChange(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                  >
                    {Object.keys(meta.zones).map((z) => (
                      <option key={z} value={z}>{z}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Grid Sub-Station (GSS) *</label>
                  <select
                    value={form.gss}
                    onChange={(e) => setForm({ ...form, gss: e.target.value })}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                  >
                    {(meta.zones[form.zone]?.gssList || []).map((g) => (
                      <option key={g} value={g}>{g}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Voltage Level</label>
                  <select
                    value={form.voltageLevel}
                    onChange={(e) => setForm({ ...form, voltageLevel: e.target.value })}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                  >
                    {meta.voltageLevels.map((v) => (
                      <option key={v} value={v}>{v}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Priority Level *</label>
                  <select
                    value={form.priority}
                    onChange={(e) => setForm({ ...form, priority: e.target.value })}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                  >
                    <option value="Critical">Critical (Safety / Grid Outage - 24h SLA)</option>
                    <option value="High">High (72h SLA)</option>
                    <option value="Medium">Medium (7 Days SLA)</option>
                    <option value="Low">Low (14 Days SLA)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Grievance Category *</label>
                <select
                  value={form.category}
                  onChange={(e) => setForm({ ...form, category: e.target.value })}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                >
                  {meta.categories.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Subject / Brief Title *</label>
                <input
                  required
                  value={form.subject}
                  onChange={(e) => setForm({ ...form, subject: e.target.value })}
                  placeholder="Concise summary of the grievance"
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Detailed Description *</label>
                <textarea
                  required
                  rows={4}
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="Include tower location number, feeder bay name, date of incident, or reference letter number..."
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Supporting Document (Optional)</label>
                <div className="flex items-center gap-3">
                  <label className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-slate-300 bg-slate-50 hover:bg-slate-100 text-xs font-medium cursor-pointer">
                    <Paperclip className="w-4 h-4 text-slate-600" />
                    Choose File
                    <input
                      type="file"
                      className="hidden"
                      onChange={(e) => setForm({ ...form, attachmentName: e.target.files?.[0]?.name || "" })}
                    />
                  </label>
                  <span className="text-xs text-slate-500">
                    {form.attachmentName || "No file selected (PDF, JPG, PNG, XLSX)"}
                  </span>
                </div>
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl bg-[#0f294a] hover:bg-[#163a66] text-white font-semibold text-sm shadow transition"
                >
                  Submit Grievance &amp; Generate Tracking ID
                </button>
              </div>
            </form>
          </div>
        )}

        {/* TAB 3: TRACK STATUS */}
        {activeTab === "track" && (
          <div className="max-w-4xl mx-auto space-y-6">
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
              <h2 className="text-xl font-bold text-[#0f294a]">Track Grievance Status</h2>
              <p className="text-sm text-slate-500 mt-1 mb-4">
                Enter your BSPTCL Tracking ID or registered 10-digit Mobile Number.
              </p>
              <div className="flex flex-col sm:flex-row gap-3">
                <input
                  value={trackQuery}
                  onChange={(e) => setTrackQuery(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleTrackSearch()}
                  placeholder="e.g., BSPTCL-2026-PAT-1001 or 9431012345"
                  className="flex-1 rounded-xl border border-slate-300 px-4 py-2.5 text-sm"
                />
                <button
                  onClick={() => handleTrackSearch()}
                  className="px-6 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-semibold text-sm transition"
                >
                  Track Now
                </button>
              </div>
              <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-slate-500">
                <span>Demo IDs:</span>
                {["BSPTCL-2026-PAT-1001", "BSPTCL-2026-MUZ-1002", "BSPTCL-2026-BGP-1003"].map((id) => (
                  <button
                    key={id}
                    onClick={() => handleTrackSearch(id)}
                    className="px-2.5 py-1 rounded-md bg-slate-100 hover:bg-slate-200 text-[#0f294a] font-mono font-medium"
                  >
                    {id}
                  </button>
                ))}
              </div>
              {trackError && <p className="mt-3 text-sm text-red-600 font-medium">{trackError}</p>}
            </div>

            {trackedList.map((ticket) => (
              <div key={ticket.id} className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-5">
                <div className="flex flex-wrap items-start justify-between gap-4 border-b border-slate-100 pb-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-base font-bold text-[#0f294a]">{ticket.id}</span>
                      <span className={`px-2.5 py-0.5 rounded border text-xs font-semibold ${STATUS_STYLES[ticket.status]}`}>
                        {ticket.status}
                      </span>
                      <span className={`px-2 py-0.5 rounded text-xs font-semibold ${PRIORITY_STYLES[ticket.priority]}`}>
                        {ticket.priority}
                      </span>
                    </div>
                    <h3 className="text-lg font-bold text-slate-900 mt-1">{ticket.subject}</h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {ticket.zone} &bull; {ticket.gss} ({ticket.voltageLevel}) &bull; Assigned to: <strong>{ticket.assignedTo}</strong>
                    </p>
                  </div>
                  {!["Resolved", "Closed", "Escalated"].includes(ticket.status) && (
                    <button
                      onClick={() => handleCitizenEscalate(ticket.id)}
                      className="px-3.5 py-1.5 rounded-lg border border-red-300 text-red-700 hover:bg-red-50 text-xs font-semibold"
                    >
                      Escalate to HQ
                    </button>
                  )}
                </div>

                <p className="text-sm text-slate-700 bg-slate-50 p-3.5 rounded-xl border border-slate-100">
                  {ticket.description}
                </p>

                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">Action &amp; Audit Timeline</h4>
                  <div className="space-y-3 border-l-2 border-amber-400 pl-4">
                    {ticket.timeline.map((step, idx) => (
                      <div key={idx} className="text-sm">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-semibold text-[#0f294a]">{step.status}</span>
                          <span className="text-xs text-slate-400">&bull; {formatDate(step.timestamp)}</span>
                          <span className="text-xs bg-slate-100 px-2 py-0.5 rounded text-slate-600">{step.actor}</span>
                        </div>
                        <p className="text-slate-600 text-xs mt-0.5">{step.remark}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {ticket.status === "Resolved" && (
                  <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 space-y-3">
                    <h4 className="text-sm font-bold text-emerald-900">Rate Redressal &amp; Close Ticket</h4>
                    <div className="flex items-center gap-1">
                      {[1, 2, 3, 4, 5].map((n) => (
                        <button key={n} type="button" onClick={() => setFbRating(n)} className="p-1">
                          <Star className={`w-5 h-5 ${n <= fbRating ? "text-amber-500 fill-amber-500" : "text-slate-300"}`} />
                        </button>
                      ))}
                    </div>
                    <div className="flex flex-col sm:flex-row gap-2">
                      <input
                        value={fbText}
                        onChange={(e) => setFbText(e.target.value)}
                        placeholder="Optional feedback on resolution quality..."
                        className="flex-1 rounded-lg border border-emerald-300 bg-white px-3 py-2 text-sm"
                      />
                      <button
                        onClick={() => handleFeedbackSubmit(ticket.id)}
                        className="px-4 py-2 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white text-sm font-semibold"
                      >
                        Submit &amp; Close
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* TAB 4: PROTECTED OFFICER CONSOLE */}
        {activeTab === "console" && authUser && meta && (
          <div className="space-y-4">
            <div className="bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-3 flex flex-wrap items-center justify-between gap-2 text-xs text-emerald-900">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-700" />
                <span>
                  Authenticated as <strong>{authUser.name}</strong> ({authUser.role}) &mdash; Scope:{" "}
                  <strong>{authUser.zone === "All" ? "All 5 Transmission Zones" : authUser.zone}</strong>
                </span>
              </div>
              {authUser.role === "HQ Admin" && (
                <button
                  onClick={handleAutoEscalate}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-600 hover:bg-red-700 text-white font-semibold"
                >
                  <ArrowUpRight className="w-3.5 h-3.5" />
                  Run HQ Auto-Escalation Sweep
                </button>
              )}
            </div>

            <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm flex flex-wrap items-center gap-3">
              <div className="relative flex-1 min-w-[200px]">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  value={filters.search}
                  onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                  placeholder="Search ID, name, mobile, GSS..."
                  className="w-full pl-9 pr-3 py-2 rounded-lg border border-slate-300 text-sm"
                />
              </div>
              {authUser.role === "HQ Admin" && (
                <select
                  value={filters.zone}
                  onChange={(e) => setFilters({ ...filters, zone: e.target.value })}
                  className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
                >
                  <option value="All">All Zones</option>
                  {Object.keys(meta.zones).map((z) => (
                    <option key={z} value={z}>{z}</option>
                  ))}
                </select>
              )}
              <select
                value={filters.status}
                onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
              >
                <option value="All">All Statuses</option>
                {["Submitted", "Assigned", "In Progress", "Escalated", "Resolved", "Closed"].map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
              <label className="inline-flex items-center gap-1.5 text-xs font-semibold text-red-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={filters.slaOnly}
                  onChange={(e) => setFilters({ ...filters, slaOnly: e.target.checked })}
                />
                SLA Breached Only
              </label>
              <button
                onClick={exportCsv}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-[#0f294a] hover:bg-[#163a66] text-white text-xs font-semibold"
              >
                <Download className="w-4 h-4" />
                Export CSV
              </button>
            </div>

            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-slate-50 text-slate-600 text-xs uppercase border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-4">Tracking ID</th>
                    <th className="py-3 px-4">Complainant</th>
                    <th className="py-3 px-4">Zone &amp; GSS</th>
                    <th className="py-3 px-4">Category &amp; Subject</th>
                    <th className="py-3 px-4">Priority</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredGrievances.map((g) => (
                    <tr key={g.id} className="hover:bg-slate-50">
                      <td className="py-3 px-4 font-mono font-semibold text-[#0f294a] whitespace-nowrap">
                        {g.id}
                        {isSlaBreached(g) && (
                          <span className="block text-[10px] font-sans font-bold text-red-600">SLA BREACHED</span>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-medium">{g.complainantName}</div>
                        <div className="text-xs text-slate-500">{g.mobile}</div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-medium">{g.zone}</div>
                        <div className="text-xs text-slate-500">{g.gss}</div>
                      </td>
                      <td className="py-3 px-4 max-w-xs">
                        <div className="text-xs text-amber-700 font-semibold">{g.category}</div>
                        <div className="truncate text-slate-800">{g.subject}</div>
                      </td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-0.5 rounded text-xs font-semibold ${PRIORITY_STYLES[g.priority]}`}>
                          {g.priority}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-0.5 rounded border text-xs font-medium ${STATUS_STYLES[g.status]}`}>
                          {g.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() => {
                            setSelectedTicket(g);
                            setActionStatus(g.status);
                            setActionOfficer(g.assignedTo);
                            setActionRemark("");
                          }}
                          className="px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-600 text-slate-950 text-xs font-semibold"
                        >
                          Take Action
                        </button>
                      </td>
                    </tr>
                  ))}
                  {!filteredGrievances.length && (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-slate-500">
                        No grievances match the selected filters.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>

      {/* Officer / Admin Login Modal */}
      {showLoginModal && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2 text-[#0f294a] font-bold">
                <Lock className="w-5 h-5 text-amber-600" />
                BSPTCL Officer / Admin Login
              </div>
              <button onClick={() => setShowLoginModal(false)} className="text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleLoginSubmit} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Official Email ID</label>
                <input
                  type="email"
                  required
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  placeholder="admin@bsptcl.in"
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Password</label>
                <input
                  type="password"
                  required
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  placeholder="Enter password"
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                />
              </div>
              {loginError && <p className="text-xs text-red-600 font-medium">{loginError}</p>}
              <button
                type="submit"
                className="w-full py-2.5 rounded-xl bg-[#0f294a] hover:bg-[#163a66] text-white text-sm font-semibold"
              >
                Sign In to Officer Console
              </button>
            </form>

            <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 space-y-2">
              <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                Quick-Fill Demo Credentials (For Evaluation)
              </p>
              <div className="flex flex-wrap gap-1.5">
                {[
                  { label: "HQ Admin (All Zones)", email: "admin@bsptcl.in", pass: "Admin@123" },
                  { label: "Patna Zone Officer", email: "patna@bsptcl.in", pass: "Patna@123" },
                  { label: "Muzaffarpur Officer", email: "muz@bsptcl.in", pass: "Muz@123" }
                ].map((c) => (
                  <button
                    key={c.email}
                    type="button"
                    onClick={() => {
                      setLoginEmail(c.email);
                      setLoginPassword(c.pass);
                      setLoginError("");
                    }}
                    className="px-2.5 py-1 rounded-md bg-white border border-slate-300 hover:border-amber-500 text-xs font-medium text-slate-700"
                  >
                    {c.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Acknowledgement Receipt Modal */}
      {receipt && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-emerald-700 font-bold">
                <CheckCircle2 className="w-6 h-6" />
                Grievance Registered
              </div>
              <button onClick={() => setReceipt(null)} className="text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-center">
              <p className="text-xs text-slate-500 uppercase font-semibold">Official Tracking ID</p>
              <p className="text-xl font-mono font-extrabold text-[#0f294a] mt-1">{receipt.id}</p>
              <button
                onClick={() => copyTrackingId(receipt.id)}
                className="mt-2 inline-flex items-center gap-1.5 text-xs font-semibold text-amber-700 hover:text-amber-900"
              >
                {copiedId ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                {copiedId ? "Copied!" : "Copy Tracking ID"}
              </button>
            </div>
            <div className="text-xs text-slate-600 space-y-1">
              <p><strong>Zone:</strong> {receipt.zone}</p>
              <p><strong>GSS:</strong> {receipt.gss}</p>
              <p><strong>Assigned Desk:</strong> {receipt.assignedTo}</p>
              <p><strong>SLA Deadline:</strong> {formatDate(receipt.slaDeadline)}</p>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => {
                  const id = receipt.id;
                  setReceipt(null);
                  setActiveTab("track");
                  handleTrackSearch(id);
                }}
                className="px-4 py-2 rounded-lg bg-[#0f294a] text-white text-xs font-semibold"
              >
                Track Ticket
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Officer Action Modal */}
      {selectedTicket && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <span className="font-mono text-xs font-bold text-amber-700">{selectedTicket.id}</span>
                <h3 className="text-base font-bold text-[#0f294a]">{selectedTicket.subject}</h3>
              </div>
              <button onClick={() => setSelectedTicket(null)} className="text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>
            <p className="text-xs text-slate-600 bg-slate-50 p-3 rounded-lg">{selectedTicket.description}</p>
            <form onSubmit={handleOfficerUpdate} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Update Status</label>
                <select
                  value={actionStatus}
                  onChange={(e) => setActionStatus(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                >
                  {["Submitted", "Assigned", "In Progress", "Escalated", "Resolved", "Closed"].map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Assigned Officer / Division</label>
                <input
                  value={actionOfficer}
                  onChange={(e) => setActionOfficer(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Official Action Remark *</label>
                <textarea
                  required
                  rows={3}
                  value={actionRemark}
                  onChange={(e) => setActionRemark(e.target.value)}
                  placeholder="Enter inspection findings, order number, or resolution details..."
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedTicket(null)}
                  className="px-4 py-2 rounded-lg border border-slate-300 text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-lg bg-[#0f294a] hover:bg-[#163a66] text-white text-xs font-semibold"
                >
                  Save Update
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="bg-[#091c34] text-slate-400 text-xs py-4 px-4 mt-8">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-2">
          <p>Bihar State Power Transmission Company Limited (BSPTCL) &mdash; Subsidiary of BSPHCL &bull; Vidyut Bhawan, Bailey Road, Patna-800001</p>
          <p>Departmental Grievance Redressal Cell: dgrcell@bsptcl.bihar.gov.in</p>
        </div>
      </footer>
    </div>
  );
}
