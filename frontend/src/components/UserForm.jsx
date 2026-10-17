import { useState, useEffect } from "react";
import toast from "react-hot-toast";

const SITE_ID = "11111111-1111-1111-1111-111111111111";

const UserForm = ({ initialData, onSubmit, loading, isEditing = false }) => {
  const [formData, setFormData] = useState({
    username: "",
    full_name: "",
    email: "",
    phone: "",
    password: "",
    role: "OPERATOR",
  });

  useEffect(() => {
    if (initialData) {
      setFormData({
        username: initialData.username || "",
        full_name: initialData.full_name || "",
        email: initialData.email || "",
        phone: initialData.phone || "",
        password: "", // Password haijarudishwa
        role: initialData.role || "OPERATOR",
      });
    }
  }, [initialData]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    // Validation
    if (!formData.username.trim() || formData.username.trim().length < 3) {
      toast.error("Username lazima iwe herufi 3 au zaidi");
      return;
    }

    if (!formData.full_name.trim()) {
      toast.error("Jina kamili linahitajika");
      return;
    }

    if (!isEditing) {
      if (!formData.password || formData.password.length < 6) {
        toast.error("Password lazima iwe herufi 6 au zaidi");
        return;
      }
    }

    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      toast.error("Email si sahihi");
      return;
    }

    const payload = {
      site_id: SITE_ID,
      full_name: formData.full_name.trim(),
      email: formData.email.trim() || null,
      phone: formData.phone.trim() || null,
      role: formData.role,
    };

    if (!isEditing) {
      payload.username = formData.username.trim();
      payload.password = formData.password;
    }

    onSubmit(payload);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {!isEditing && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Username *
          </label>
          <input
            type="text"
            name="username"
            value={formData.username}
            onChange={handleChange}
            required
            placeholder="Mfano: operator1"
            disabled={isEditing}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none disabled:bg-gray-100 disabled:cursor-not-allowed"
          />
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Jina Kamili *
        </label>
        <input
          type="text"
          name="full_name"
          value={formData.full_name}
          onChange={handleChange}
          required
          placeholder="Mfano: John Mwangi"
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Email
          </label>
          <input
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            placeholder="john@example.com"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Simu
          </label>
          <input
            type="tel"
            name="phone"
            value={formData.phone}
            onChange={handleChange}
            placeholder="0712345678"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
          />
        </div>
      </div>

      {!isEditing && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Password *
          </label>
          <input
            type="password"
            name="password"
            value={formData.password}
            onChange={handleChange}
            required
            minLength="6"
            placeholder="Herufi 6 au zaidi"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
          />
          <p className="text-xs text-gray-500 mt-1">
            Password itahifadhiwa kwa usalama (bcrypt)
          </p>
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Role *
        </label>
        <select
          name="role"
          value={formData.role}
          onChange={handleChange}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none bg-white"
        >
          <option value="OPERATOR">Operator (anauza vocha tu)</option>
          <option value="ADMIN">Admin (anasimamia biashara)</option>
          <option value="SUPER_ADMIN">Super Admin (mmiliki)</option>
        </select>
      </div>

      <div className="pt-4 border-t border-gray-200">
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-primary-600 hover:bg-primary-700 text-white font-medium py-2 rounded-lg transition disabled:opacity-50"
        >
          {loading ? "Inahifadhi..." : isEditing ? "Sasisha User" : "Unda User"}
        </button>
      </div>
    </form>
  );
};

export default UserForm;
