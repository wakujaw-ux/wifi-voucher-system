import { useState, useEffect, useCallback } from "react";
import {
  Plus,
  Search,
  Ticket,
  RefreshCw,
  ShoppingCart,
  Ban,
} from "lucide-react";
import toast from "react-hot-toast";
import { voucherApi } from "../api/voucher.api";
import { packageApi } from "../api/package.api";
import Modal from "../components/Modal";
import GenerateVoucherForm from "../components/GenerateVoucherForm";
import { useAuth } from "../context/AuthContext";

const STATUSES = [
  { value: "", label: "Zote" },
  { value: "CREATED", label: "Created" },
  { value: "AVAILABLE", label: "Available" },
  { value: "SOLD", label: "Sold" },
  { value: "ACTIVE", label: "Active" },
  { value: "USED", label: "Used" },
  { value: "EXPIRED", label: "Expired" },
  { value: "REVOKED", label: "Revoked" },
];

const STATUS_COLORS = {
  CREATED: "bg-gray-100 text-gray-700",
  AVAILABLE: "bg-blue-100 text-blue-700",
  SOLD: "bg-yellow-100 text-yellow-700",
  ACTIVE: "bg-green-100 text-green-700",
  USED: "bg-purple-100 text-purple-700",
  EXPIRED: "bg-orange-100 text-orange-700",
  REVOKED: "bg-red-100 text-red-700",
  CANCELLED: "bg-gray-100 text-gray-600",
};

const Vouchers = () => {
  const { user } = useAuth();

  const [vouchers, setVouchers] = useState([]);
  const [packages, setPackages] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [packageFilter, setPackageFilter] = useState("");

  // Modal
  const [showGenerateModal, setShowGenerateModal] = useState(false);
  const [generating, setGenerating] = useState(false);

  const canGenerate = ["ADMIN", "SUPER_ADMIN"].includes(user?.role);
  const canSell = ["ADMIN", "SUPER_ADMIN", "OPERATOR"].includes(user?.role);
  const canRevoke = ["ADMIN", "SUPER_ADMIN"].includes(user?.role);

  // Pata data
  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const filters = { limit: 100 };
      if (statusFilter) filters.status = statusFilter;
      if (packageFilter) filters.package_id = packageFilter;

      const [vouchersRes, statsRes, packagesRes] = await Promise.all([
        voucherApi.getAll(filters),
        voucherApi.getStats({
          package_id: packageFilter || undefined,
        }),
        packageApi.getAll({ is_active: true }),
      ]);

      setVouchers(vouchersRes.data.vouchers || []);
      setStats(statsRes.data.stats);
      setPackages(packagesRes.data.packages || []);
    } catch (err) {
      toast.error(err.response?.data?.message || "Imeshindwa kupata data");
    } finally {
      setLoading(false);
    }
  }, [statusFilter, packageFilter]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Filter kwa search (client-side)
  const filteredVouchers = vouchers.filter((v) =>
    v.code.toLowerCase().includes(search.toLowerCase()),
  );

  // Generate
  const handleGenerate = async (data) => {
    setGenerating(true);
    try {
      const response = await voucherApi.generate(data);
      const { synced_count, failed_count, count } = response.data;

      if (failed_count > 0) {
        toast.warning(
          `Vocha ${count} zimezalishwa. ${synced_count} zimesync, ${failed_count} zimeshindwa.`,
        );
      } else {
        toast.success(`Vocha ${count} zimezalishwa na kusync kwa mafanikio`);
      }

      setShowGenerateModal(false);
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || "Imeshindwa kuzalisha vocha");
    } finally {
      setGenerating(false);
    }
  };

  // Sell
  const handleSell = async (voucher) => {
    if (
      !window.confirm(
        `Uza voucher ${voucher.code} kwa TZS ${parseFloat(voucher.price).toLocaleString()}?`,
      )
    ) {
      return;
    }

    try {
      await voucherApi.sell(voucher.id, {
        payment_method: "CASH",
      });
      toast.success(`Voucher ${voucher.code} imeuzwa`);
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || "Imeshindwa kuuza");
    }
  };

  // Revoke
  const handleRevoke = async (voucher) => {
    const reason = window.prompt(`Sababu ya kurevoke ${voucher.code}:`);
    if (reason === null) return;

    try {
      await voucherApi.revoke(voucher.id, {
        reason: reason || "Hakuna sababu",
      });
      toast.success(`Voucher ${voucher.code} imerevokwa`);
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || "Imeshindwa kurevoke");
    }
  };

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Vouchers</h1>
          <p className="text-gray-500 mt-1">Kusimamia vocha za Wi-Fi</p>
        </div>

        <div className="flex gap-2">
          <button
            onClick={fetchData}
            disabled={loading}
            className="inline-flex items-center gap-2 bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 font-medium px-4 py-2 rounded-lg transition disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </button>

          {canGenerate && (
            <button
              onClick={() => setShowGenerateModal(true)}
              className="inline-flex items-center gap-2 bg-primary-600 hover:bg-primary-700 text-white font-medium px-4 py-2 rounded-lg transition"
            >
              <Plus className="w-4 h-4" />
              Zalisha Vocha
            </button>
          )}
        </div>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3 mb-6">
          <StatMini label="Zote" value={stats.total} color="text-gray-700" />
          <StatMini
            label="Available"
            value={stats.AVAILABLE + stats.CREATED}
            color="text-blue-600"
          />
          <StatMini label="Sold" value={stats.SOLD} color="text-yellow-600" />
          <StatMini
            label="Active"
            value={stats.ACTIVE}
            color="text-green-600"
          />
          <StatMini label="Used" value={stats.USED} color="text-purple-600" />
          <StatMini
            label="Revoked"
            value={stats.REVOKED}
            color="text-red-600"
          />
        </div>
      )}

      {/* Filters */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm mb-4">
        <div className="p-4 border-b border-gray-100">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Tafuta kwa code..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
              />
            </div>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none bg-white"
            >
              {STATUSES.map((s) => (
                <option key={s.value} value={s.value}>
                  Status: {s.label}
                </option>
              ))}
            </select>

            <select
              value={packageFilter}
              onChange={(e) => setPackageFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none bg-white"
            >
              <option value="">Package: Zote</option>
              {packages.map((pkg) => (
                <option key={pkg.id} value={pkg.id}>
                  {pkg.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          {loading ? (
            <div className="p-8 text-center text-gray-500">Inapakia...</div>
          ) : filteredVouchers.length === 0 ? (
            <div className="p-8 text-center">
              <Ticket className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">Hakuna vocha zilizopatikana</p>
            </div>
          ) : (
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">
                    Code
                  </th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">
                    Package
                  </th>
                  <th className="text-right px-6 py-3 text-xs font-medium text-gray-500 uppercase">
                    Bei
                  </th>
                  <th className="text-right px-6 py-3 text-xs font-medium text-gray-500 uppercase">
                    Muda
                  </th>
                  <th className="text-center px-6 py-3 text-xs font-medium text-gray-500 uppercase">
                    Status
                  </th>
                  <th className="text-center px-6 py-3 text-xs font-medium text-gray-500 uppercase">
                    Sync
                  </th>
                  <th className="text-right px-6 py-3 text-xs font-medium text-gray-500 uppercase">
                    Vitendo
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredVouchers.map((v) => (
                  <tr key={v.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <span className="font-mono font-medium text-gray-800">
                        {v.code}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-gray-700 text-sm">
                      {v.package_name || "-"}
                    </td>
                    <td className="px-6 py-4 text-right text-gray-600">
                      TZS {parseFloat(v.price).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 text-right text-gray-600">
                      {v.duration_minutes} min
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span
                        className={`inline-block px-2 py-1 text-xs font-medium rounded-full ${
                          STATUS_COLORS[v.status] || "bg-gray-100 text-gray-600"
                        }`}
                      >
                        {v.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span
                        className={`inline-block px-2 py-1 text-xs font-medium rounded-full ${
                          v.mikrotik_sync === "SYNCED"
                            ? "bg-green-100 text-green-700"
                            : v.mikrotik_sync === "FAILED"
                              ? "bg-red-100 text-red-700"
                              : "bg-yellow-100 text-yellow-700"
                        }`}
                      >
                        {v.mikrotik_sync}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        {canSell &&
                          (v.status === "CREATED" ||
                            v.status === "AVAILABLE") && (
                            <button
                              onClick={() => handleSell(v)}
                              className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition"
                              title="Uza"
                            >
                              <ShoppingCart className="w-4 h-4" />
                            </button>
                          )}
                        {canRevoke &&
                          v.status !== "REVOKED" &&
                          v.status !== "USED" &&
                          v.status !== "EXPIRED" && (
                            <button
                              onClick={() => handleRevoke(v)}
                              className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition"
                              title="Revoke"
                            >
                              <Ban className="w-4 h-4" />
                            </button>
                          )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Generate Modal */}
      <Modal
        isOpen={showGenerateModal}
        onClose={() => setShowGenerateModal(false)}
        title="Zalisha Vocha Mpya"
        size="lg"
      >
        <GenerateVoucherForm onSubmit={handleGenerate} loading={generating} />
      </Modal>
    </div>
  );
};

// Helper component
const StatMini = ({ label, value, color }) => (
  <div className="bg-white rounded-lg p-3 border border-gray-100 shadow-sm">
    <p className="text-xs text-gray-500">{label}</p>
    <p className={`text-xl font-bold mt-1 ${color}`}>{value}</p>
  </div>
);

export default Vouchers;
