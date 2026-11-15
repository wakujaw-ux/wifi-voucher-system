import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  Search,
  RefreshCw,
  ShoppingCart,
  TrendingUp,
  DollarSign,
  Calendar,
  Eye,
  FileText,
  Loader2,
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

// Kazi ya kupata tarehe ya ndani (Local Time)
const getLocalDateString = (date) => {
  const offset = date.getTimezoneOffset();
  const localDate = new Date(date.getTime() - offset * 60 * 1000);
  return localDate.toISOString().split("T")[0];
};

const today = () => getLocalDateString(new Date());

const Sales = () => {
  const navigate = useNavigate();

  const [sales, setSales] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  // Details modal
  const [selectedSale, setSelectedSale] = useState(null);

  const fetchData = useCallback(
    async (fDate = fromDate, tDate = toDate) => {
      setLoading(true);
      try {
        const filters = { limit: 200 };
        if (fDate) filters.from_date = fDate;
        if (tDate) filters.to_date = tDate + "T23:59:59";

        const [salesRes, summaryRes] = await Promise.all([
          saleApi.getAll(filters),
          saleApi.getSummary({
            from_date: fDate || undefined,
            to_date: tDate ? tDate + "T23:59:59" : undefined,
          }),
        ]);

        setSales(salesRes.data.sales || []);
        setSummary(summaryRes.data.summary);
      } catch (err) {
        toast.error(err.response?.data?.message || "Imeshindwa kupata mauzo");
      } finally {
        setLoading(false);
      }
    },
    [fromDate, toDate],
  );

  useEffect(() => {
    fetchData();
  }, [fetchData]);

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

  const formatCurrency = (value) => {
    const num = parseFloat(value || 0);
    return `TZS ${num.toLocaleString("en-US", { maximumFractionDigits: 0 })}`;
  };

  const setQuickRange = (days) => {
    const to = new Date();
    const from = new Date();
    from.setDate(from.getDate() - days);

    const fDate = getLocalDateString(from);
    const tDate = getLocalDateString(to);

    setFromDate(fDate);
    setToDate(tDate);
    fetchData(fDate, tDate);
  };

  const clearFilters = () => {
    setFromDate("");
    setToDate("");
    setSearch("");
    fetchData("", "");
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Mauzo (Sales)</h1>
          <p className="text-gray-500 mt-1">Rekodi za mauzo ya vocha</p>
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => navigate("/reports?tab=sales")}
            className="inline-flex items-center gap-2 bg-primary-600 hover:bg-primary-700 text-white font-medium px-4 py-2 rounded-xl transition shadow-sm"
          >
            <FileText className="w-4 h-4" />
            Angalia Ripoti
          </button>

          <button
            onClick={() => fetchData()}
            disabled={loading}
            className="inline-flex items-center gap-2 bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 font-medium px-4 py-2 rounded-xl transition shadow-sm disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      {summary && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-gray-500">
                  Idadi ya Mauzo
                </p>
                <p className="text-2xl font-bold text-gray-800 mt-1">
                  {summary.total_sales}
                </p>
              </div>
              <div className="bg-blue-50 p-2.5 rounded-xl">
                <ShoppingCart className="w-5 h-5 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-gray-500">
                  Jumla ya Mapato
                </p>
                <p className="text-2xl font-bold text-gray-800 mt-1">
                  {formatCurrency(summary.total_revenue)}
                </p>
              </div>
              <div className="bg-green-50 p-2.5 rounded-xl">
                <DollarSign className="w-5 h-5 text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-gray-500">
                  Wastani kwa Mauzo
                </p>
                <p className="text-2xl font-bold text-gray-800 mt-1">
                  {formatCurrency(summary.average_sale)}
                </p>
              </div>
              <div className="bg-purple-50 p-2.5 rounded-xl">
                <TrendingUp className="w-5 h-5 text-purple-600" />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm">
        <div className="p-5 border-b border-gray-100 bg-gray-50/30">
          {/* Quick Ranges */}
          <div className="flex flex-wrap gap-2 mb-4">
            <button
              onClick={() => setQuickRange(0)}
              className="text-xs font-medium px-3 py-1.5 bg-white border border-gray-200 rounded-lg hover:border-primary-400 hover:text-primary-600 transition shadow-sm"
            >
              Leo
            </button>
            <button
              onClick={() => setQuickRange(7)}
              className="text-xs font-medium px-3 py-1.5 bg-white border border-gray-200 rounded-lg hover:border-primary-400 hover:text-primary-600 transition shadow-sm"
            >
              Wiki 1
            </button>
            <button
              onClick={() => setQuickRange(30)}
              className="text-xs font-medium px-3 py-1.5 bg-white border border-gray-200 rounded-lg hover:border-primary-400 hover:text-primary-600 transition shadow-sm"
            >
              Mwezi 1
            </button>
            <button
              onClick={() => setQuickRange(90)}
              className="text-xs font-medium px-3 py-1.5 bg-white border border-gray-200 rounded-lg hover:border-primary-400 hover:text-primary-600 transition shadow-sm"
            >
              Miezi 3
            </button>

            {(fromDate || toDate || search) && (
              <button
                onClick={clearFilters}
                className="text-xs font-medium px-3 py-1.5 bg-red-50 text-red-600 border border-red-200 rounded-lg hover:bg-red-100 transition shadow-sm ml-auto"
              >
                Safisha Vichujio
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
                className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none text-sm transition"
              />
            </div>

            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="date"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
                className="w-full pl-10 pr-3 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 outline-none text-sm transition text-gray-600"
              />
            </div>

            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="date"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
                className="w-full pl-10 pr-3 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 outline-none text-sm transition text-gray-600"
              />
            </div>
          </div>

          <div className="mt-3 text-right">
            <button
              onClick={() => fetchData()}
              className="text-sm font-medium text-primary-600 hover:text-primary-700"
            >
              Tumia Vichujio vya Tarehe &rarr;
            </button>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          {loading ? (
            <div className="p-10 flex flex-col items-center justify-center text-gray-500">
              <Loader2 className="w-8 h-8 animate-spin text-primary-500 mb-3" />
              <p>Inapakia mauzo...</p>
            </div>
          ) : filteredSales.length === 0 ? (
            <div className="p-10 text-center">
              <ShoppingCart className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500 font-medium">
                Hakuna mauzo yaliyopatikana
              </p>
            </div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50/50 border-b border-gray-100">
                  <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Voucher
                  </th>
                  <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Package
                  </th>
                  <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider text-right">
                    Kiasi
                  </th>
                  <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider text-center">
                    Malipo
                  </th>
                  <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Operator
                  </th>
                  <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Tarehe
                  </th>
                  <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider text-center">
                    Kitendo
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredSales.map((sale) => (
                  <tr
                    key={sale.id}
                    className="hover:bg-gray-50/80 transition-colors group"
                  >
                    <td className="px-6 py-4">
                      <span className="font-mono text-sm font-semibold text-gray-800 group-hover:text-primary-600 transition">
                        {sale.voucher_code}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-700">
                      {sale.package_name}
                    </td>
                    <td className="px-6 py-4 text-sm font-bold text-gray-800 text-right">
                      {formatCurrency(sale.amount)}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span
                        className={`inline-block px-2.5 py-1 text-xs font-semibold rounded-full ${PAYMENT_COLORS[sale.payment_method] || "bg-gray-100 text-gray-600"}`}
                      >
                        {PAYMENT_LABELS[sale.payment_method] ||
                          sale.payment_method}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {sale.operator_username || "-"}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {new Date(sale.created_at).toLocaleString("sw-TZ", {
                        dateStyle: "short",
                        timeStyle: "short",
                      })}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <button
                        onClick={() => setSelectedSale(sale)}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition"
                        title="Ona Maelezo"
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
        {selectedSale && (
          <div className="space-y-4">
            <div className="bg-gray-50 rounded-xl p-5">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-gray-500 mb-1">Voucher</p>
                  <p className="font-mono font-bold text-gray-800">
                    {selectedSale.voucher_code}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-1">Package</p>
                  <p className="text-sm font-semibold text-gray-800">
                    {selectedSale.package_name}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-1">Kiasi</p>
                  <p className="text-sm font-bold text-primary-600">
                    {formatCurrency(selectedSale.amount)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-1">Njia ya Malipo</p>
                  <p className="text-sm text-gray-800">
                    {PAYMENT_LABELS[selectedSale.payment_method]}
                  </p>
                </div>
                {selectedSale.payment_reference && (
                  <div className="col-span-2">
                    <p className="text-xs text-gray-500 mb-1">
                      Kumbukumbu (Reference)
                    </p>
                    <p className="text-sm text-gray-800">
                      {selectedSale.payment_reference}
                    </p>
                  </div>
                )}
                <div>
                  <p className="text-xs text-gray-500 mb-1">Operator</p>
                  <p className="text-sm text-gray-800">
                    {selectedSale.operator_username || "-"}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-1">Tarehe</p>
                  <p className="text-sm text-gray-800">
                    {new Date(selectedSale.created_at).toLocaleString("sw-TZ", {
                      dateStyle: "full",
                      timeStyle: "short",
                    })}
                  </p>
                </div>
                {selectedSale.customer_phone && (
                  <div className="col-span-2">
                    <p className="text-xs text-gray-500 mb-1">Simu ya Mteja</p>
                    <p className="text-sm text-gray-800">
                      {selectedSale.customer_phone}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default Sales;
