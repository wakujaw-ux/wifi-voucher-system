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
  Activity,
  Loader2,
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
        })),
      );
      setRecentActivity(activityRes.data.activity || []);
      setTopPackages(topRes.data.top_packages || []);
    } catch (err) {
      toast.error(err.message || "Imeshindwa kupata data");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const formatCurrency = (value) => {
    const num = parseFloat(value);
    return `TZS ${isNaN(num) ? 0 : num.toLocaleString("en-US", { maximumFractionDigits: 0 })}`;
  };

  if (loading && !summary) {
    return (
      <div className="h-96 flex flex-col items-center justify-center text-primary-600">
        <Loader2 className="w-10 h-10 animate-spin mb-4" />
        <p className="font-medium text-gray-500">Inapakia takwimu...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in-up">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">
            Karibu, {user?.full_name?.split(" ")[0] || user?.username}!
          </h1>
          <p className="text-gray-500 mt-1">
            Hii ni muhtasari wa biashara yako leo.
          </p>
        </div>
        <button
          onClick={fetchData}
          disabled={loading}
          className="inline-flex items-center gap-2 bg-white border border-gray-200 shadow-sm hover:bg-gray-50 text-gray-700 font-medium px-4 py-2 rounded-xl transition disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </button>
      </div>

      {/* 4 Stat Cards */}
      {summary && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="Mauzo ya Leo"
            value={summary.sales.today_count}
            subtext={formatCurrency(summary.sales.today_revenue)}
            icon={TrendingUp}
            color="text-blue-600"
            bg="bg-blue-50"
          />
          <StatCard
            title="Jumla ya Mapato"
            value={formatCurrency(summary.sales.total_revenue)}
            subtext={`Faida: ${formatCurrency(summary.profit.total)}`}
            subtextColor={
              parseFloat(summary.profit.total) >= 0
                ? "text-green-600"
                : "text-red-600"
            }
            icon={DollarSign}
            color="text-green-600"
            bg="bg-green-50"
          />
          <StatCard
            title="Wateja Online"
            value={summary.users.online_users}
            subtext={`${summary.vouchers.total} vocha zote`}
            icon={Users}
            color="text-purple-600"
            bg="bg-purple-50"
          />
          <StatCard
            title="Vocha Zilizopo"
            value={summary.vouchers.available}
            subtext={`${summary.vouchers.sold} zimeuzwa`}
            icon={Ticket}
            color="text-orange-600"
            bg="bg-orange-50"
          />
        </div>
      )}

      {/* Quick Actions */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        {canGenerate && (
          <QuickAction
            icon={Plus}
            label="Zalisha Vocha"
            onClick={() => navigate("/vouchers")}
            color="from-blue-500 to-blue-600"
          />
        )}
        {canSell && (
          <QuickAction
            icon={ShoppingCart}
            label="Uza Vocha"
            onClick={() => navigate("/vouchers")}
            color="from-green-500 to-green-600"
          />
        )}
        <QuickAction
          icon={Wifi}
          label="Sessions"
          onClick={() => navigate("/sessions")}
          color="from-purple-500 to-purple-600"
        />
        <QuickAction
          icon={Wallet}
          label="Matumizi"
          onClick={() => navigate("/expenses")}
          color="from-orange-500 to-orange-600"
        />
      </div>

      {/* Main Grid: Chart & Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Chart */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-bold text-gray-800">Mapato ya Siku 7</h3>
          </div>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={chartData}
                margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  vertical={false}
                  stroke="#f3f4f6"
                />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 12, fill: "#6b7280" }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 12, fill: "#6b7280" }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(val) => `TZS ${val / 1000}k`}
                />
                <Tooltip
                  formatter={(value) => formatCurrency(value)}
                  cursor={{ fill: "#f9fafb" }}
                  contentStyle={{
                    borderRadius: 12,
                    border: "none",
                    boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
                  }}
                />
                <Bar
                  dataKey="revenue"
                  fill="#3b82f6"
                  radius={[6, 6, 0, 0]}
                  barSize={40}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Top Packages */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <h3 className="font-bold text-gray-800 mb-6">Vifurushi Vinavyouza</h3>
          <div className="space-y-5">
            {topPackages.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-10">
                Hakuna data
              </p>
            ) : (
              topPackages.map((pkg, index) => (
                <div
                  key={pkg.package_id}
                  className="flex items-center justify-between group"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs ${
                        index === 0
                          ? "bg-amber-100 text-amber-700"
                          : index === 1
                            ? "bg-gray-200 text-gray-700"
                            : "bg-orange-50 text-orange-600"
                      }`}
                    >
                      #{index + 1}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-800 group-hover:text-primary-600 transition">
                        {pkg.package_name}
                      </p>
                      <p className="text-xs text-gray-500">
                        {pkg.sales_count} mauzo
                      </p>
                    </div>
                  </div>
                  <span className="text-sm font-bold text-gray-800">
                    {formatCurrency(pkg.revenue)}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// Helper Components
const StatCard = ({
  title,
  value,
  subtext,
  subtextColor = "text-gray-500",
  icon: Icon,
  color,
  bg,
}) => (
  <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm hover:shadow-md transition">
    <div className="flex items-center justify-between mb-4">
      <p className="text-sm font-medium text-gray-500">{title}</p>
      <div className={`${bg} p-2.5 rounded-xl`}>
        <Icon className={`w-5 h-5 ${color}`} />
      </div>
    </div>
    <div>
      <h2 className="text-2xl font-bold text-gray-800">{value}</h2>
      {subtext && (
        <p className={`text-xs font-medium mt-1 ${subtextColor}`}>{subtext}</p>
      )}
    </div>
  </div>
);

const QuickAction = ({ icon: Icon, label, onClick, color }) => (
  <button
    onClick={onClick}
    className={`bg-gradient-to-br ${color} text-white rounded-2xl p-4 flex flex-col items-center justify-center gap-2 shadow-sm hover:shadow-md transform hover:-translate-y-1 transition-all duration-200`}
  >
    <Icon className="w-6 h-6" />
    <span className="text-sm font-semibold">{label}</span>
  </button>
);

export default Dashboard;
