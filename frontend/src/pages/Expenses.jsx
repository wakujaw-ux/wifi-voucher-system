import { useState, useEffect, useCallback } from "react";
import {
  Plus, Search, Edit, Trash2, Wallet, RefreshCw,
  Zap, Wifi, Wrench, Car, Package, Users, Home, MoreHorizontal, Loader2
} from "lucide-react";
import toast from "react-hot-toast";
import { expenseApi } from "../api/expense.api";
import Modal from "../components/Modal";
import ConfirmDialog from "../components/ConfirmDialog";
import ExpenseForm from "../components/ExpenseForm";
import { useAuth } from "../context/AuthContext";

const CATEGORY_MAP = {
  INTERNET: { label: "Internet", icon: Wifi, color: "text-blue-600", bg: "bg-blue-50" },
  ELECTRICITY: { label: "Umeme", icon: Zap, color: "text-yellow-600", bg: "bg-yellow-50" },
  MAINTENANCE: { label: "Matengenezo", icon: Wrench, color: "text-orange-600", bg: "bg-orange-50" },
  TRANSPORT: { label: "Usafiri", icon: Car, color: "text-purple-600", bg: "bg-purple-50" },
  EQUIPMENT: { label: "Vifaa", icon: Package, color: "text-indigo-600", bg: "bg-indigo-50" },
  STAFF: { label: "Wafanyakazi", icon: Users, color: "text-pink-600", bg: "bg-pink-50" },
  RENT: { label: "Kodi", icon: Home, color: "text-green-600", bg: "bg-green-50" },
  OTHER: { label: "Nyingine", icon: MoreHorizontal, color: "text-gray-600", bg: "bg-gray-50" },
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
        expenseApi.getAll(filters), expenseApi.getSummary(),
      ]);
      setExpenses(expensesRes.data.expenses || []);
      setSummary(summaryRes.data.summary);
    } catch (err) {
      toast.error(err.response?.data?.message || "Imeshindwa kupata data");
    } finally { setLoading(false); }
  }, [categoryFilter]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const filteredExpenses = expenses.filter((e) => {
    const searchLower = search.toLowerCase();
    return e.category?.toLowerCase().includes(searchLower) || e.description?.toLowerCase().includes(searchLower);
  });

  const handleSubmit = async (data) => {
    setSubmitting(true); let success = false;
    try {
      if (editing) { await expenseApi.update(editing.id, data); toast.success("Expense imesasishwa"); }
      else { await expenseApi.create(data); toast.success("Expense imeundwa"); }
      success = true; setShowModal(false); setEditing(null);
    } catch (err) { toast.error(err.response?.data?.message || "Imeshindwa kuhifadhi"); }
    finally { setSubmitting(false); if (success) fetchData(); }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true); let success = false;
    try {
      await expenseApi.remove(deleteTarget.id); toast.success("Expense imefutwa");
      success = true; setDeleteTarget(null);
    } catch (err) { toast.error(err.response?.data?.message || "Imeshindwa kufuta"); }
    finally { setDeleting(false); if (success) fetchData(); }
  };

  const formatCurrency = (value) => {
    const num = parseFloat(value || 0);
    return `TZS ${num.toLocaleString("en-US", { maximumFractionDigits: 0 })}`;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Matumizi</h1>
          <p className="text-gray-500 mt-1">Kusimamia gharama za biashara</p>
        </div>
        <div className="flex gap-2">
          <button onClick={fetchData} disabled={loading} className="inline-flex items-center gap-2 bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 font-medium px-4 py-2 rounded-xl transition shadow-sm disabled:opacity-50">
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} /> Refresh
          </button>
          {canWrite && (
            <button onClick={() => { setEditing(null); setShowModal(true); }} className="inline-flex items-center gap-2 bg-primary-600 hover:bg-primary-700 text-white font-medium px-5 py-2.5 rounded-xl transition shadow-sm">
              <Plus className="w-5 h-5" /> Ongeza Matumizi
            </button>
          )}
        </div>
      </div>

      {/* Summary Stats */}
      {summary && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm flex items-center justify-between">
            <div><p className="text-xs font-medium text-gray-500">Jumla ya Matumizi</p><p className="text-2xl font-bold text-red-600 mt-1">{formatCurrency(summary.total_amount)}</p></div>
            <div className="bg-red-50 p-3 rounded-xl"><Wallet className="w-6 h-6 text-red-600" /></div>
          </div>
          <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm flex items-center justify-between">
            <div><p className="text-xs font-medium text-gray-500">Idadi ya Matumizi</p><p className="text-2xl font-bold text-gray-800 mt-1">{summary.total_count}</p></div>
            <div className="bg-gray-50 p-3 rounded-xl"><Package className="w-6 h-6 text-gray-600" /></div>
          </div>
          <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
            <p className="text-xs font-medium text-gray-500 mb-3">Matumizi kwa Kundi</p>
            <div className="flex flex-wrap gap-2">
               {(summary.by_category || []).slice(0,3).map(c => {
                 const cat = CATEGORY_MAP[c.category] || CATEGORY_MAP.OTHER;
                 return <span key={c.category} className={`inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium ${cat.bg} ${cat.color}`}>{cat.label}: {formatCurrency(c.amount)}</span>
               })}
            </div>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        {/* Filters */}
        <div className="p-5 border-b border-gray-100 bg-gray-50/30 flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Tafuta maelezo..." className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 outline-none text-sm transition" />
          </div>
          <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)} className="px-3 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 outline-none bg-white text-sm font-medium text-gray-700">
            <option value="">Kundi: Zote</option>
            {Object.entries(CATEGORY_MAP).map(([val, cfg]) => <option key={val} value={val}>{cfg.label}</option>)}
          </select>
        </div>

        <div className="overflow-x-auto">
          {loading ? (
            <div className="p-10 flex flex-col items-center justify-center text-gray-500"><Loader2 className="w-8 h-8 animate-spin text-primary-500 mb-3" /><p>Inapakia matumizi...</p></div>
          ) : filteredExpenses.length === 0 ? (
            <div className="p-10 text-center"><Wallet className="w-12 h-12 text-gray-300 mx-auto mb-3" /><p className="text-gray-500 font-medium">Hakuna matumizi yaliyopatikana</p></div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50/50 border-b border-gray-100">
                  <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Kundi</th>
                  <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Maelezo</th>
                  <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider text-right">Kiasi</th>
                  <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Tarehe</th>
                  {canWrite && <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider text-center">Vitendo</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredExpenses.map((exp) => {
                  const cat = CATEGORY_MAP[exp.category] || CATEGORY_MAP.OTHER;
                  const Icon = cat.icon;
                  return (
                    <tr key={exp.id} className="hover:bg-gray-50/80 transition-colors group">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className={`${cat.bg} p-2 rounded-xl`}><Icon className={`w-4 h-4 ${cat.color}`} /></div>
                          <span className="font-semibold text-gray-800">{cat.label}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">{exp.description || '-'}</td>
                      <td className="px-6 py-4 text-sm font-bold text-red-600 text-right">{formatCurrency(exp.amount)}</td>
                      <td className="px-6 py-4 text-sm text-gray-600">{new Date(exp.expense_date).toLocaleDateString('sw-TZ', { day: '2-digit', month: 'short', year: 'numeric' })}</td>
                      {canWrite && (
                        <td className="px-6 py-4 text-center">
                          <div className="flex items-center justify-center gap-2">
                            <button onClick={() => { setEditing(exp); setShowModal(true); }} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition" title="Sasisha"><Edit className="w-4 h-4" /></button>
                            <button onClick={() => setDeleteTarget(exp)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition" title="Futa"><Trash2 className="w-4 h-4" /></button>
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

      {/* Modals */}
      <Modal isOpen={showModal} onClose={() => { setShowModal(false); setEditing(null); }} title={editing ? "Sasisha Matumizi" : "Ongeza Matumizi"} size="md">
        <ExpenseForm initialData={editing} onSubmit={handleSubmit} loading={submitting} />
      </Modal>

      <ConfirmDialog isOpen={!!deleteTarget} onClose={() => setDeleteTarget(null)} onConfirm={handleDelete} title="Futa Matumizi" message={`Una uhakika unataka kufuta matumizi ya ${formatCurrency(deleteTarget?.amount || 0)}?`} confirmText="Futa" variant="danger" loading={deleting} />
    </div>
  );
};

export default Expenses;