import { useState, useEffect, useCallback } from "react";
import {
  Plus,
  Edit,
  Trash2,
  Search,
  Package as PackageIcon,
  ShoppingCart,
} from "lucide-react";
import toast from "react-hot-toast";
import { packageApi } from "../api/package.api";
import Modal from "../components/Modal";
import ConfirmDialog from "../components/ConfirmDialog";
import PackageForm from "../components/PackageForm";
import { useAuth } from "../context/AuthContext";
import { voucherApi } from "../api/voucher.api";

const Packages = () => {
  const { user } = useAuth();
  const [packages, setPackages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  // Ruhusa ya kuandika (create/update/delete)
  const canWrite = ["ADMIN", "SUPER_ADMIN"].includes(user?.role);
  const canSell = ["ADMIN", "SUPER_ADMIN", "OPERATOR"].includes(user?.role);

  const fetchPackages = useCallback(async () => {
    setLoading(true);
    try {
      const response = await packageApi.getAll();
      setPackages(response.data.packages || []);
    } catch (err) {
      toast.error(err.response?.data?.message || "Imeshindwa kupata packages");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPackages();
  }, [fetchPackages]);

  // Filter kwa search
  const filteredPackages = packages.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase()),
  );
  // Unda / Sasisha
  const handleSubmit = async (data) => {
    setSubmitting(true);
    let success = false;

    try {
      if (editing) {
        await packageApi.update(editing.id, data);
        toast.success("Package imesasishwa");
      } else {
        await packageApi.create({
          site_id: "11111111-1111-1111-1111-111111111111",
          ...data,
        });
        toast.success("Package imeundwa");
      }
      success = true;
      setShowModal(false);
      setEditing(null);
    } catch (err) {
      toast.error(err.response?.data?.message || "Imeshindwa kuhifadhi");
    } finally {
      setSubmitting(false);
      // Tufanye fetch nje ya try/catch ili isilete meseji ya kosa mara mbili
      if (success) {
        fetchPackages();
      }
    }
  };

  // Futa
  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    let success = false;

    try {
      await packageApi.remove(deleteTarget.id);
      toast.success("Package imefutwa");
      success = true;
      setDeleteTarget(null);
    } catch (err) {
      toast.error(err.response?.data?.message || "Imeshindwa kufuta");
    } finally {
      setDeleting(false);
      if (success) {
        fetchPackages();
      }
    }
  };

  const openCreate = () => {
    setEditing(null);
    setShowModal(true);
  };

  const openEdit = (pkg) => {
    setEditing(pkg);
    setShowModal(true);
  };

  // Function ya Kuuza Vocha Moja kwa Moja
  const handleQuickSell = async (pkg) => {
    if (
      !window.confirm(
        `Uza vocha 1 ya ${pkg.name} kwa TZS ${parseFloat(pkg.price).toLocaleString()}?`,
      )
    )
      return;

    try {
      toast.loading("Inazalisha na kuuza vocha...", { id: "quickSell" });

      // 1. Zalisha vocha moja
      const genRes = await voucherApi.generate({
        site_id: pkg.site_id || "11111111-1111-1111-1111-111111111111",
        package_id: pkg.id,
        quantity: 1,
        prefix: "SALE",
        notes: "Quick Sale kutoka Packages",
      });

      const newVoucher = genRes.data.vouchers[0];
      if (!newVoucher) throw new Error("Imeshindwa kuzalisha vocha");

      // 2. Iuze papo hapo
      await voucherApi.sell(newVoucher.id, {
        payment_method: "CASH",
      });

      toast.success(`Vocha (${newVoucher.code}) ya ${pkg.name} imeuzwa!`, {
        id: "quickSell",
      });
    } catch (err) {
      toast.error(err.response?.data?.message || "Imeshindwa kuuza vocha", {
        id: "quickSell",
      });
    }
  };

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Packages</h1>
          <p className="text-gray-500 mt-1">Kusimamia aina za vocha na bei</p>
        </div>

        {canWrite && (
          <button
            onClick={openCreate}
            className="inline-flex items-center gap-2 bg-primary-600 hover:bg-primary-700 text-white font-medium px-4 py-2 rounded-lg transition"
          >
            <Plus className="w-4 h-4" />
            Package Mpya
          </button>
        )}
      </div>

      {/* Search */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm mb-4">
        <div className="p-4 border-b border-gray-100">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Tafuta package..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
            />
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          {loading ? (
            <div className="p-8 text-center text-gray-500">Inapakia...</div>
          ) : filteredPackages.length === 0 ? (
            <div className="p-8 text-center">
              <PackageIcon className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">
                {search
                  ? "Hakuna package inayolingana"
                  : "Hakuna packages bado"}
              </p>
            </div>
          ) : (
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">
                    Jina
                  </th>
                  <th className="text-right px-6 py-3 text-xs font-medium text-gray-500 uppercase">
                    Bei
                  </th>
                  <th className="text-right px-6 py-3 text-xs font-medium text-gray-500 uppercase">
                    Muda
                  </th>
                  <th className="text-right px-6 py-3 text-xs font-medium text-gray-500 uppercase">
                    Speed
                  </th>
                  <th className="text-center px-6 py-3 text-xs font-medium text-gray-500 uppercase">
                    Hali
                  </th>
                  {canWrite && (
                    <th className="text-right px-6 py-3 text-xs font-medium text-gray-500 uppercase">
                      Vitendo
                    </th>
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredPackages.map((pkg) => (
                  <tr key={pkg.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div>
                        <p className="font-medium text-gray-800">{pkg.name}</p>
                        {pkg.description && (
                          <p className="text-xs text-gray-500 mt-0.5">
                            {pkg.description}
                          </p>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right font-medium text-gray-800">
                      TZS {parseFloat(pkg.price).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 text-right text-gray-600">
                      {pkg.duration_minutes} min
                    </td>
                    <td className="px-6 py-4 text-right text-gray-600">
                      {pkg.speed_limit_mbps} Mbps
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span
                        className={`inline-block px-2 py-1 text-xs font-medium rounded-full ${
                          pkg.is_active
                            ? "bg-green-100 text-green-700"
                            : "bg-gray-100 text-gray-600"
                        }`}
                      >
                        {pkg.is_active ? "Active" : "Inactive"}
                      </span>
                    </td>
                    {canWrite && (
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {/* KITUFE CHA KUUZA (KIPYA) */}
                          {canSell && (
                            <button
                              onClick={() => handleQuickSell(pkg)}
                              className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition"
                              title="Uza Vocha 1"
                            >
                              <ShoppingCart className="w-4 h-4" />
                            </button>
                          )}

                          <button
                            onClick={() => openEdit(pkg)}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition"
                            title="Sasisha"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setDeleteTarget(pkg)}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition"
                            title="Futa"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
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
        title={editing ? "Sasisha Package" : "Unda Package Mpya"}
        size="lg"
      >
        <PackageForm
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
        title="Futa Package"
        message={`Una uhakika unataka kufuta "${deleteTarget?.name}"? Vocha zilizopo haziathiriki.`}
        confirmText="Futa"
        variant="danger"
        loading={deleting}
      />
    </div>
  );
};

export default Packages;
