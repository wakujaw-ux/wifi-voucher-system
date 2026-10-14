import { useState, useEffect } from "react";

const PackageForm = ({ initialData, onSubmit, loading }) => {
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    price: "",
    duration_minutes: "",
    validity_days: 30,
    speed_limit_mbps: 5,
    device_limit: 1,
  });

  useEffect(() => {
    if (initialData) {
      setFormData({
        name: initialData.name || "",
        description: initialData.description || "",
        price: initialData.price || "",
        duration_minutes: initialData.duration_minutes || "",
        validity_days: initialData.validity_days || 30,
        speed_limit_mbps: initialData.speed_limit_mbps || 5,
        device_limit: initialData.device_limit || 1,
      });
    }
  }, [initialData]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    const payload = {
      name: formData.name.trim(),
      description: formData.description.trim() || null,
      price: parseFloat(formData.price),
      duration_minutes: parseInt(formData.duration_minutes, 10),
      validity_days: parseInt(formData.validity_days, 10),
      speed_limit_mbps: parseInt(formData.speed_limit_mbps, 10),
      device_limit: parseInt(formData.device_limit, 10),
    };

    onSubmit(payload);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Jina la Package *
        </label>
        <input
          type="text"
          name="name"
          value={formData.name}
          onChange={handleChange}
          required
          placeholder="Mfano: 1 Hour"
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Maelezo
        </label>
        <textarea
          name="description"
          value={formData.description}
          onChange={handleChange}
          rows="2"
          placeholder="Maelezo ya package (optional)"
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Bei (TZS) *
          </label>
          <input
            type="number"
            name="price"
            value={formData.price}
            onChange={handleChange}
            required
            min="1"
            step="1"
            placeholder="500"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Muda (dakika) *
          </label>
          <input
            type="number"
            name="duration_minutes"
            value={formData.duration_minutes}
            onChange={handleChange}
            required
            min="1"
            placeholder="60"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Validity (siku)
          </label>
          <input
            type="number"
            name="validity_days"
            value={formData.validity_days}
            onChange={handleChange}
            min="1"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Speed (Mbps)
          </label>
          <input
            type="number"
            name="speed_limit_mbps"
            value={formData.speed_limit_mbps}
            onChange={handleChange}
            min="1"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Vifaa (device limit)
          </label>
          <input
            type="number"
            name="device_limit"
            value={formData.device_limit}
            onChange={handleChange}
            min="1"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
          />
        </div>
      </div>

      <div className="flex gap-3 pt-4 border-t border-gray-200">
        <button
          type="submit"
          disabled={loading}
          className="flex-1 bg-primary-600 hover:bg-primary-700 text-white font-medium py-2 rounded-lg transition disabled:opacity-50"
        >
          {loading ? "Inahifadhi..." : initialData ? "Sasisha" : "Unda"}
        </button>
      </div>
    </form>
  );
};

export default PackageForm;
