import { useState, useEffect, useCallback } from "react";
import {
  Plus, Search, Edit, Trash2, Key, Users as UsersIcon,
  Shield, ShieldCheck, UserCheck, RefreshCw, Loader2
} from "lucide-react";
import toast from "react-hot-toast";
import { userApi } from "../api/user.api";
import Modal from "../components/Modal";
import ConfirmDialog from "../components/ConfirmDialog";
import UserForm from "../components/UserForm";
import ChangePasswordForm from "../components/ChangePasswordForm";
import { useAuth } from "../context/AuthContext";

const ROLE_LABELS = { SUPER_ADMIN: "Super Admin", ADMIN: "Admin", OPERATOR: "Operator" };
const ROLE_COLORS = { SUPER_ADMIN: "bg-red-100 text-red-700", ADMIN: "bg-purple-100 text-purple-700", OPERATOR: "bg-blue-100 text-blue-700" };
const ROLE_ICONS = { SUPER_ADMIN: ShieldCheck, ADMIN: Shield, OPERATOR: UserCheck };

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

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const filters = {}; if (roleFilter) filters.role = roleFilter;
      const response = await userApi.getAll(filters);
      setUsers(response.data.users || []);
    } catch (err) {
      toast.error(err.response?.data?.message || "Imeshindwa kupata users");
    } finally { setLoading(false); }
  }, [roleFilter]);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  const filteredUsers = users.filter((u) => {
    const searchLower = search.toLowerCase();
    return u.username?.toLowerCase().includes(searchLower) || u.full_name?.toLowerCase().includes(searchLower) || u.email?.toLowerCase().includes(searchLower) || u.phone?.includes(searchLower);
  });

  const handleSubmit = async (data) => {
    setSubmitting(true);
    let success = false;
    try {
      if (editingUser) { await userApi.update(editingUser.id, data); toast.success("User amesasishwa"); }
      else { await userApi.create(data); toast.success("User ameundwa"); }
      success = true; setShowUserModal(false); setEditingUser(null);
    } catch (err) { toast.error(err.response?.data?.message || "Imeshindwa kuhifadhi"); }
    finally { setSubmitting(false); if (success) fetchUsers(); }
  };

  const handleChangePassword = async (newPassword) => {
    if (!passwordTarget) return;
    setChangingPassword(true);
    try {
      await userApi.changePassword(passwordTarget.id, newPassword);
      toast.success("Password imebadilishwa"); setPasswordTarget(null);
    } catch (err) { toast.error(err.response?.data?.message || "Imeshindwa kubadilisha"); }
    finally { setChangingPassword(false); }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    let success = false;
    try {
      await userApi.remove(deleteTarget.id); toast.success("User amefutwa");
      success = true; setDeleteTarget(null);
    } catch (err) { toast.error(err.response?.data?.message || "Imeshindwa kufuta"); }
    finally { setDeleting(false); if (success) fetchUsers(); }
  };

  const canEditUser = (targetUser) => {
    if (!canManage) return false;
    if (targetUser.role === "SUPER_ADMIN" && !canManageAdmins) return false;
    return true;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Watumiaji</h1>
          <p className="text-gray-500 mt-1">Kusimamia admins na operators</p>
        </div>
        <div className="flex gap-2">
          <button onClick={fetchUsers} disabled={loading} className="inline-flex items-center gap-2 bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 font-medium px-4 py-2 rounded-xl transition shadow-sm disabled:opacity-50">
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} /> Refresh
          </button>
          {canManage && (
            <button onClick={() => { setEditingUser(null); setShowUserModal(true); }} className="inline-flex items-center gap-2 bg-primary-600 hover:bg-primary-700 text-white font-medium px-5 py-2.5 rounded-xl transition shadow-sm">
              <Plus className="w-5 h-5" /> User Mpya
            </button>
          )}
        </div>
      </div>

      {/* Stats & Filters */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        <div className="lg:col-span-1 bg-white rounded-2xl p-5 border border-gray-100 shadow-sm flex items-center justify-between">
           <div><p className="text-xs font-medium text-gray-500">Jumla ya Watumiaji</p><p className="text-2xl font-bold text-gray-800 mt-1">{users.length}</p></div>
           <div className="bg-primary-50 p-3 rounded-xl"><UsersIcon className="w-6 h-6 text-primary-600" /></div>
        </div>
        
        <div className="lg:col-span-3 bg-white rounded-2xl border border-gray-100 shadow-sm p-2 flex flex-col sm:flex-row gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Tafuta jina, username, au email..." className="w-full pl-10 pr-4 py-2.5 border-none focus:ring-0 outline-none text-sm bg-transparent" />
          </div>
          <select value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)} className="px-3 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 outline-none bg-gray-50 text-sm font-medium text-gray-700">
            <option value="">Role: Zote</option>
            <option value="SUPER_ADMIN">Super Admin</option>
            <option value="ADMIN">Admin</option>
            <option value="OPERATOR">Operator</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          {loading ? (
            <div className="p-10 flex flex-col items-center justify-center text-gray-500"><Loader2 className="w-8 h-8 animate-spin text-primary-500 mb-3" /><p>Inapakia watumiaji...</p></div>
          ) : filteredUsers.length === 0 ? (
            <div className="p-10 text-center"><UsersIcon className="w-12 h-12 text-gray-300 mx-auto mb-3" /><p className="text-gray-500 font-medium">Hakuna watumiaji waliopatikana</p></div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50/50 border-b border-gray-100">
                  <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Mtumiaji</th>
                  <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Username</th>
                  <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider text-center">Role</th>
                  <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider text-center">Hali</th>
                  <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider text-center">Vitendo</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredUsers.map((u) => {
                  const RoleIcon = ROLE_ICONS[u.role] || UsersIcon;
                  const isSelf = u.id === currentUser?.userId;
                  const editable = canEditUser(u);
                  return (
                    <tr key={u.id} className="hover:bg-gray-50/80 transition-colors group">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center shadow-inner">
                            <span className="text-primary-700 font-bold text-sm">{u.username?.[0]?.toUpperCase()}</span>
                          </div>
                          <div>
                            <p className="font-semibold text-gray-800 group-hover:text-primary-600 transition">{u.full_name} {isSelf && <span className="text-xs text-primary-500 font-normal ml-1">(Wewe)</span>}</p>
                            <p className="text-xs text-gray-500">{u.email || u.phone || '-'}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm font-mono text-gray-600">{u.username}</td>
                      <td className="px-6 py-4 text-center">
                        <span className={`inline-flex items-center gap-1.5 px-3 py-1 text-xs font-semibold rounded-full ${ROLE_COLORS[u.role]}`}>
                          <RoleIcon className="w-3.5 h-3.5" /> {ROLE_LABELS[u.role]}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className={`inline-block px-2.5 py-1 text-xs font-semibold rounded-full ${u.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                          {u.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <div className="flex items-center justify-center gap-2">
                          {canManage && (
                            <button onClick={() => setPasswordTarget(u)} className="p-2 text-orange-600 hover:bg-orange-50 rounded-lg transition" title="Badilisha password"><Key className="w-4 h-4" /></button>
                          )}
                          {editable && (
                            <button onClick={() => { setEditingUser(u); setShowUserModal(true); }} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition" title="Sasisha"><Edit className="w-4 h-4" /></button>
                          )}
                          {editable && !isSelf && (
                            <button onClick={() => setDeleteTarget(u)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition" title="Futa"><Trash2 className="w-4 h-4" /></button>
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

      {/* Modals */}
      <Modal isOpen={showUserModal} onClose={() => { setShowUserModal(false); setEditingUser(null); }} title={editingUser ? "Sasisha User" : "Unda User Mpya"} size="md">
        <UserForm initialData={editingUser} onSubmit={handleSubmit} loading={submitting} isEditing={!!editingUser} />
      </Modal>

      <Modal isOpen={!!passwordTarget} onClose={() => setPasswordTarget(null)} title="Badilisha Password" size="sm">
        {passwordTarget && <ChangePasswordForm userName={passwordTarget.full_name} onSubmit={handleChangePassword} loading={changingPassword} />}
      </Modal>

      <ConfirmDialog isOpen={!!deleteTarget} onClose={() => setDeleteTarget(null)} onConfirm={handleDelete} title="Futa User" message={`Una uhakika unataka kumfuta "${deleteTarget?.full_name}"?`} confirmText="Futa" variant="danger" loading={deleting} />
    </div>
  );
};

export default Users;