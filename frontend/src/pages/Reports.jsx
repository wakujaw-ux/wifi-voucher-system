import { useState, useEffect, useCallback } from "react";
import {
  BarChart3,
  TrendingUp,
  DollarSign,
  Ticket,
  RefreshCw,
  Wallet,
  ShoppingCart,
  ArrowUpRight,
  ArrowDownRight,
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
  const [activeTab, setActiveTab] = useState("sales");
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState(null);

  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [appliedFilters, setAppliedFilters] = useState({});

  const fetchReport = useCallback(async () => {
    setLoading(true);
    setData(null);

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

  const handleApply = () => {
    setAppliedFilters({
      from_date: fromDate || undefined,
      to_date: toDate ? toDate + "T23:59:59" : undefined,
    });
  };

  const handleClear = () => {
    setFromDate("");
    setToDate("");
    setAppliedFilters({});
  };

  const formatCurrency = (value) =>
    `TZS ${parseFloat(value || 0).toLocaleString("en-US", {
      maximumFractionDigits: 0,
    })}`;

  const formatDate = (dateStr) => {
    if (!dateStr) return "-";
    return new Date(dateStr).toLocaleDateString("sw-TZ", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Ripoti</h1>
          <p className="text-gray-500 mt-1">
            Uchambuzi wa biashara kwa kipindi
          </p>
        </div>

        <button
          onClick={fetchReport}
          disabled={loading}
          className="inline-flex items-center gap-2 bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 font-medium px-4 py-2 rounded-lg transition disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </button>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm mb-4">
        <div className="flex overflow-x-auto border-b border-gray-100">
          {TABS.map((tab) => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-6 py-4 text-sm font-medium whitespace-nowrap transition border-b-2 ${
                  active
                    ? "text-primary-600 border-primary-600"
                    : "text-gray-600 border-transparent hover:text-gray-900"
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            );
          })}
        </div>
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
        <div className="p-8 text-center text-gray-500">Inapakia ripoti...</div>
      ) : !data ? (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-8 text-center">
          <BarChart3 className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">Hakuna data</p>
        </div>
      ) : (
        <>
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
        </>
      )}
    </div>
  );
};

// ============================================================
// SALES REPORT
// ============================================================
const SalesReport = ({ data, formatCurrency, formatDate }) => {
  const chartData = (data.by_period || []).map((p) => ({
    period: formatDate(p.period),
    revenue: parseFloat(p.revenue),
    sales: p.sales_count,
  }));

  return (
    <div className="space-y-6">
      {/* Summary */}
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

      {/* Chart */}
      {chartData.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
          <h3 className="font-medium text-gray-800 mb-4">Mapato kwa Kipindi</h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="period" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip
                  formatter={(value) => formatCurrency(value)}
                  contentStyle={{
                    borderRadius: 8,
                    border: "1px solid #e5e7eb",
                  }}
                />
                <Bar dataKey="revenue" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* By Package */}
      {data.by_package?.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
          <h3 className="font-medium text-gray-800 mb-4">Mauzo kwa Package</h3>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b border-gray-100">
                <tr>
                  <th className="text-left py-2 text-xs font-medium text-gray-500 uppercase">
                    Package
                  </th>
                  <th className="text-right py-2 text-xs font-medium text-gray-500 uppercase">
                    Mauzo
                  </th>
                  <th className="text-right py-2 text-xs font-medium text-gray-500 uppercase">
                    Mapato
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {data.by_package.map((p) => (
                  <tr key={p.package_id}>
                    <td className="py-3 text-gray-800">{p.package_name}</td>
                    <td className="py-3 text-right text-gray-600">
                      {p.sales_count}
                    </td>
                    <td className="py-3 text-right font-medium text-gray-800">
                      {formatCurrency(p.revenue)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* By Operator */}
      {data.by_operator?.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
          <h3 className="font-medium text-gray-800 mb-4">Mauzo kwa Operator</h3>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b border-gray-100">
                <tr>
                  <th className="text-left py-2 text-xs font-medium text-gray-500 uppercase">
                    Operator
                  </th>
                  <th className="text-right py-2 text-xs font-medium text-gray-500 uppercase">
                    Mauzo
                  </th>
                  <th className="text-right py-2 text-xs font-medium text-gray-500 uppercase">
                    Mapato
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {data.by_operator.map((o) => (
                  <tr key={o.operator_id}>
                    <td className="py-3 text-gray-800">
                      {o.full_name || o.username}
                    </td>
                    <td className="py-3 text-right text-gray-600">
                      {o.sales_count}
                    </td>
                    <td className="py-3 text-right font-medium text-gray-800">
                      {formatCurrency(o.revenue)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

// ============================================================
// VOUCHERS REPORT
// ============================================================
const VouchersReport = ({ data }) => {
  const pieData = (data.by_status || []).map((s) => ({
    name: s.status,
    value: s.count,
  }));

  return (
    <div className="space-y-6">
      {/* Pie Chart */}
      {pieData.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
          <h3 className="font-medium text-gray-800 mb-4">Voucha kwa Status</h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  label={({ name, value }) => `${name}: ${value}`}
                >
                  {pieData.map((entry, index) => (
                    <Cell
                      key={index}
                      fill={CHART_COLORS[index % CHART_COLORS.length]}
                    />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* By Status */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
        <h3 className="font-medium text-gray-800 mb-4">Muhtasari kwa Status</h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="border-b border-gray-100">
              <tr>
                <th className="text-left py-2 text-xs font-medium text-gray-500 uppercase">
                  Status
                </th>
                <th className="text-right py-2 text-xs font-medium text-gray-500 uppercase">
                  Idadi
                </th>
                <th className="text-right py-2 text-xs font-medium text-gray-500 uppercase">
                  Thamani
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {(data.by_status || []).map((s) => (
                <tr key={s.status}>
                  <td className="py-3 text-gray-800">{s.status}</td>
                  <td className="py-3 text-right text-gray-600">{s.count}</td>
                  <td className="py-3 text-right font-medium text-gray-800">
                    TZS {parseFloat(s.value).toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* By Package */}
      {data.by_package?.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
          <h3 className="font-medium text-gray-800 mb-4">Voucha kwa Package</h3>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b border-gray-100">
                <tr>
                  <th className="text-left py-2 text-xs font-medium text-gray-500 uppercase">
                    Package
                  </th>
                  <th className="text-right py-2 text-xs font-medium text-gray-500 uppercase">
                    Jumla
                  </th>
                  <th className="text-right py-2 text-xs font-medium text-gray-500 uppercase">
                    Zilizouzwa
                  </th>
                  <th className="text-right py-2 text-xs font-medium text-gray-500 uppercase">
                    Zilizopo
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {data.by_package.map((p, i) => (
                  <tr key={i}>
                    <td className="py-3 text-gray-800">{p.package_name}</td>
                    <td className="py-3 text-right text-gray-600">{p.total}</td>
                    <td className="py-3 text-right text-green-600">
                      {p.sold_or_used}
                    </td>
                    <td className="py-3 text-right text-blue-600">
                      {p.available}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

// ============================================================
// REVENUE REPORT
// ============================================================
const RevenueReport = ({ data, formatCurrency }) => {
  const pieData = (data.by_method || []).map((m) => ({
    name: m.method,
    value: parseFloat(m.revenue),
  }));

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <SummaryCard
          label="Jumla ya Miamala"
          value={data.total.total_transactions}
          icon={ShoppingCart}
          color="text-blue-600"
          bgColor="bg-blue-50"
        />
        <SummaryCard
          label="Jumla ya Mapato"
          value={formatCurrency(data.total.total_revenue)}
          icon={DollarSign}
          color="text-green-600"
          bgColor="bg-green-50"
        />
      </div>

      {pieData.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
          <h3 className="font-medium text-gray-800 mb-4">
            Mapato kwa Njia ya Malipo
          </h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  label={({ name }) => name}
                >
                  {pieData.map((entry, index) => (
                    <Cell
                      key={index}
                      fill={CHART_COLORS[index % CHART_COLORS.length]}
                    />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => formatCurrency(value)} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
        <h3 className="font-medium text-gray-800 mb-4">Maelezo kwa Njia</h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="border-b border-gray-100">
              <tr>
                <th className="text-left py-2 text-xs font-medium text-gray-500 uppercase">
                  Njia
                </th>
                <th className="text-right py-2 text-xs font-medium text-gray-500 uppercase">
                  Miamala
                </th>
                <th className="text-right py-2 text-xs font-medium text-gray-500 uppercase">
                  Mapato
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {(data.by_method || []).map((m) => (
                <tr key={m.method}>
                  <td className="py-3 text-gray-800">{m.method}</td>
                  <td className="py-3 text-right text-gray-600">
                    {m.transaction_count}
                  </td>
                  <td className="py-3 text-right font-medium text-gray-800">
                    {formatCurrency(m.revenue)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

// ============================================================
// PROFIT & LOSS REPORT
// ============================================================
const ProfitLossReport = ({ data, formatCurrency }) => {
  const isProfit = data.status === "PROFIT";
  const isLoss = data.status === "LOSS";

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
      {/* Status Card */}
      <div className={`rounded-xl border-2 p-6 ${statusBg}`}>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-600">
              {isProfit ? "Faida" : isLoss ? "Hasara" : "Break Even"}
            </p>
            <p className={`text-3xl font-bold mt-1 ${statusColor}`}>
              {formatCurrency(data.profit)}
            </p>
            <p className="text-xs text-gray-500 mt-2">
              Margin: {data.margin_percent}%
            </p>
          </div>
          <StatusIcon className={`w-12 h-12 ${statusColor}`} />
        </div>
      </div>

      {/* Breakdown */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Mapato</p>
              <p className="text-2xl font-bold text-green-600 mt-1">
                {formatCurrency(data.revenue)}
              </p>
            </div>
            <div className="bg-green-50 p-3 rounded-lg">
              <ArrowUpRight className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Matumizi</p>
              <p className="text-2xl font-bold text-red-600 mt-1">
                {formatCurrency(data.expenses)}
              </p>
            </div>
            <div className="bg-red-50 p-3 rounded-lg">
              <ArrowDownRight className="w-6 h-6 text-red-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Period */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 text-sm text-gray-600">
        <span className="font-medium">Kipindi:</span> {data.period.from_date} –{" "}
        {data.period.to_date}
      </div>
    </div>
  );
};

// ============================================================
// SHARED
// ============================================================
const SummaryCard = ({ label, value, icon: Icon, color, bgColor }) => (
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

export default Reports;
