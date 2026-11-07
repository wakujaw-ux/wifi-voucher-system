import { useState, useEffect } from "react";
import { Wifi, Phone, CheckCircle, Smartphone, Loader2 } from "lucide-react";
import toast from "react-hot-toast";
import client from "../api/client";

const PublicPortal = () => {
  const [packages, setPackages] = useState([]);
  const [selectedPkg, setSelectedPkg] = useState(null);
  const [phone, setPhone] = useState("");
  const [method, setMethod] = useState("MPESA");
  const [loading, setLoading] = useState(false);
  const [voucherResult, setVoucherResult] = useState(null);
  const [siteId, setSiteId] = useState(null);
  const [initialLoading, setInitialLoading] = useState(true);

  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        const siteRes = await client.get("/settings/public/site");
        setSiteId(siteRes.data.data.site.id);

        const pkgRes = await client.get("/payments/packages");
        setPackages(pkgRes.data.data.packages);
        if (pkgRes.data.data.packages.length > 0) {
          setSelectedPkg(pkgRes.data.data.packages[0]);
        }
      } catch (err) {
        toast.error(
          "Imeshindwa kupata taarifa za mfumo. Hakikisha backend inafanya kazi.",
        );
      } finally {
        setInitialLoading(false);
      }
    };
    fetchInitialData();
  }, []);

  const handlePhoneChange = (e) => {
    let val = e.target.value.replace(/\D/g, "");
    if (val.startsWith("255")) val = "0" + val.substring(3);
    setPhone(val);

    if (/^(071|065|067)\d*/.test(val)) setMethod("TIGO_PESA");
    else if (/^(074|075|076)\d*/.test(val)) setMethod("MPESA");
    else if (/^(068|069|078|079)\d*/.test(val)) setMethod("AIRTEL_MONEY");
    else if (/^(061|062)\d*/.test(val)) setMethod("HALOPESA");
  };

  const handlePayment = async (e) => {
    e.preventDefault();
    if (!siteId)
      return toast.error("Mfumo haujapata Site ID, tafadhali refresh");
    if (!selectedPkg) return toast.error("Chagua kifurushi kwanza");

    let cleanPhone = phone.replace(/\D/g, "");
    if (cleanPhone.startsWith("255"))
      cleanPhone = "0" + cleanPhone.substring(3);
    if (!/^0\d{9}$/.test(cleanPhone))
      return toast.error("Namba ya simu si sahihi.");

    setLoading(true);
    try {
      const res = await client.post("/payments/mock-pay", {
        phone: cleanPhone,
        package_id: selectedPkg.id,
        site_id: siteId,
        method,
      });

      console.log("Majibu kutoka Backend:", res.data); // Kwa ajili ya kuangalia kwenye F12

      // Tunachukua data, kama haipo tunachukua res.data nzima
      const finalData = res.data.data || res.data;
      setVoucherResult(finalData);
      toast.success("Malipo yamekamilika!");
    } catch (err) {
      console.log("Kosa la Malipo:", err);
      toast.error(err.response?.data?.message || "Malipo yameshindwa");
    } finally {
      setLoading(false);
    }
  };

  // ==========================================
  // SKRINI YA MAFANIKIO (Baada ya kulipa)
  // ==========================================
  if (voucherResult) {
    const MIKROTIK_IP = import.meta.env.VITE_MIKROTIK_IP || "192.168.56.10";
    // Ulinzi: Kama voucher_code haipo, tunaandika "HAKUNA" ili kadi isicrash
    const code = voucherResult.voucher_code || "HAKUNA";
    const autoLoginUrl = `http://${MIKROTIK_IP}/login?username=${code}&password=${code}`;

    return (
      <div className="min-h-screen bg-primary-600 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl p-6 sm:p-8 max-w-md w-full text-center">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-10 h-10 text-green-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-800 mb-2">
            Malipo Yamekamilika!
          </h1>
          <p className="text-gray-600 mb-6 text-sm sm:text-base">
            Asante kwa kununua intaneti yetu. Hii ni vocha yako:
          </p>

          <div className="bg-gray-50 border-2 border-dashed border-gray-300 rounded-xl p-4 sm:p-6 mb-6">
            <p className="text-xs text-gray-500 mb-1 uppercase tracking-wider">
              Voucher Code
            </p>
            <p className="text-3xl sm:text-4xl font-bold font-mono text-primary-600 tracking-widest">
              {code}
            </p>
            <p className="text-sm text-gray-500 mt-3">
              Kifurushi: {voucherResult.package_name || "Wi-Fi"} | Speed:
              {voucherResult.speed_limit_mbps || "5"} Mbps
            </p>
          </div>

          <a
            href={autoLoginUrl}
            className="w-full flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white font-bold py-4 rounded-xl transition text-lg shadow-lg"
          >
            <Wifi className="w-6 h-6" />
            Unganisha Sasa (Connect)
          </a>
        </div>
      </div>
    );
  }

  if (initialLoading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3 text-primary-600">
          <Loader2 className="w-10 h-10 animate-spin" />
          <p className="font-medium">Inapakia mfumo...</p>
        </div>
      </div>
    );
  }

  // ==========================================
  // SKRINI YA MALIPO (Fomu)
  // ==========================================
  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-3 sm:p-6 lg:p-8">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md lg:max-w-lg overflow-hidden">
        <div className="bg-primary-600 p-6 sm:p-8 text-center text-white">
          <Wifi className="w-12 h-12 mx-auto mb-3" />
          <h1 className="text-2xl sm:text-3xl font-bold">Nunua Wi-Fi</h1>
          <p className="text-primary-100 text-sm mt-1">
            Chagua kifurushi na ulipe kwa simu
          </p>
        </div>

        <form onSubmit={handlePayment} className="p-5 sm:p-6 space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Chagua Kifurushi
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {packages.map((pkg) => (
                <div
                  key={pkg.id}
                  onClick={() => setSelectedPkg(pkg)}
                  className={`cursor-pointer border-2 rounded-xl p-3 text-center transition ${
                    selectedPkg?.id === pkg.id
                      ? "border-primary-600 bg-primary-50 shadow-md"
                      : "border-gray-200 hover:border-primary-300"
                  }`}
                >
                  <p className="font-bold text-gray-800">{pkg.name}</p>
                  <p className="text-sm text-primary-600 font-bold mt-1">
                    TZS {parseFloat(pkg.price).toLocaleString()}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    {pkg.speed_limit_mbps} Mbps
                  </p>
                </div>
              ))}
            </div>
          </div>

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
                onChange={handlePhoneChange}
                placeholder="Mfano: 0755123456"
                maxLength="10"
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 outline-none text-lg font-mono"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Mtandao
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {["MPESA", "TIGO_PESA", "AIRTEL_MONEY", "HALOPESA"].map((net) => (
                <button
                  key={net}
                  type="button"
                  onClick={() => setMethod(net)}
                  className={`py-2 text-xs font-medium rounded-xl border-2 transition ${
                    method === net
                      ? "bg-primary-600 text-white border-primary-600"
                      : "bg-white text-gray-600 border-gray-200"
                  }`}
                >
                  {net.replace("_", " ")}
                </button>
              ))}
            </div>
          </div>

          <button
            type="submit"
            disabled={loading || phone.length !== 10 || !siteId}
            className="w-full bg-primary-600 hover:bg-primary-700 text-white font-bold py-4 rounded-xl transition flex items-center justify-center gap-2 text-lg shadow-lg disabled:opacity-50"
          >
            {loading ? (
              <>
                <Loader2 className="w-6 h-6 animate-spin" /> Inasindika...
              </>
            ) : (
              <>
                <Smartphone className="w-6 h-6" /> Lipa TZS{" "}
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
