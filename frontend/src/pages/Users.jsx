import { useState, useEffect, useCallback } from "react";
import {
  Plus,
  Search,
  Edit,
  Trash2,
  Key,
  Users as UsersIcon,
  Shield,
  ShieldCheck,
  UserCheck,
  RefreshCw,
} from "lucide-react";
import toast from "react-hot-toast";
import { userApi } from "../api/user.api";
import Modal from "../components/Modal";
import ConfirmDialog from "../components/ConfirmDialog";
import UserForm from "../components/UserForm";
import ChangePasswordForm from "../components/ChangePasswordForm";
import { useAuth } from "../context/AuthContext";

const ROLE_LABELS = {
  SUPER_ADMIN: "Super Admin",
  ADMIN: "Admin",
  OPERATOR: "Operator",
};

const ROLE_COLORS = {
  SUPER_ADMIN: "bg-red-100 text-red-700",
  ADMIN: "bg-purple-100 text-purple-700",
  OPERATOR: "bg-blue-100 text-blue-700",
};

const ROLE_ICONS = {
  SUPER_ADMIN: ShieldCheck,
  ADMIN: Shield,
  OPERATOR: UserCheck,
};

const Users = () => {
  const { user: currentUser } = useAuth();

  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("");

  // Modals
  const [showUserModal, setShowUserModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const [passwordTarget, setPasswordTarget] = useState(null);
  const [changingPassword, setChangingPassword] = useState(false);

  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const canManage = ["SUPER_ADMIN", "ADMIN"].includes(currentUser?.role);
  const canManageAdmins = currentUser?.role === "SUPER_ADMIN";

  // Pata users
  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const filters = {};
      if (roleFilter) filters.role = roleFilter;

      const response = await userApi.getAll(filters);
      setUsers(response.data.users || []);
    } catch (err) {
      toast.error(err.response?.data?.message || "Imeshindwa kupata users");
    } finally {
      setLoading(false);
    }
  }, [roleFilter]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  // Search filter (client-side)
  const filteredUsers = users.filter((u) => {
    const searchLower = search.toLowerCase();
    return (
      u.username?.toLowerCase().includes(searchLower) ||
      u.full_name?.toLowerCase().includes(searchLower) ||
      u.email?.toLowerCase().includes(searchLower) ||
      u.phone?.includes(searchLower)
    );
  });

  // Unda / Sasisha
  const handleSubmit = async (data) => {
    setSubmitting(true);
    try {
      if (editingUser) {
        await userApi.update(editingUser.id, data);
        toast.success("User amesasishwa");
      } else {
        await userApi.create(data);
        toast.success("User ameundwa");
      }
      setShowUserModal(false);
      setEditingUser(null);
      fetchUsers();
    } catch (err) {
      toast.error(err.response?.data?.message || "Imeshindwa kuhifadhi");
    } finally {
      setSubmitting(false);
    }
  };

  // Badilisha password
  const handleChangePassword = async (newPassword) => {
    if (!passwordTarget) return;
    setChangingPassword(true);
    try {
      await userApi.changePassword(passwordTarget.id, newPassword);
      toast.success("Password imebadilishwa");
      setPasswordTarget(null);
    } catch (err) {
      toast.error(err.response?.data?.message || "Imeshindwa kubadilisha");
    } finally {
      setChangingPassword(false);
    }
  };

  // Futa
  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await userApi.remove(deleteTarget.id);
      toast.success("User amefutwa");
      setDeleteTarget(null);
      fetchUsers();
    } catch (err) {
      toast.error(err.response?.data?.message || "Imeshindwa kufuta");
    } finally {
      setDeleting(false);
    }
  };

  const openCreate = () => {
    setEditingUser(null);
    setShowUserModal(true);
  };

  const openEdit = (u) => {
    setEditingUser(u);
    setShowUserModal(true);
  };

  // Ruhusa ya kuhariri user fulani
  const canEditUser = (targetUser) => {
    if (!canManage) return false;
    if (targetUser.role === "SUPER_ADMIN" && !canManageAdmins) return false;
    return true;
  };

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Watumiaji</h1>
          <p className="text-gray-500 mt-1">Kusimamia admins na operators</p>
        </div>

        <div className="flex gap-2">
          <button
            onClick={fetchUsers}
            disabled={loading}
            className="inline-flex items-center gap-2 bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 font-medium px-4 py-2 rounded-lg transition disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </button>

          {canManage && (
            <button
              onClick={openCreate}
              className="inline-flex items-center gap-2 bg-primary-600 hover:bg-primary-700 text-white font-medium px-4 py-2 rounded-lg transition"
            >
              <Plus className="w-4 h-4" />
              User Mpya
            </button>
          )}
        </div>
      </div>

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
                placeholder="Tafuta username, jina, email..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
              />
            </div>

            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none bg-white"
            >
              <option value="">Role: Zote</option>
              <option value="SUPER_ADMIN">Super Admin</option>
              <option value="ADMIN">Admin</option>
              <option value="OPERATOR">Operator</option>
            </select>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          {loading ? (
            <div className="p-8 text-center text-gray-500">Inapakia...</div>
          ) : filteredUsers.length === 0 ? (
            <div className="p-8 text-center">
              <UsersIcon className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">Hakuna watumiaji waliopatikana</p>
            </div>
          ) : (
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">
                    Jina
                  </th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">
                    Username
                  </th>
                  <th className="text-center px-6 py-3 text-xs font-medium text-gray-500 uppercase">
                    Role
                  </th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">
                    Mawasiliano
                  </th>
                  <th className="text-center px-6 py-3 text-xs font-medium text-gray-500 uppercase">
                    Hali
                  </th>
                  <th className="text-right px-6 py-3 text-xs font-medium text-gray-500 uppercase">
                    Vitendo
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredUsers.map((u) => {
                  const RoleIcon = ROLE_ICONS[u.role] || UsersIcon;
                  const isSelf = u.id === currentUser?.userId;
                  const editable = canEditUser(u);

                  return (
                    <tr key={u.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-primary-100 flex items-center justify-center">
                            <span className="text-primary-600 font-bold text-sm">
                              {u.username?.[0]?.toUpperCase()}
                            </span>
                          </div>
                          <div>
                            <p className="font-medium text-gray-800">
                              {u.full_name}
                              {isSelf && (
                                <span className="ml-2 text-xs text-primary-600">
                                  (Wewe)
                                </span>
                              )}
                            </p>
                            <p className="text-xs text-gray-500">
                              {u.email || "-"}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-gray-700 font-mono text-sm">
                        {u.username}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full ${
                            ROLE_COLORS[u.role]
                          }`}
                        >
                          <RoleIcon className="w-3 h-3" />
                          {ROLE_LABELS[u.role]}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-gray-600 text-sm">
                        {u.phone || "-"}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span
                          className={`inline-block px-2 py-1 text-xs font-medium rounded-full ${
                            u.is_active
                              ? "bg-green-100 text-green-700"
                              : "bg-gray-100 text-gray-600"
                          }`}
                        >
                          {u.is_active ? "Active" : "Inactive"}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          {canManage && (
                            <button
                              onClick={() => setPasswordTarget(u)}
                              className="p-2 text-orange-600 hover:bg-orange-50 rounded-lg transition"
                              title="Badilisha password"
                            >
                              <Key className="w-4 h-4" />
                            </button>
                          )}
                          {editable && (
                            <button
                              onClick={() => openEdit(u)}
                              className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition"
                              title="Sasisha"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                          )}
                          {editable && !isSelf && (
                            <button
                              onClick={() => setDeleteTarget(u)}
                              className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition"
                              title="Futa"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
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
        isOpen={showUserModal}
        onClose={() => {
          setShowUserModal(false);
          setEditingUser(null);
        }}
        title={editingUser ? "Sasisha User" : "Unda User Mpya"}
        size="md"
      >
        <UserForm
          initialData={editingUser}
          onSubmit={handleSubmit}
          loading={submitting}
          isEditing={!!editingUser}
        />
      </Modal>

      {/* Change Password Modal */}
      <Modal
        isOpen={!!passwordTarget}
        onClose={() => setPasswordTarget(null)}
        title="Badilisha Password"
        size="sm"
      >
        {passwordTarget && (
          <ChangePasswordForm
            userName={passwordTarget.full_name}
            onSubmit={handleChangePassword}
            loading={changingPassword}
          />
        )}
      </Modal>

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Futa User"
        message={`Una uhakika unataka kumfuta "${deleteTarget?.full_name}"? User hataweza kuingia tena.`}
        confirmText="Futa"
        variant="danger"
        loading={deleting}
      />
    </div>
  );
};

export default Users;
