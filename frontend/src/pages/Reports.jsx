import { useState, useEffect, useCallback } from "react";
import {
  BarChart3,
  TrendingUp,
  DollarSign,
  Ticket,
  RefreshCw,
  ShoppingCart,
  ArrowUpRight,
  ArrowDownRight,
  Download,
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
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import toast from "react-hot-toast";
import { reportApi } from "../api/report.api";
import DateRangeFilter from "../components/DateRangeFilter";
import { useSearchParams } from "react-router-dom";
import client from "../api/client";

const TABS = [
  { id: "sales", label: "Mauzo", icon: ShoppingCart },
  { id: "vouchers", label: "Voucha", icon: Ticket },
  { id: "revenue", label: "Mapato", icon: DollarSign },
  { id: "profit-loss", label: "Faida/Hasara", icon: TrendingUp },
];

const CHART_COLORS = [
  "#3b82f6",
  "#10b981",
  "#f59e0b",
  "#ef4444",
  "#8b5cf6",
  "#ec4899",
];

const Reports = () => {
  const [searchParams] = useSearchParams();
  const initialTab = searchParams.get("tab") || "sales";
  const [activeTab, setActiveTab] = useState(initialTab);

  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);

  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [appliedFilters, setAppliedFilters] = useState({});

  const fetchReport = useCallback(async () => {
    setLoading(true);
    try {
      const filters = { ...appliedFilters };
      let response;

      switch (activeTab) {
        case "sales":
          response = await reportApi.sales(filters);
          break;
        case "vouchers":
          response = await reportApi.vouchers(filters);
          break;
        case "revenue":
          response = await reportApi.revenue(filters);
          break;
        case "profit-loss":
          response = await reportApi.profitLoss(filters);
          break;
        default:
          return;
      }

      setData(response.data.report);
    } catch (err) {
      toast.error(err.response?.data?.message || "Imeshindwa kupata ripoti");
    } finally {
      setLoading(false);
    }
  }, [activeTab, appliedFilters]);

  useEffect(() => {
    fetchReport();
  }, [fetchReport]);

  const handleApply = (quickFrom, quickTo) => {
    const isEvent = quickFrom && quickFrom.nativeEvent;
    const finalFrom = isEvent ? fromDate : quickFrom;
    const finalTo = isEvent ? toDate : quickTo;

    setAppliedFilters({
      from_date: finalFrom || undefined,
      to_date: finalTo ? finalTo + "T23:59:59" : undefined,
    });
  };

  const handleClear = () => {
    setFromDate("");
    setToDate("");
    setAppliedFilters({});
  };

  const handleDownload = async () => {
    try {
      const params = new URLSearchParams();
      params.append("type", activeTab);
      if (appliedFilters.from_date)
        params.append("from_date", appliedFilters.from_date);
      if (appliedFilters.to_date)
        params.append("to_date", appliedFilters.to_date);

      const response = await client.get(
        `/reports/export?${params.toString()}`,
        {
          responseType: "blob",
        },
      );

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `Ripoti_${activeTab}_${Date.now()}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      toast.error(err.response?.data?.message || "Imeshindwa kupakua ripoti");
    }
  };

  const formatCurrency = (value) => {
    const num = parseFloat(value);
    const safe = isNaN(num) ? 0 : num;
    return `TZS ${safe.toLocaleString("en-US", { maximumFractionDigits: 0 })}`;
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return "-";
    return new Date(dateStr).toLocaleDateString("sw-TZ", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  return (
    <div className="space-y-6 animate-fade-in-up">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Ripoti</h1>
          <p className="text-gray-500 mt-1">
            Uchambuzi wa biashara kwa kipindi
          </p>
        </div>

        <div className="flex gap-2">
          <button
            onClick={handleDownload}
            className="inline-flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white font-medium px-4 py-2 rounded-xl transition shadow-sm"
          >
            <Download className="w-4 h-4" /> Download Excel
          </button>
          <button
            onClick={fetchReport}
            disabled={loading}
            className="inline-flex items-center gap-2 bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 font-medium px-4 py-2 rounded-xl transition shadow-sm disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />{" "}
            Refresh
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-1.5 flex overflow-x-auto">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          const active = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 flex items-center justify-center gap-2 px-6 py-3 text-sm font-semibold rounded-xl whitespace-nowrap transition-all duration-200 ${
                active
                  ? "bg-primary-50 text-primary-700 shadow-sm"
                  : "text-gray-500 hover:text-gray-800 hover:bg-gray-50"
              }`}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Date Filter */}
      <DateRangeFilter
        fromDate={fromDate}
        toDate={toDate}
        onFromChange={setFromDate}
        onToChange={setToDate}
        onApply={handleApply}
        onClear={handleClear}
      />

      {/* Content */}
      {loading ? (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-12 flex flex-col items-center justify-center text-gray-500">
          <Loader2 className="w-8 h-8 animate-spin text-primary-500 mb-3" />
          <p>Inapakia ripoti...</p>
        </div>
      ) : !data ? (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-12 text-center">
          <BarChart3 className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 font-medium">
            Hakuna data kwa kipindi hiki
          </p>
        </div>
      ) : (
        <div className="animate-fade-in">
          {activeTab === "sales" && (
            <SalesReport
              data={data}
              formatCurrency={formatCurrency}
              formatDate={formatDate}
            />
          )}
          {activeTab === "vouchers" && <VouchersReport data={data} />}
          {activeTab === "revenue" && (
            <RevenueReport data={data} formatCurrency={formatCurrency} />
          )}
          {activeTab === "profit-loss" && (
            <ProfitLossReport data={data} formatCurrency={formatCurrency} />
          )}
        </div>
      )}
    </div>
  );
};

// --- REPORTS SUB-COMPONENTS ---

const SalesReport = ({ data, formatCurrency, formatDate }) => {
  const chartData = (data.by_period || []).map((p) => ({
    period: formatDate(p.period),
    revenue: parseFloat(p.revenue),
  }));

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <SummaryCard
          label="Jumla ya Mauzo"
          value={data.summary.total_sales}
          icon={ShoppingCart}
          color="text-blue-600"
          bgColor="bg-blue-50"
        />
        <SummaryCard
          label="Jumla ya Mapato"
          value={formatCurrency(data.summary.total_revenue)}
          icon={DollarSign}
          color="text-green-600"
          bgColor="bg-green-50"
        />
        <SummaryCard
          label="Wastani kwa Mauzo"
          value={formatCurrency(data.summary.average_sale)}
          icon={TrendingUp}
          color="text-purple-600"
          bgColor="bg-purple-50"
        />
      </div>

      {chartData.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <h3 className="font-bold text-gray-800 mb-6">Mapato kwa Kipindi</h3>
          <div className="h-72">
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
                  dataKey="period"
                  tick={{ fontSize: 12, fill: "#6b7280" }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 12, fill: "#6b7280" }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(val) => `${val / 1000}k`}
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
      )}

      {data.by_package?.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-gray-100">
            <h3 className="font-bold text-gray-800">Mauzo kwa Package</h3>
          </div>
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50/50">
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Package
                </th>
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider text-right">
                  Mauzo
                </th>
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider text-right">
                  Mapato
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {data.by_package.map((p, index) => (
                <tr
                  key={`${p.package_id}-${p.sale_date}-${index}`}
                  className="hover:bg-gray-50/80 transition-colors"
                >
                  <td className="px-6 py-4 text-sm text-gray-800 font-medium">
                    {p.package_name}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600 text-right">
                    {p.sales_count}
                  </td>
                  <td className="px-6 py-4 text-sm font-bold text-gray-800 text-right">
                    {formatCurrency(p.revenue)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

const VouchersReport = ({ data }) => {
  const pieData = (data.by_status || []).map((s) => ({
    name: s.status,
    value: s.count,
  }));
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {pieData.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <h3 className="font-bold text-gray-800 mb-6">Voucha kwa Status</h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={90}
                  label={({ name, value }) => `${name}: ${value}`}
                >
                  {pieData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={CHART_COLORS[index % CHART_COLORS.length]}
                    />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    borderRadius: 12,
                    border: "none",
                    boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
                  }}
                />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-gray-100">
          <h3 className="font-bold text-gray-800">Muhtasari kwa Status</h3>
        </div>
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-50/50">
              <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider text-right">
                Idadi
              </th>
              <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider text-right">
                Thamani
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {(data.by_status || []).map((s) => (
              <tr
                key={s.status}
                className="hover:bg-gray-50/80 transition-colors"
              >
                <td className="px-6 py-4 text-sm font-medium text-gray-800">
                  {s.status}
                </td>
                <td className="px-6 py-4 text-sm text-gray-600 text-right">
                  {s.count}
                </td>
                <td className="px-6 py-4 text-sm font-bold text-gray-800 text-right">
                  TZS {parseFloat(s.value).toLocaleString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

const RevenueReport = ({ data, formatCurrency }) => {
  const safeData = {
    total: data?.total || { total_transactions: 0, total_revenue: "0" },
    by_method: data?.by_method || [],
  };
  const pieData = safeData.by_method.map((m) => ({
    name: m.method,
    value: parseFloat(m.revenue || 0),
  }));
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <SummaryCard
          label="Jumla ya Miamala"
          value={safeData.total.total_transactions || 0}
          icon={ShoppingCart}
          color="text-blue-600"
          bgColor="bg-blue-50"
        />
        <SummaryCard
          label="Jumla ya Mapato"
          value={formatCurrency(safeData.total.total_revenue || 0)}
          icon={DollarSign}
          color="text-green-600"
          bgColor="bg-green-50"
        />
      </div>
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-gray-100">
          <h3 className="font-bold text-gray-800">Maelezo kwa Njia</h3>
        </div>
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-50/50">
              <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Njia
              </th>
              <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider text-right">
                Miamala
              </th>
              <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider text-right">
                Mapato
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {safeData.by_method.map((m) => (
              <tr
                key={m.method}
                className="hover:bg-gray-50/80 transition-colors"
              >
                <td className="px-6 py-4 text-sm font-medium text-gray-800">
                  {m.method}
                </td>
                <td className="px-6 py-4 text-sm text-gray-600 text-right">
                  {m.transaction_count}
                </td>
                <td className="px-6 py-4 text-sm font-bold text-gray-800 text-right">
                  {formatCurrency(m.revenue)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

const ProfitLossReport = ({ data, formatCurrency }) => {
  const isProfit = data?.status === "PROFIT";
  const isLoss = data?.status === "LOSS";
  const statusColor = isProfit
    ? "text-green-600"
    : isLoss
      ? "text-red-600"
      : "text-gray-600";
  const statusBg = isProfit
    ? "bg-green-50 border-green-200"
    : isLoss
      ? "bg-red-50 border-red-200"
      : "bg-gray-50 border-gray-200";
  const StatusIcon = isProfit ? ArrowUpRight : ArrowDownRight;

  return (
    <div className="space-y-6">
      <div
        className={`rounded-2xl border-2 p-8 ${statusBg} shadow-sm flex items-center justify-between`}
      >
        <div>
          <p className="text-sm font-semibold text-gray-500 uppercase tracking-wider">
            {isProfit ? "Faida" : isLoss ? "Hasara" : "Break Even"}
          </p>
          <p className={`text-4xl font-extrabold mt-2 ${statusColor}`}>
            {formatCurrency(data?.profit || 0)}
          </p>
          <p className="text-sm font-medium text-gray-500 mt-2">
            Margin: {data?.margin_percent || 0}%
          </p>
        </div>
        <StatusIcon className={`w-16 h-16 ${statusColor} opacity-80`} />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-500">Mapato Yote</p>
            <p className="text-2xl font-bold text-green-600 mt-1">
              {formatCurrency(data?.revenue || 0)}
            </p>
          </div>
          <div className="bg-green-50 p-3 rounded-xl">
            <ArrowUpRight className="w-6 h-6 text-green-600" />
          </div>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-500">Matumizi Yote</p>
            <p className="text-2xl font-bold text-red-600 mt-1">
              {formatCurrency(data?.expenses || 0)}
            </p>
          </div>
          <div className="bg-red-50 p-3 rounded-xl">
            <ArrowDownRight className="w-6 h-6 text-red-600" />
          </div>
        </div>
      </div>
    </div>
  );
};

const SummaryCard = ({ label, value, icon: Icon, color, bgColor }) => (
  <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm flex items-center justify-between">
    <div>
      <p className="text-xs font-medium text-gray-500">{label}</p>
      <p className="text-2xl font-bold text-gray-800 mt-1">{value}</p>
    </div>
    <div className={`${bgColor} p-3 rounded-xl`}>
      <Icon className={`w-6 h-6 ${color}`} />
    </div>
  </div>
);

export default Reports;
