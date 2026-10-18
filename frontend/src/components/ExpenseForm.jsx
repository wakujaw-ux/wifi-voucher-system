import { useState, useEffect } from "react";
import toast from "react-hot-toast";

const SITE_ID = "11111111-1111-1111-1111-111111111111";

const CATEGORIES = [
  { value: "INTERNET", label: "Internet" },
  { value: "ELECTRICITY", label: "Umeme" },
  { value: "MAINTENANCE", label: "Matengenezo" },
  { value: "TRANSPORT", label: "Usafiri" },
  { value: "EQUIPMENT", label: "Vifaa" },
  { value: "STAFF", label: "Wafanyakazi" },
  { value: "RENT", label: "Kodi" },
  { value: "OTHER", label: "Nyingine" },
];

const today = () => new Date().toISOString().split("T")[0];

const ExpenseForm = ({ initialData, onSubmit, loading }) => {
  const [formData, setFormData] = useState({
    category: "INTERNET",
    description: "",
    amount: "",
    expense_date: today(),
  });

  useEffect(() => {
    if (initialData) {
      setFormData({
        category: initialData.category || "INTERNET",
        description: initialData.description || "",
        amount: initialData.amount || "",
        expense_date: initialData.expense_date?.split("T")[0] || today(),
      });
    }
  }, [initialData]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!formData.category) {
      toast.error("Chagua category");
      return;
    }

    const amount = parseFloat(formData.amount);
    if (isNaN(amount) || amount <= 0) {
      toast.error("Weka kiasi sahihi zaidi ya 0");
      return;
    }

    if (!formData.expense_date) {
      toast.error("Chagua tarehe");
      return;
    }

    onSubmit({
      site_id: SITE_ID,
      category: formData.category,
      description: formData.description.trim() || null,
      amount,
      expense_date: formData.expense_date,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Category *
        </label>
        <select
          name="category"
          value={formData.category}
          onChange={handleChange}
          required
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none bg-white"
        >
          {CATEGORIES.map((c) => (
            <option key={c.value} value={c.value}>
              {c.label}
            </option>
          ))}
        </select>
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
          placeholder="Mfano: Umeme wa mwezi Oktoba"
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Kiasi (TZS) *
          </label>
          <input
            type="number"
            name="amount"
            value={formData.amount}
            onChange={handleChange}
            required
            min="1"
            step="1"
            placeholder="50000"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Tarehe *
          </label>
          <input
            type="date"
            name="expense_date"
            value={formData.expense_date}
            onChange={handleChange}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
          />
        </div>
      </div>

      <div className="pt-4 border-t border-gray-200">
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-primary-600 hover:bg-primary-700 text-white font-medium py-2 rounded-lg transition disabled:opacity-50"
        >
          {loading ? "Inahifadhi..." : initialData ? "Sasisha" : "Unda"}
        </button>
      </div>
    </form>
  );
};

export default ExpenseForm;
