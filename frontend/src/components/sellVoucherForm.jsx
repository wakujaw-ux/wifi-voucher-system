import { useState, useEffect } from "react";
import toast from "react-hot-toast";
import { voucherApi } from "../api/voucher.api";

const SellVoucherForm = ({ onSubmit, loading }) => {
  const [code, setCode] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("CASH");
  const [phone, setPhone] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!code) return toast.error("Weka code ya vocha");

    try {
      // 1. Tafuta vocha kwanza kupata ID yake
      const res = await voucherApi.getByCode(code.toUpperCase());
      const voucher = res.data.voucher;

      if (voucher.status !== "AVAILABLE" && voucher.status !== "CREATED") {
        return toast.error(
          `Vocha hii haiwezi kuuzwa. Status: ${voucher.status}`,
        );
      }

      // 2. Tuma ombi la kuuza
      onSubmit({
        voucher_id: voucher.id,
        payment_method: paymentMethod,
        customer_phone: phone || null,
      });
    } catch (err) {
      toast.error(
        err.response?.data?.message || "Vocha haipo au imeshindwa kuuzwa",
      );
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Code ya Vocha *
        </label>
        <input
          type="text"
          value={code}
          onChange={(e) => setCode(e.target.value.toUpperCase())}
          placeholder="Mfano: A3K7FP"
          required
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 uppercase font-mono text-lg"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Njia ya Malipo
        </label>
        <select
          value={paymentMethod}
          onChange={(e) => setPaymentMethod(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 bg-white"
        >
          <option value="CASH">Cash (Taslimu)</option>
          <option value="MPESA">M-Pesa</option>
          <option value="TIGO_PESA">Tigo Pesa</option>
          <option value="AIRTEL_MONEY">Airtel Money</option>
          <option value="HALOPESA">HaloPesa</option>
        </select>
      </div>

      {paymentMethod !== "CASH" && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Namba ya Simu (Hiari)
          </label>
          <input
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="0755123456"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
          />
        </div>
      )}

      <div className="pt-4 border-t border-gray-200">
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 rounded-xl transition disabled:opacity-50 text-lg"
        >
          {loading ? "Inauza..." : "Kamilisha Mauzo"}
        </button>
      </div>
    </form>
  );
};

export default SellVoucherForm;
