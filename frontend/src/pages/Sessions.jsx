import { useState, useEffect, useRef, useCallback } from "react";
import {
  RefreshCw,
  Users,
  Clock,
  Wifi,
  WifiOff,
  LogOut,
  Activity,
  History,
} from "lucide-react";
import toast from "react-hot-toast";
import { sessionApi } from "../api/session.api";
import ConfirmDialog from "../components/ConfirmDialog";
import { useAuth } from "../context/AuthContext";

const AUTO_REFRESH_SECONDS = 10;

const Sessions = () => {
  const { user } = useAuth();

  // State ya Tabs
  const [activeTab, setActiveTab] = useState("active"); // 'active' au 'history'

  const [sessions, setSessions] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [countdown, setCountdown] = useState(AUTO_REFRESH_SECONDS);

  const [disconnectTarget, setDisconnectTarget] = useState(null);
  const [disconnecting, setDisconnecting] = useState(false);

  const canDisconnect = ["ADMIN", "SUPER_ADMIN", "OPERATOR"].includes(
    user?.role,
  );
  const countdownRef = useRef(AUTO_REFRESH_SECONDS);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      // Chagua API kulingana na Tab
      const apiCall =
        activeTab === "active" ? sessionApi.getActive() : sessionApi.getAll();

      const [sessionsRes, statsRes] = await Promise.all([
        apiCall,
        sessionApi.getStats(),
      ]);

      setSessions(sessionsRes.data.sessions || []);
      setStats(statsRes.data.stats);
    } catch (err) {
      toast.error(err.response?.data?.message || "Imeshindwa kupata data");
    } finally {
      setLoading(false);
      countdownRef.current = AUTO_REFRESH_SECONDS;
      setCountdown(AUTO_REFRESH_SECONDS);
    }
  }, [activeTab]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Auto-refresh inafanya kazi tu kwenye Tab ya 'Active'
  useEffect(() => {
    if (!autoRefresh || activeTab === "history") return;

    const interval = setInterval(() => {
      countdownRef.current -= 1;
      setCountdown(countdownRef.current);

      if (countdownRef.current <= 0) {
        fetchData();
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [autoRefresh, activeTab, fetchData]);

  const formatDuration = (seconds) => {
    if (!seconds && seconds !== 0) return "-";
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    if (h > 0) return `${h}h ${m}m`;
    if (m > 0) return `${m}m ${s}s`;
    return `${s}s`;
  };

  const handleDisconnect = async () => {
    if (!disconnectTarget) return;
    setDisconnecting(true);
    try {
      await sessionApi.disconnect(disconnectTarget.id, {
        reason: "Admin amemtoa",
      });
      toast.success(
        `Session ya ${disconnectTarget.voucher_code} imedisconnect`,
      );
      setDisconnectTarget(null);
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || "Imeshindwa kudisconnect");
    } finally {
      setDisconnecting(false);
    }
  };

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Sessions</h1>
          <p className="text-gray-500 mt-1">Usimamizi wa wateja wa Wi-Fi</p>
        </div>

        <div className="flex flex-wrap gap-2">
          {activeTab === "active" && (
            <div className="flex items-center gap-2 bg-white border border-gray-300 rounded-lg px-3 py-2">
              <input
                type="checkbox"
                id="auto-refresh"
                checked={autoRefresh}
                onChange={(e) => setAutoRefresh(e.target.checked)}
                className="w-4 h-4 rounded"
              />
              <label
                htmlFor="auto-refresh"
                className="text-sm text-gray-700 cursor-pointer select-none"
              >
                Auto-refresh{" "}
                {autoRefresh && (
                  <span className="ml-1 text-xs text-gray-500">
                    ({countdown}s)
                  </span>
                )}
              </label>
            </div>
          )}

          <button
            onClick={fetchData}
            disabled={loading}
            className="inline-flex items-center gap-2 bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 font-medium px-4 py-2 rounded-lg transition disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />{" "}
            Refresh
          </button>
        </div>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
          <StatCard
            icon={Wifi}
            label="Online Sasa"
            value={stats.active_sessions}
            color="text-green-600"
            bgColor="bg-green-50"
          />
          <StatCard
            icon={Users}
            label="Jumla Sessions"
            value={stats.total_sessions}
            color="text-blue-600"
            bgColor="bg-blue-50"
          />
          <StatCard
            icon={WifiOff}
            label="Expired"
            value={stats.expired_sessions}
            color="text-orange-600"
            bgColor="bg-orange-50"
          />
          <StatCard
            icon={Activity}
            label="Wastani Muda"
            value={formatDuration(stats.avg_duration_seconds)}
            color="text-purple-600"
            bgColor="bg-purple-50"
          />
        </div>
      )}

      {/* Tabs */}
      <div className="flex bg-white rounded-xl border border-gray-100 shadow-sm mb-6">
        <button
          onClick={() => setActiveTab("active")}
          className={`flex items-center justify-center gap-2 flex-1 py-4 text-sm font-medium border-b-2 transition ${
            activeTab === "active"
              ? "border-primary-600 text-primary-600"
              : "border-transparent text-gray-500 hover:text-gray-800"
          }`}
        >
          <Wifi className="w-4 h-4" /> Waliopo Online
        </button>
        <button
          onClick={() => setActiveTab("history")}
          className={`flex items-center justify-center gap-2 flex-1 py-4 text-sm font-medium border-b-2 transition ${
            activeTab === "history"
              ? "border-primary-600 text-primary-600"
              : "border-transparent text-gray-500 hover:text-gray-800"
          }`}
        >
          <History className="w-4 h-4" /> Historia ya Sessions
        </button>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm">
        <div className="overflow-x-auto">
          {loading && sessions.length === 0 ? (
            <div className="p-8 text-center text-gray-500">Inapakia...</div>
          ) : sessions.length === 0 ? (
            <div className="p-8 text-center">
              <WifiOff className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">
                {activeTab === "active"
                  ? "Hakuna wateja online kwa sasa"
                  : "Hakuna historia ya sessions"}
              </p>
            </div>
          ) : (
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">
                    Voucher
                  </th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">
                    Package
                  </th>
                  {activeTab === "active" ? (
                    <>
                      <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">
                        IP / MAC
                      </th>
                      <th className="text-right px-6 py-3 text-xs font-medium text-gray-500 uppercase">
                        Muda Uliotumika
                      </th>
                      <th className="text-right px-6 py-3 text-xs font-medium text-gray-500 uppercase">
                        Uliobaki
                      </th>
                      <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">
                        Login
                      </th>
                      {canDisconnect && (
                        <th className="text-right px-6 py-3 text-xs font-medium text-gray-500 uppercase">
                          Vitendo
                        </th>
                      )}
                    </>
                  ) : (
                    <>
                      <th className="text-center px-6 py-3 text-xs font-medium text-gray-500 uppercase">
                        Status
                      </th>
                      <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">
                        Login
                      </th>
                      <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">
                        Logout
                      </th>
                      <th className="text-right px-6 py-3 text-xs font-medium text-gray-500 uppercase">
                        Jumla Muda
                      </th>
                    </>
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {sessions.map((s) => {
                  const remaining = s.remaining_seconds || 0;
                  const remainingColor =
                    remaining < 300
                      ? "text-red-600"
                      : remaining < 600
                        ? "text-orange-600"
                        : "text-green-600";

                  return (
                    <tr key={s.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <span className="font-mono font-medium text-gray-800">
                          {s.voucher_code}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-gray-700 text-sm">
                        {s.package_name}
                      </td>

                      {activeTab === "active" ? (
                        <>
                          <td className="px-6 py-4 text-gray-600 text-sm">
                            <div className="flex flex-col">
                              <span>{s.ip_address || "-"}</span>
                              <span className="text-xs text-gray-400">
                                {s.mac_address || "-"}
                              </span>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-right text-gray-700 text-sm">
                            {formatDuration(s.elapsed_seconds)}
                          </td>
                          <td
                            className={`px-6 py-4 text-right font-medium text-sm ${remainingColor}`}
                          >
                            {formatDuration(remaining)}
                          </td>
                          <td className="px-6 py-4 text-gray-600 text-sm">
                            {new Date(s.login_at).toLocaleTimeString("sw-TZ", {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </td>
                          {canDisconnect && (
                            <td className="px-6 py-4 text-right">
                              <button
                                onClick={() => setDisconnectTarget(s)}
                                className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition"
                                title="Mtoa mteja"
                              >
                                <LogOut className="w-4 h-4" />
                              </button>
                            </td>
                          )}
                        </>
                      ) : (
                        <>
                          <td className="px-6 py-4 text-center">
                            <span
                              className={`inline-block px-2 py-1 text-xs font-medium rounded-full ${
                                s.status === "DISCONNECTED"
                                  ? "bg-gray-100 text-gray-700"
                                  : "bg-orange-100 text-orange-700"
                              }`}
                            >
                              {s.status}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-gray-600 text-sm">
                            {new Date(s.login_at).toLocaleString("sw-TZ", {
                              dateStyle: "short",
                              timeStyle: "short",
                            })}
                          </td>
                          <td className="px-6 py-4 text-gray-600 text-sm">
                            {s.logout_at
                              ? new Date(s.logout_at).toLocaleString("sw-TZ", {
                                  dateStyle: "short",
                                  timeStyle: "short",
                                })
                              : "-"}
                          </td>
                          <td className="px-6 py-4 text-right font-medium text-gray-800 text-sm">
                            {formatDuration(s.duration_seconds)}
                          </td>
                        </>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>

      <ConfirmDialog
        isOpen={!!disconnectTarget}
        onClose={() => setDisconnectTarget(null)}
        onConfirm={handleDisconnect}
        title="Mtoa Mteja"
        message={`Una uhakika unataka kumtoa mteja "${disconnectTarget?.voucher_code}"? Vocha yake itabaki ACTIVE hadi muda uishe.`}
        confirmText="Mtoa"
        variant="danger"
        loading={disconnecting}
      />
    </div>
  );
};

const StatCard = ({ icon: Icon, label, value, color, bgColor }) => (
  <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
    <div className="flex items-center justify-between">
      <div>
        <p className="text-xs text-gray-500">{label}</p>
        <p className="text-xl font-bold text-gray-800 mt-1">{value}</p>
      </div>
      <div className={`${bgColor} p-2 rounded-lg`}>
        <Icon className={`w-5 h-5 ${color}`} />
      </div>
    </div>
  </div>
);

export default Sessions;
