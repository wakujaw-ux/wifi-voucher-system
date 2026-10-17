import { useState, useEffect, useRef } from "react";
import {
  RefreshCw,
  Users,
  Clock,
  Wifi,
  WifiOff,
  LogOut,
  Activity,
  Smartphone,
} from "lucide-react";
import toast from "react-hot-toast";
import { sessionApi } from "../api/session.api";
import ConfirmDialog from "../components/ConfirmDialog";
import { useAuth } from "../context/AuthContext";

const AUTO_REFRESH_SECONDS = 30;

const Sessions = () => {
  const { user } = useAuth();

  const [activeSessions, setActiveSessions] = useState([]);
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

  // Pata data
  const fetchData = async () => {
    setLoading(true);
    try {
      const [sessionsRes, statsRes] = await Promise.all([
        sessionApi.getActive(),
        sessionApi.getStats(),
      ]);

      setActiveSessions(sessionsRes.data.sessions || []);
      setStats(statsRes.data.stats);
    } catch (err) {
      toast.error(err.response?.data?.message || "Imeshindwa kupata sessions");
    } finally {
      setLoading(false);
      countdownRef.current = AUTO_REFRESH_SECONDS;
      setCountdown(AUTO_REFRESH_SECONDS);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Auto-refresh kila sekunde 30
  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(() => {
      countdownRef.current -= 1;
      setCountdown(countdownRef.current);

      if (countdownRef.current <= 0) {
        fetchData();
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [autoRefresh]);

  // Format muda
  const formatDuration = (seconds) => {
    if (!seconds && seconds !== 0) return "-";
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;

    if (h > 0) return `${h}h ${m}m`;
    if (m > 0) return `${m}m ${s}s`;
    return `${s}s`;
  };

  // Disconnect
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

  // Expire stale sessions
  const handleExpireStale = async () => {
    try {
      const response = await sessionApi.expireStale();
      const count = response.data.expired_count;
      if (count > 0) {
        toast.success(`Sessions ${count} zime-expire`);
      } else {
        toast.success("Hakuna sessions zilizokwisha muda");
      }
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || "Imeshindwa ku-expire");
    }
  };

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Sessions</h1>
          <p className="text-gray-500 mt-1">Wateja waliopo online sasa</p>
        </div>

        <div className="flex flex-wrap gap-2">
          {/* Auto-refresh toggle */}
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
              Auto-refresh
              {autoRefresh && (
                <span className="ml-1 text-xs text-gray-500">
                  ({countdown}s)
                </span>
              )}
            </label>
          </div>

          <button
            onClick={fetchData}
            disabled={loading}
            className="inline-flex items-center gap-2 bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 font-medium px-4 py-2 rounded-lg transition disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </button>

          {canDisconnect && (
            <button
              onClick={handleExpireStale}
              className="inline-flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white font-medium px-4 py-2 rounded-lg transition"
              title="Kufunga sessions zilizopitwa na wakati"
            >
              <Clock className="w-4 h-4" />
              Expire Stale
            </button>
          )}
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

      {/* Active Sessions Table */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm">
        <div className="p-4 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
            <h2 className="font-medium text-gray-800">
              Wateja Waliopo Online ({activeSessions.length})
            </h2>
          </div>
        </div>

        <div className="overflow-x-auto">
          {loading && activeSessions.length === 0 ? (
            <div className="p-8 text-center text-gray-500">Inapakia...</div>
          ) : activeSessions.length === 0 ? (
            <div className="p-8 text-center">
              <WifiOff className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">Hakuna wateja online kwa sasa</p>
              <p className="text-xs text-gray-400 mt-1">
                Wateja wataonekana hapa wakati wanaingia kwenye Wi-Fi
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
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {activeSessions.map((s) => {
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
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Disconnect Confirmation */}
      <ConfirmDialog
        isOpen={!!disconnectTarget}
        onClose={() => setDisconnectTarget(null)}
        onConfirm={handleDisconnect}
        title="Mtoa Mteja"
        message={`Una uhakika unataka kumtoa mteja "${disconnectTarget?.voucher_code}"? Session yake itafungwa.`}
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
