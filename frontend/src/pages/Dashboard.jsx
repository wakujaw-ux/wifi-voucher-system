import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  TrendingUp,
  Ticket,
  Users,
  Wallet,
  ShoppingCart,
  DollarSign,
  RefreshCw,
  Plus,
  Wifi,
  ArrowUpRight,
  ArrowDownRight,
  Package as PackageIcon,
  Clock,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import toast from "react-hot-toast";
import { dashboardApi } from "../api/dashboard.api";
import { useAuth } from "../context/AuthContext";

const Dashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [summary, setSummary] = useState(null);
  const [chartData, setChartData] = useState([]);
  const [recentActivity, setRecentActivity] = useState([]);
  const [topPackages, setTopPackages] = useState([]);
  const [loading, setLoading] = useState(true);

  const canGenerate = ["ADMIN", "SUPER_ADMIN"].includes(user?.role);
  const canSell = ["ADMIN", "SUPER_ADMIN", "OPERATOR"].includes(user?.role);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [summaryRes, chartRes, activityRes, topRes] = await Promise.all([
        dashboardApi.getSummary(),
        dashboardApi.getSalesChart({ days: 7 }),
        dashboardApi.getRecentActivity({ limit: 5 }),
        dashboardApi.getTopPackages({ limit: 5 }),
      ]);

      setSummary(summaryRes.data.summary);
      setChartData(
        (chartRes.data.chart || []).map((d) => ({
          date: new Date(d.date).toLocaleDateString("sw-TZ", {
            day: "2-digit",
            month: "short",
          }),
          revenue: parseFloat(d.revenue),
          sales: d.sales_count,
        })),
      );
      setRecentActivity(activityRes.data.activity || []);
      setTopPackages(topRes.data.top_packages || []);
    } catch (err) {
      toast.error(err.response?.data?.message || "Imeshindwa kupata data");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const formatCurrency = (value) => {
    const num = parseFloat(value);
    const safe = isNaN(num) ? 0 : num;
    return `TZS ${safe.toLocaleString("en-US", { maximumFractionDigits: 0 })}`;
  };

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">
            Karibu, {user?.full_name || user?.username}!
          </h1>
          <p className="text-gray-500 mt-1">Muhtasari wa biashara yako leo</p>
        </div>

        <button
          onClick={fetchData}
          disabled={loading}
          className="inline-flex items-center gap-2 bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 font-medium px-4 py-2 rounded-lg transition disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </button>
      </div>

      {/* Loading */}
      {loading && !summary ? (
        <div className="p-8 text-center text-gray-500">Inapakia...</div>
      ) : (
        <>
          {/* Stat Cards */}
          {summary && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              <StatCard
                icon={TrendingUp}
                label="Mauzo ya Leo"
                value={summary.sales.today_count}
                subValue={`${formatCurrency(summary.sales.today_revenue)}`}
                color="text-blue-600"
                bgColor="bg-blue-50"
              />
              <StatCard
                icon={DollarSign}
                label="Jumla ya Mapato"
                value={formatCurrency(summary.sales.total_revenue)}
                subValue={`Faida: ${formatCurrency(summary.profit.total)}`}
                subValueColor={
                  parseFloat(summary.profit.total) >= 0
                    ? "text-green-600"
                    : "text-red-600"
                }
                color="text-green-600"
                bgColor="bg-green-50"
              />
              <StatCard
                icon={Users}
                label="Wateja Online"
                value={summary.users.online_users}
                subValue={`${summary.vouchers.total} vocha zote`}
                color="text-purple-600"
                bgColor="bg-purple-50"
              />
              <StatCard
                icon={Ticket}
                label="Vocha Zilizopo"
                value={summary.vouchers.available}
                subValue={`${summary.vouchers.sold} zimeuzwa`}
                color="text-orange-600"
                bgColor="bg-orange-50"
              />
            </div>
          )}

          {/* Quick Actions */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
            {canGenerate && (
              <QuickAction
                icon={Plus}
                label="Zalisha Vocha"
                onClick={() => navigate("/vouchers")}
                color="bg-blue-600 hover:bg-blue-700"
              />
            )}
            {canSell && (
              <QuickAction
                icon={ShoppingCart}
                label="Uza Vocha"
                onClick={() => navigate("/vouchers")}
                color="bg-green-600 hover:bg-green-700"
              />
            )}
            <QuickAction
              icon={Wifi}
              label="Sessions"
              onClick={() => navigate("/sessions")}
              color="bg-purple-600 hover:bg-purple-700"
            />
            <QuickAction
              icon={Wallet}
              label="Ongeza Matumizi"
              onClick={() => navigate("/expenses")}
              color="bg-orange-600 hover:bg-orange-700"
            />
          </div>

          {/* Row 2: Chart + Voucher Breakdown */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
            {/* Chart */}
            <div className="lg:col-span-2 bg-white rounded-xl border border-gray-100 shadow-sm p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-medium text-gray-800">Mapato kwa Siku 7</h3>
                <span className="text-xs text-gray-500">Siku 7 zilizopita</span>
              </div>
              {chartData.length === 0 ? (
                <div className="h-64 flex items-center justify-center text-gray-400 text-sm">
                  Hakuna mauzo katika kipindi hiki
                </div>
              ) : (
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                      <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                      <YAxis tick={{ fontSize: 12 }} />
                      <Tooltip
                        formatter={(value) => formatCurrency(value)}
                        contentStyle={{
                          borderRadius: 8,
                          border: "1px solid #e5e7eb",
                        }}
                      />
                      <Bar
                        dataKey="revenue"
                        fill="#3b82f6"
                        radius={[4, 4, 0, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>

            {/* Voucher Breakdown */}
            {summary && (
              <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
                <h3 className="font-medium text-gray-800 mb-4">
                  Vocha kwa Status
                </h3>
                <div className="space-y-3">
                  <BreakdownRow
                    label="Available"
                    value={summary.vouchers.available}
                    color="bg-blue-500"
                    total={summary.vouchers.total}
                  />
                  <BreakdownRow
                    label="Sold"
                    value={summary.vouchers.sold}
                    color="bg-yellow-500"
                    total={summary.vouchers.total}
                  />
                  <BreakdownRow
                    label="Active"
                    value={summary.vouchers.active}
                    color="bg-green-500"
                    total={summary.vouchers.total}
                  />
                  <BreakdownRow
                    label="Used"
                    value={summary.vouchers.used}
                    color="bg-purple-500"
                    total={summary.vouchers.total}
                  />
                  <BreakdownRow
                    label="Revoked"
                    value={summary.vouchers.revoked}
                    color="bg-red-500"
                    total={summary.vouchers.total}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Row 3: Recent Activity + Top Packages */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Recent Activity */}
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-medium text-gray-800">
                  Mauzo ya Hivi Karibuni
                </h3>
                <button
                  onClick={() => navigate("/sales")}
                  className="text-xs text-primary-600 hover:text-primary-700 font-medium"
                >
                  Ona zote →
                </button>
              </div>
              {recentActivity.length === 0 ? (
                <div className="text-center py-8 text-gray-400 text-sm">
                  Hakuna mauzo bado
                </div>
              ) : (
                <div className="space-y-3">
                  {recentActivity.map((sale) => (
                    <div
                      key={sale.id}
                      className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg transition"
                    >
                      <div className="flex items-center gap-3">
                        <div className="bg-green-50 p-2 rounded-lg">
                          <ShoppingCart className="w-4 h-4 text-green-600" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-800">
                            {sale.package_name}
                          </p>
                          <p className="text-xs text-gray-500 font-mono">
                            {sale.voucher_code} ·{" "}
                            {new Date(sale.created_at).toLocaleTimeString(
                              "sw-TZ",
                              { hour: "2-digit", minute: "2-digit" },
                            )}
                          </p>
                        </div>
                      </div>
                      <span className="text-sm font-medium text-gray-800">
                        {formatCurrency(sale.amount)}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Top Packages */}
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-medium text-gray-800">
                  Packages Zinazouza Zaidi
                </h3>
                <button
                  onClick={() => navigate("/reports")}
                  className="text-xs text-primary-600 hover:text-primary-700 font-medium"
                >
                  Ripoti →
                </button>
              </div>
              {topPackages.length === 0 ? (
                <div className="text-center py-8 text-gray-400 text-sm">
                  Hakuna data bado
                </div>
              ) : (
                <div className="space-y-3">
                  {topPackages.map((pkg, index) => (
                    <div
                      key={pkg.package_id}
                      className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg transition"
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
                            index === 0
                              ? "bg-yellow-100 text-yellow-700"
                              : index === 1
                                ? "bg-gray-200 text-gray-700"
                                : index === 2
                                  ? "bg-orange-100 text-orange-700"
                                  : "bg-gray-100 text-gray-600"
                          }`}
                        >
                          {index + 1}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-800">
                            {pkg.package_name}
                          </p>
                          <p className="text-xs text-gray-500">
                            {pkg.sales_count} mauzo
                          </p>
                        </div>
                      </div>
                      <span className="text-sm font-medium text-green-600">
                        {formatCurrency(pkg.revenue)}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

// ============================================================
// SHARED COMPONENTS
// ============================================================
const StatCard = ({
  icon: Icon,
  label,
  value,
  subValue,
  subValueColor = "text-gray-500",
  color,
  bgColor,
}) => (
  <div className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm hover:shadow-md transition">
    <div className="flex items-center justify-between mb-3">
      <p className="text-sm text-gray-500">{label}</p>
      <div className={`${bgColor} p-2 rounded-lg`}>
        <Icon className={`w-5 h-5 ${color}`} />
      </div>
    </div>
    <p className="text-2xl font-bold text-gray-800">{value}</p>
    {subValue && <p className={`text-xs mt-1 ${subValueColor}`}>{subValue}</p>}
  </div>
);

const QuickAction = ({ icon: Icon, label, onClick, color }) => (
  <button
    onClick={onClick}
    className={`${color} text-white rounded-lg p-4 flex flex-col items-center gap-2 transition`}
  >
    <Icon className="w-6 h-6" />
    <span className="text-xs font-medium">{label}</span>
  </button>
);

const BreakdownRow = ({ label, value, color, total }) => {
  const percent = total > 0 ? (value / total) * 100 : 0;
  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs text-gray-600">{label}</span>
        <span className="text-xs font-medium text-gray-800">{value}</span>
      </div>
      <div className="w-full bg-gray-100 rounded-full h-2">
        <div
          className={`${color} h-2 rounded-full transition-all`}
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  );
};

export default Dashboard;
