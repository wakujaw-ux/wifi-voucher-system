import { useState, useEffect } from "react";
import { Wifi, Phone, CheckCircle, Smartphone } from "lucide-react";
import toast from "react-hot-toast";
import client from "../api/client";

const PublicPortal = () => {
  const [packages, setPackages] = useState([]);
  const [selectedPkg, setSelectedPkg] = useState(null);
  const [phone, setPhone] = useState("");
  const [method, setMethod] = useState("MPESA");
  const [loading, setLoading] = useState(false);
  const [voucherResult, setVoucherResult] = useState(null);

  const SITE_ID = "11111111-1111-1111-1111-111111111111";

  // Pata packages mteja anapofungua ukurasa
  useEffect(() => {
    const fetchPackages = async () => {
      try {
        const res = await client.get("/payments/packages");
        setPackages(res.data.data.packages);
        if (res.data.data.packages.length > 0) {
          setSelectedPkg(res.data.data.packages[0]);
        }
      } catch (err) {
        toast.error("Imeshindwa kupata packages");
      }
    };
    fetchPackages();
  }, []);

  const handlePayment = async (e) => {
    e.preventDefault();
    if (!selectedPkg) return toast.error("Chagua kifurushi kwanza");
    if (!phone || phone.length < 10)
      return toast.error("Weka namba sahihi ya simu");

    setLoading(true);
    try {
      const res = await client.post("/payments/mock-pay", {
        phone,
        package_id: selectedPkg.id,
        site_id: SITE_ID,
        method,
      });
      setVoucherResult(res.data.data);
      toast.success("Malipo yamekamilika!");
    } catch (err) {
      toast.error(err.response?.data?.message || "Malipo yameshindwa");
    } finally {
      setLoading(false);
    }
  };

  // Kama amefanikiwa kulipa, onyesha vocha yake
  if (voucherResult) {
    const MIKROTIK_IP = "192.168.56.10";
    const autoLoginUrl = `http://${MIKROTIK_IP}/login?username=${voucherResult.voucher_code}&password=${voucherResult.voucher_code}`;

    return (
      <div className="min-h-screen bg-primary-600 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-10 h-10 text-green-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-800 mb-2">
            Malipo Yamekamilika!
          </h1>
          <p className="text-gray-600 mb-6">
            Asante kwa kununua intaneti yetu. Hii ni vocha yako:
          </p>

          <div className="bg-gray-50 border-2 border-dashed border-gray-300 rounded-xl p-6 mb-6">
            <p className="text-sm text-gray-500 mb-1">VOUCHER CODE</p>
            <p className="text-3xl font-bold font-mono text-primary-600 tracking-wider">
              {voucherResult.voucher_code}
            </p>
            <p className="text-sm text-gray-500 mt-4">
              Kifurushi: {voucherResult.package_name}
            </p>
          </div>

          {/* HAPA NDO TUNAHITAJI KUTUMIA ILE VARIABLE */}
          <a
            href={autoLoginUrl}
            className="w-full flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white font-bold py-4 rounded-xl transition mb-4 text-lg shadow-lg"
          >
            <Wifi className="w-6 h-6" />
            Unganisha Sasa (Connect)
          </a>

          <div className="text-xs text-gray-400">
            Bonyeza kitufe hapo juu ili kuanza kutumia intaneti mara moja.
          </div>
        </div>
      </div>
    );
  }

  // Fomu ya Malipo
  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl max-w-md w-full overflow-hidden">
        <div className="bg-primary-600 p-6 text-center text-white">
          <Wifi className="w-12 h-12 mx-auto mb-2" />
          <h1 className="text-2xl font-bold">Nunua Wi-Fi</h1>
          <p className="text-primary-100 text-sm">
            Chagua kifurushi na ulipe kwa simu
          </p>
        </div>

        <form onSubmit={handlePayment} className="p-6 space-y-6">
          {/* Kuchagua Kifurushi */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Chagua Kifurushi
            </label>
            <div className="grid grid-cols-2 gap-2">
              {packages.map((pkg) => (
                <div
                  key={pkg.id}
                  onClick={() => setSelectedPkg(pkg)}
                  className={`cursor-pointer border-2 rounded-xl p-3 text-center transition ${
                    selectedPkg?.id === pkg.id
                      ? "border-primary-600 bg-primary-50"
                      : "border-gray-200 hover:border-primary-300"
                  }`}
                >
                  <p className="font-bold text-gray-800">{pkg.name}</p>
                  <p className="text-sm text-primary-600 font-medium">
                    TZS {parseFloat(pkg.price).toLocaleString()}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Namba ya Simu */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Namba yako ya Simu
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Phone className="w-5 h-5 text-gray-400" />
              </div>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="0712 345 678"
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 outline-none"
              />
            </div>
          </div>

          {/* Mtandao */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Mtandao
            </label>
            <div className="flex gap-2">
              {["MPESA", "TIGO_PESA", "AIRTEL_MONEY", "HALOPESA"].map((net) => (
                <button
                  key={net}
                  type="button"
                  onClick={() => setMethod(net)}
                  className={`flex-1 py-2 text-xs font-medium rounded-lg border transition ${
                    method === net
                      ? "bg-primary-600 text-white border-primary-600"
                      : "bg-white text-gray-600 border-gray-300 hover:bg-gray-50"
                  }`}
                >
                  {net.replace("_", " ")}
                </button>
              ))}
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-primary-600 hover:bg-primary-700 text-white font-bold py-3 rounded-xl transition disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading ? (
              <>Inasindika Malipo...</>
            ) : (
              <>
                <Smartphone className="w-5 h-5" /> Lipa TZS{" "}
                {selectedPkg
                  ? parseFloat(selectedPkg.price).toLocaleString()
                  : 0}
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

export default PublicPortal;
