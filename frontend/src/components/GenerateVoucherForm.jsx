import { useState, useEffect } from "react";
import { packageApi } from "../api/package.api";
import toast from "react-hot-toast";

const GenerateVoucherForm = ({ onSubmit, loading }) => {
  const [packages, setPackages] = useState([]);
  const [formData, setFormData] = useState({
    package_id: "",
    quantity: 10,
    prefix: "",
    notes: "",
  });
  const [loadingPackages, setLoadingPackages] = useState(true);

  const SITE_ID = "11111111-1111-1111-1111-111111111111";

  useEffect(() => {
    const fetchPackages = async () => {
      try {
        const response = await packageApi.getAll({ is_active: true });
        setPackages(response.data.packages || []);
      } catch (err) {
        toast.error(err.response?.data?.message || "Imeshindwa kupata packages");
      } finally {
        setLoadingPackages(false);
      }
    };
    fetchPackages();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!formData.package_id) {
      toast.error("Chagua package");
      return;
    }

    const quantity = parseInt(formData.quantity, 10);
    if (!quantity || quantity < 1) {
      toast.error("Weka quantity sahihi (1+)");
      return;
    }

    if (quantity > 1000) {
      toast.error("Quantity haiwezi kuzidi 1000 kwa batch moja");
      return;
    }

    onSubmit({
      site_id: SITE_ID,
      package_id: formData.package_id,
      quantity,
      prefix: formData.prefix.trim() || null,
      notes: formData.notes.trim() || null,
    });
  };

  const selectedPackage = packages.find((p) => p.id === formData.package_id);
  const estimatedTotal = selectedPackage
    ? parseFloat(selectedPackage.price) * parseInt(formData.quantity, 10)
    : 0;

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Package *
        </label>
        {loadingPackages ? (
          <div className="text-gray-500 text-sm">Inapakia packages...</div>
        ) : (
          <select
            name="package_id"
            value={formData.package_id}
            onChange={handleChange}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none bg-white"
          >
            <option value="">-- Chagua Package --</option>
            {packages.map((pkg) => (
              <option key={pkg.id} value={pkg.id}>
                {pkg.name} - TZS {parseFloat(pkg.price).toLocaleString()} (
                {pkg.duration_minutes} min)
              </option>
            ))}
          </select>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Idadi (quantity) *
          </label>
          <input
            type="number"
            name="quantity"
            value={formData.quantity}
            onChange={handleChange}
            required
            min="1"
            max="1000"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Prefix (optional)
          </label>
          <input
            type="text"
            name="prefix"
            value={formData.prefix}
            onChange={handleChange}
            maxLength="10"
            placeholder="WIFI"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Maelezo (notes)
        </label>
        <textarea
          name="notes"
          value={formData.notes}
          onChange={handleChange}
          rows="2"
          placeholder="Mfano: Batch ya Oktoba"
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
        />
      </div>

      {/* Summary */}
      {selectedPackage && (
        <div className="bg-primary-50 border border-primary-100 rounded-lg p-4">
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Package:</span>
            <span className="font-medium">{selectedPackage.name}</span>
          </div>
          <div className="flex justify-between text-sm mt-1">
            <span className="text-gray-600">Idadi:</span>
            <span className="font-medium">{formData.quantity} vocha</span>
          </div>
          <div className="flex justify-between text-sm mt-1">
            <span className="text-gray-600">Bei kwa vocha:</span>
            <span className="font-medium">
              TZS {parseFloat(selectedPackage.price).toLocaleString()}
            </span>
          </div>
          <div className="flex justify-between text-base mt-2 pt-2 border-t border-primary-200">
            <span className="font-medium text-gray-800">Jumla ya thamani:</span>
            <span className="font-bold text-primary-600">
              TZS {estimatedTotal.toLocaleString()}
            </span>
          </div>
        </div>
      )}

      <div className="pt-4 border-t border-gray-200">
        <button
          type="submit"
          disabled={loading || !formData.package_id}
          className="w-full bg-primary-600 hover:bg-primary-700 text-white font-medium py-2 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? "Inazalisha..." : "Zalisha Vocha"}
        </button>
      </div>
    </form>
  );
};

export default GenerateVoucherForm;
