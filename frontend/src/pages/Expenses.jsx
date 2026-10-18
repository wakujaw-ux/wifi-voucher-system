import { useState, useEffect, useCallback } from "react";
import {
  Plus,
  Search,
  Edit,
  Trash2,
  Wallet,
  RefreshCw,
  Zap,
  Wifi,
  Wrench,
  Car,
  Package,
  Users,
  Home,
  MoreHorizontal,
} from "lucide-react";
import toast from "react-hot-toast";
import { expenseApi } from "../api/expense.api";
import Modal from "../components/Modal";
import ConfirmDialog from "../components/ConfirmDialog";
import ExpenseForm from "../components/ExpenseForm";
import { useAuth } from "../context/AuthContext";

const CATEGORY_MAP = {
  INTERNET: {
    label: "Internet",
    icon: Wifi,
    color: "text-blue-600",
    bg: "bg-blue-50",
  },
  ELECTRICITY: {
    label: "Umeme",
    icon: Zap,
    color: "text-yellow-600",
    bg: "bg-yellow-50",
  },
  MAINTENANCE: {
    label: "Matengenezo",
    icon: Wrench,
    color: "text-orange-600",
    bg: "bg-orange-50",
  },
  TRANSPORT: {
    label: "Usafiri",
    icon: Car,
    color: "text-purple-600",
    bg: "bg-purple-50",
  },
  EQUIPMENT: {
    label: "Vifaa",
    icon: Package,
    color: "text-indigo-600",
    bg: "bg-indigo-50",
  },
  STAFF: {
    label: "Wafanyakazi",
    icon: Users,
    color: "text-pink-600",
    bg: "bg-pink-50",
  },
  RENT: {
    label: "Kodi",
    icon: Home,
    color: "text-green-600",
    bg: "bg-green-50",
  },
  OTHER: {
    label: "Nyingine",
    icon: MoreHorizontal,
    color: "text-gray-600",
    bg: "bg-gray-50",
  },
};

const Expenses = () => {
  const { user } = useAuth();
  const [expenses, setExpenses] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");

  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const canWrite = ["ADMIN", "SUPER_ADMIN"].includes(user?.role);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const filters = {};
      if (categoryFilter) filters.category = categoryFilter;

      const [expensesRes, summaryRes] = await Promise.all([
        expenseApi.getAll(filters),
        expenseApi.getSummary(),
      ]);

      setExpenses(expensesRes.data.expenses || []);
      setSummary(summaryRes.data.summary);
    } catch (err) {
      toast.error(err.response?.data?.message || "Imeshindwa kupata data");
    } finally {
      setLoading(false);
    }
  }, [categoryFilter]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const filteredExpenses = expenses.filter((e) => {
    const searchLower = search.toLowerCase();
    return (
      e.category?.toLowerCase().includes(searchLower) ||
      e.description?.toLowerCase().includes(searchLower)
    );
  });

  const handleSubmit = async (data) => {
    setSubmitting(true);
    try {
      if (editing) {
        await expenseApi.update(editing.id, data);
        toast.success("Expense imesasishwa");
      } else {
        await expenseApi.create(data);
        toast.success("Expense imeundwa");
      }
      setShowModal(false);
      setEditing(null);
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || "Imeshindwa kuhifadhi");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await expenseApi.remove(deleteTarget.id);
      toast.success("Expense imefutwa");
      setDeleteTarget(null);
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || "Imeshindwa kufuta");
    } finally {
      setDeleting(false);
    }
  };

  const openCreate = () => {
    setEditing(null);
    setShowModal(true);
  };

  const openEdit = (exp) => {
    setEditing(exp);
    setShowModal(true);
  };

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Matumizi</h1>
          <p className="text-gray-500 mt-1">Matumizi ya biashara</p>
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

          {canWrite && (
            <button
              onClick={openCreate}
              className="inline-flex items-center gap-2 bg-primary-600 hover:bg-primary-700 text-white font-medium px-4 py-2 rounded-lg transition"
            >
              <Plus className="w-4 h-4" />
              Ongeza Matumizi
            </button>
          )}
        </div>
      </div>

      {/* Summary */}
      {summary && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
          <div className="bg-white rounded-xl p-6 border border-gray-100 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Jumla ya Matumizi</p>
                <p className="text-2xl font-bold text-red-600 mt-1">
                  TZS {parseFloat(summary.total_amount || 0).toLocaleString()}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  {summary.total_count} rekodi
                </p>
              </div>
              <div className="bg-red-50 p-3 rounded-lg">
                <Wallet className="w-6 h-6 text-red-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 border border-gray-100 shadow-sm">
            <p className="text-sm text-gray-500 mb-3">Kwa Category</p>
            <div className="space-y-2 max-h-40 overflow-y-auto">
              {(summary.by_category || []).map((c) => {
                const cat = CATEGORY_MAP[c.category] || CATEGORY_MAP.OTHER;
                const Icon = cat.icon;
                return (
                  <div
                    key={c.category}
                    className="flex items-center justify-between"
                  >
                    <div className="flex items-center gap-2">
                      <div className={`${cat.bg} p-1 rounded`}>
                        <Icon className={`w-3 h-3 ${cat.color}`} />
                      </div>
                      <span className="text-sm text-gray-700">{cat.label}</span>
                    </div>
                    <span className="text-sm font-medium text-gray-800">
                      TZS {parseFloat(c.amount).toLocaleString()}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm mb-4">
        <div className="p-4 border-b border-gray-100">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Tafuta..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
              />
            </div>

            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none bg-white"
            >
              <option value="">Category: Zote</option>
              {Object.entries(CATEGORY_MAP).map(([value, config]) => (
                <option key={value} value={value}>
                  {config.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          {loading ? (
            <div className="p-8 text-center text-gray-500">Inapakia...</div>
          ) : filteredExpenses.length === 0 ? (
            <div className="p-8 text-center">
              <Wallet className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">Hakuna matumizi bado</p>
            </div>
          ) : (
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">
                    Category
                  </th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">
                    Maelezo
                  </th>
                  <th className="text-right px-6 py-3 text-xs font-medium text-gray-500 uppercase">
                    Kiasi
                  </th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">
                    Tarehe
                  </th>
                  {canWrite && (
                    <th className="text-right px-6 py-3 text-xs font-medium text-gray-500 uppercase">
                      Vitendo
                    </th>
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredExpenses.map((exp) => {
                  const cat = CATEGORY_MAP[exp.category] || CATEGORY_MAP.OTHER;
                  const Icon = cat.icon;
                  return (
                    <tr key={exp.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <div className={`${cat.bg} p-2 rounded-lg`}>
                            <Icon className={`w-4 h-4 ${cat.color}`} />
                          </div>
                          <span className="font-medium text-gray-800">
                            {cat.label}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-gray-600 text-sm">
                        {exp.description || "-"}
                      </td>
                      <td className="px-6 py-4 text-right font-medium text-red-600">
                        TZS {parseFloat(exp.amount).toLocaleString()}
                      </td>
                      <td className="px-6 py-4 text-gray-600 text-sm">
                        {new Date(exp.expense_date).toLocaleDateString(
                          "sw-TZ",
                          {
                            day: "2-digit",
                            month: "short",
                            year: "numeric",
                          },
                        )}
                      </td>
                      {canWrite && (
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={() => openEdit(exp)}
                              className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition"
                              title="Sasisha"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => setDeleteTarget(exp)}
                              className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition"
                              title="Futa"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
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

      {/* Create/Edit Modal */}
      <Modal
        isOpen={showModal}
        onClose={() => {
          setShowModal(false);
          setEditing(null);
        }}
        title={editing ? "Sasisha Matumizi" : "Ongeza Matumizi"}
        size="md"
      >
        <ExpenseForm
          initialData={editing}
          onSubmit={handleSubmit}
          loading={submitting}
        />
      </Modal>

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Futa Matumizi"
        message={`Una uhakika unataka kufuta matumizi ya TZS ${parseFloat(
          deleteTarget?.amount || 0,
        ).toLocaleString()}?`}
        confirmText="Futa"
        variant="danger"
        loading={deleting}
      />
    </div>
  );
};

export default Expenses;
