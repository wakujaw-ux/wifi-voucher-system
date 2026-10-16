import { useState, useEffect } from "react";
import {
  Search,
  RefreshCw,
  ShoppingCart,
  TrendingUp,
  DollarSign,
  Calendar,
  Eye,
  X,
} from "lucide-react";
import toast from "react-hot-toast";
import { saleApi } from "../api/sale.api";
import Modal from "../components/Modal";

const PAYMENT_LABELS = {
  CASH: "Cash",
  MPESA: "M-Pesa",
  AIRTEL_MONEY: "Airtel Money",
  TIGO_PESA: "Tigo Pesa",
  HALOPESA: "HaloPesa",
  BANK: "Benki",
};

const PAYMENT_COLORS = {
  CASH: "bg-green-100 text-green-700",
  MPESA: "bg-red-100 text-red-700",
  AIRTEL_MONEY: "bg-red-100 text-red-700",
  TIGO_PESA: "bg-blue-100 text-blue-700",
  HALOPESA: "bg-orange-100 text-orange-700",
  BANK: "bg-purple-100 text-purple-700",
};

// Tarehe leo kwa format YYYY-MM-DD
const today = new Date().toISOString().split("T")[0];

const Sales = () => {
  const [sales, setSales] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  // Details modal
  const [selectedSale, setSelectedSale] = useState(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const filters = { limit: 200 };
      if (fromDate) filters.from_date = fromDate;
      if (toDate) filters.to_date = toDate + "T23:59:59";

      const [salesRes, summaryRes] = await Promise.all([
        saleApi.getAll(filters),
        saleApi.getSummary({
          from_date: fromDate || undefined,
          to_date: toDate ? toDate + "T23:59:59" : undefined,
        }),
      ]);

      setSales(salesRes.data.sales || []);
      setSummary(summaryRes.data.summary);
    } catch (err) {
      toast.error(err.response?.data?.message || "Imeshindwa kupata mauzo");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Filter kwa search (client-side)
  const filteredSales = sales.filter((s) => {
    const searchLower = search.toLowerCase();
    return (
      s.voucher_code?.toLowerCase().includes(searchLower) ||
      s.package_name?.toLowerCase().includes(searchLower) ||
      s.customer_phone?.includes(searchLower) ||
      s.operator_username?.toLowerCase().includes(searchLower)
    );
  });

  // Quick date ranges
  const setQuickRange = (days) => {
    const to = new Date();
    const from = new Date();
    from.setDate(from.getDate() - days);

    setFromDate(from.toISOString().split("T")[0]);
    setToDate(to.toISOString().split("T")[0]);

    // Fetch with new dates
    setTimeout(() => {
      fetchDataWithRange(
        from.toISOString().split("T")[0],
        to.toISOString().split("T")[0],
      );
    }, 0);
  };

  const fetchDataWithRange = async (from, to) => {
    setLoading(true);
    try {
      const filters = { limit: 200 };
      if (from) filters.from_date = from;
      if (to) filters.to_date = to + "T23:59:59";

      const [salesRes, summaryRes] = await Promise.all([
        saleApi.getAll(filters),
        saleApi.getSummary({
          from_date: from || undefined,
          to_date: to ? to + "T23:59:59" : undefined,
        }),
      ]);

      setSales(salesRes.data.sales || []);
      setSummary(summaryRes.data.summary);
    } catch (err) {
      toast.error(err.response?.data?.message || "Imeshindwa kupata mauzo");
    } finally {
      setLoading(false);
    }
  };

  const clearFilters = () => {
    setFromDate("");
    setToDate("");
    setSearch("");
    fetchDataWithRange("", "");
  };

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Mauzo (Sales)</h1>
          <p className="text-gray-500 mt-1">Rekodi za mauzo ya vocha</p>
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

      {/* Summary Cards */}
      {summary && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          <SummaryCard
            icon={ShoppingCart}
            label="Mauzo"
            value={summary.total_sales}
            color="text-blue-600"
            bgColor="bg-blue-50"
          />
          <SummaryCard
            icon={DollarSign}
            label="Mapato"
            value={`TZS ${parseFloat(summary.total_revenue).toLocaleString()}`}
            color="text-green-600"
            bgColor="bg-green-50"
          />
          <SummaryCard
            icon={TrendingUp}
            label="Wastani kwa Mauzo"
            value={`TZS ${parseFloat(summary.average_sale).toLocaleString()}`}
            color="text-purple-600"
            bgColor="bg-purple-50"
          />
        </div>
      )}

      {/* Filters */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm mb-4">
        <div className="p-4 border-b border-gray-100">
          {/* Quick ranges */}
          <div className="flex flex-wrap gap-2 mb-3">
            <button
              onClick={() => setQuickRange(0)}
              className="text-xs px-3 py-1 border border-gray-300 rounded-full hover:bg-gray-50"
            >
              Leo
            </button>
            <button
              onClick={() => setQuickRange(7)}
              className="text-xs px-3 py-1 border border-gray-300 rounded-full hover:bg-gray-50"
            >
              Wiki 1
            </button>
            <button
              onClick={() => setQuickRange(30)}
              className="text-xs px-3 py-1 border border-gray-300 rounded-full hover:bg-gray-50"
            >
              Mwezi 1
            </button>
            <button
              onClick={() => setQuickRange(90)}
              className="text-xs px-3 py-1 border border-gray-300 rounded-full hover:bg-gray-50"
            >
              Miezi 3
            </button>
            {(fromDate || toDate || search) && (
              <button
                onClick={clearFilters}
                className="text-xs px-3 py-1 border border-red-300 text-red-600 rounded-full hover:bg-red-50"
              >
                Safisha
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Tafuta voucher, package, simu..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
              />
            </div>

            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="date"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
              />
            </div>

            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="date"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
              />
            </div>
          </div>

          {(fromDate || toDate) && (
            <button
              onClick={fetchData}
              className="mt-3 text-sm text-primary-600 hover:text-primary-700 font-medium"
            >
              Tumia filters →
            </button>
          )}
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          {loading ? (
            <div className="p-8 text-center text-gray-500">Inapakia...</div>
          ) : filteredSales.length === 0 ? (
            <div className="p-8 text-center">
              <ShoppingCart className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">Hakuna mauzo yaliyopatikana</p>
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
                  <th className="text-right px-6 py-3 text-xs font-medium text-gray-500 uppercase">
                    Kiasi
                  </th>
                  <th className="text-center px-6 py-3 text-xs font-medium text-gray-500 uppercase">
                    Malipo
                  </th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">
                    Operator
                  </th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">
                    Tarehe
                  </th>
                  <th className="text-right px-6 py-3 text-xs font-medium text-gray-500 uppercase">
                    Vitendo
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredSales.map((sale) => (
                  <tr key={sale.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <span className="font-mono font-medium text-gray-800">
                        {sale.voucher_code}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-gray-700">
                      {sale.package_name}
                    </td>
                    <td className="px-6 py-4 text-right font-medium text-gray-800">
                      TZS {parseFloat(sale.amount).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span
                        className={`inline-block px-2 py-1 text-xs font-medium rounded-full ${
                          PAYMENT_COLORS[sale.payment_method] ||
                          "bg-gray-100 text-gray-600"
                        }`}
                      >
                        {PAYMENT_LABELS[sale.payment_method] ||
                          sale.payment_method}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-gray-600 text-sm">
                      {sale.operator_username || "-"}
                    </td>
                    <td className="px-6 py-4 text-gray-600 text-sm">
                      {new Date(sale.created_at).toLocaleString("sw-TZ", {
                        dateStyle: "short",
                        timeStyle: "short",
                      })}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => setSelectedSale(sale)}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition"
                        title="Ona"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Details Modal */}
      <Modal
        isOpen={!!selectedSale}
        onClose={() => setSelectedSale(null)}
        title="Maelezo ya Mauzo"
        size="md"
      >
        {selectedSale && <SaleDetails sale={selectedSale} />}
      </Modal>
    </div>
  );
};

// Helper components
const SummaryCard = ({ icon: Icon, label, value, color, bgColor }) => (
  <div className="bg-white rounded-xl p-6 border border-gray-100 shadow-sm">
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm text-gray-500">{label}</p>
        <p className="text-2xl font-bold text-gray-800 mt-1">{value}</p>
      </div>
      <div className={`${bgColor} p-3 rounded-lg`}>
        <Icon className={`w-6 h-6 ${color}`} />
      </div>
    </div>
  </div>
);

const SaleDetails = ({ sale }) => (
  <div className="space-y-4">
    <div className="bg-gray-50 rounded-lg p-4">
      <div className="grid grid-cols-2 gap-4">
        <DetailRow label="Voucher" value={sale.voucher_code} mono />
        <DetailRow label="Package" value={sale.package_name} />
        <DetailRow
          label="Kiasi"
          value={`TZS ${parseFloat(sale.amount).toLocaleString()}`}
        />
        <DetailRow
          label="Malipo"
          value={PAYMENT_LABELS[sale.payment_method] || sale.payment_method}
        />
        {sale.payment_reference && (
          <DetailRow label="Reference" value={sale.payment_reference} />
        )}
        <DetailRow label="Operator" value={sale.operator_username || "-"} />
        {sale.customer_phone && (
          <DetailRow label="Simu ya Mteja" value={sale.customer_phone} />
        )}
        <DetailRow
          label="Tarehe"
          value={new Date(sale.created_at).toLocaleString("sw-TZ", {
            dateStyle: "full",
            timeStyle: "short",
          })}
        />
      </div>
    </div>

    {sale.notes && (
      <div>
        <p className="text-xs font-medium text-gray-500 uppercase mb-1">
          Maelezo
        </p>
        <p className="text-sm text-gray-700 bg-gray-50 p-3 rounded-lg">
          {sale.notes}
        </p>
      </div>
    )}
  </div>
);

const DetailRow = ({ label, value, mono = false }) => (
  <div>
    <p className="text-xs text-gray-500">{label}</p>
    <p
      className={`text-sm font-medium text-gray-800 ${mono ? "font-mono" : ""}`}
    >
      {value}
    </p>
  </div>
);

export default Sales;
