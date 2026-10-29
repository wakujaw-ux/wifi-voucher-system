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

  // Hali ya kupata Site ID kutoka Backend
  const [siteId, setSiteId] = useState(null);
  const [initialLoading, setInitialLoading] = useState(true);

  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        // 1. Pata site_id kutoka backend (Bila hardcode)
        const siteRes = await client.get("/settings/public/site");
        setSiteId(siteRes.data.data.site.id);

        // 2. Pata packages
        const pkgRes = await client.get("/payments/packages");
        setPackages(pkgRes.data.data.packages);

        if (pkgRes.data.data.packages.length > 0) {
          setSelectedPkg(pkgRes.data.data.packages[0]);
        }
      } catch (err) {
        toast.error(
          err.message ||
            "Imeshindwa kupata taarifa za mfumo. Hakikisha backend inafanya kazi.",
        );
      } finally {
        setInitialLoading(false);
      }
    };
    fetchInitialData();
  }, []);

  // Kazi ya kutambua mtandao mteja anapoandika
  const handlePhoneChange = (e) => {
    let val = e.target.value.replace(/\D/g, ""); // Ondoa herufi na nafasi
    if (val.startsWith("255")) {
      val = "0" + val.substring(3); // Badilisha +255 kuwa 0
    }
    setPhone(val);

    // Tambua mtandao (Tigo kwanza kwa sababu 071 ni ya Tigo)
    if (/^(071|065|067)\d*/.test(val)) {
      setMethod("TIGO_PESA");
    } else if (/^(074|075|076)\d*/.test(val)) {
      setMethod("MPESA");
    } else if (/^(068|069|078|079)\d*/.test(val)) {
      setMethod("AIRTEL_MONEY");
    } else if (/^(061|062)\d*/.test(val)) {
      setMethod("HALOPESA");
    }
  };

  const handlePayment = async (e) => {
    e.preventDefault();
    if (!siteId)
      return toast.error("Mfumo haujapata Site ID, tafadhali refresh");
    if (!selectedPkg) return toast.error("Chagua kifurushi kwanza");

    let cleanPhone = phone.replace(/\D/g, "");
    if (cleanPhone.startsWith("255")) {
      cleanPhone = "0" + cleanPhone.substring(3);
    }

    if (!/^0\d{9}$/.test(cleanPhone)) {
      return toast.error(
        "Namba ya simu si sahihi. Lazima iwe na tarakimu 10 (Mfano: 0755123456)",
      );
    }

    // Uthibitisho wa mtandao
    let actualNetwork = "";
    if (/^(071|065|067)\d{7}$/.test(cleanPhone)) actualNetwork = "Tigo Pesa";
    else if (/^(074|075|076)\d{7}$/.test(cleanPhone))
      actualNetwork = "Vodacom (M-Pesa)";
    else if (/^(068|069|078|079)\d{7}$/.test(cleanPhone))
      actualNetwork = "Airtel Money";
    else if (/^(061|062)\d{7}$/.test(cleanPhone))
      actualNetwork = "Halotel (HaloPesa)";
    else actualNetwork = "Mtandao Mwingine";

    let isValid = false;
    let expectedNetwork = "";

    switch (method) {
      case "MPESA":
        expectedNetwork = "Vodacom (M-Pesa)";
        isValid = actualNetwork === expectedNetwork;
        break;
      case "TIGO_PESA":
        expectedNetwork = "Tigo Pesa";
        isValid = actualNetwork === expectedNetwork;
        break;
      case "AIRTEL_MONEY":
        expectedNetwork = "Airtel Money";
        isValid = actualNetwork === expectedNetwork;
        break;
      case "HALOPESA":
        expectedNetwork = "Halotel (HaloPesa)";
        isValid = actualNetwork === expectedNetwork;
        break;
      default:
        isValid = true;
    }

    if (!isValid) {
      if (actualNetwork === "Mtandao Mwingine") {
        return toast.error(
          `Namba ${cleanPhone} haitambuliki kwenye mitandao ya malipo.`,
        );
      } else {
        return toast.error(
          `Namba ni ya ${actualNetwork}. Tafadhali chagua ${actualNetwork} kwenye vitufe.`,
        );
      }
    }

    setLoading(true);
    try {
      const res = await client.post("/payments/mock-pay", {
        phone: cleanPhone,
        package_id: selectedPkg.id,
        site_id: siteId, // Inatumia siteId iliyopatikana kutoka backend
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

  // ==========================================
  // SKRINI YA MAFANIKIO (Baada ya kulipa)
  // ==========================================
  if (voucherResult) {
    const MIKROTIK_IP = "192.168.56.10";
    const autoLoginUrl = `http://${MIKROTIK_IP}/login?username=${voucherResult.voucher_code}&password=${voucherResult.voucher_code}`;

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
              {voucherResult.voucher_code}
            </p>
            <p className="text-sm text-gray-500 mt-3">
              Kifurushi: {voucherResult.package_name}
            </p>
          </div>

          <a
            href={autoLoginUrl}
            className="w-full flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white font-bold py-4 rounded-xl transition text-lg shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
          >
            <Wifi className="w-6 h-6" />
            Unganisha Sasa (Connect)
          </a>
        </div>
      </div>
    );
  }

  // ==========================================
  // SKRINI YA MALIPO (Fomu)
  // ==========================================
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

  return (
    // BACKGROUND: Inajipanga vizuri kwenye simu, tablet na desktop
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-3 sm:p-6 lg:p-8">
      {/* KADI KUU: Inakuwa kubwa kidogo kwenye tablet/desktop */}
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md lg:max-w-lg xl:max-w-xl overflow-hidden">
        {/* HEADER: Rangi ya bluu inayovutia */}
        <div className="bg-primary-600 p-6 sm:p-8 text-center text-white relative">
          <div className="absolute top-4 right-4 opacity-20">
            <Wifi className="w-16 h-16" />
          </div>
          <Wifi className="w-12 h-12 mx-auto mb-3" />
          <h1 className="text-2xl sm:text-3xl font-bold">Nunua Wi-Fi</h1>
          <p className="text-primary-100 text-sm sm:text-base mt-1">
            Chagua kifurushi na ulipe kwa simu
          </p>
        </div>

        <form
          onSubmit={handlePayment}
          className="p-5 sm:p-6 lg:p-8 space-y-6 sm:space-y-8"
        >
          {/* KIFURUSHI: Grid inayobadilika kutegemea screen */}
          <div>
            <label className="block text-sm sm:text-base font-medium text-gray-700 mb-3">
              Chagua Kifurushi
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
              {packages.map((pkg) => (
                <div
                  key={pkg.id}
                  onClick={() => setSelectedPkg(pkg)}
                  className={`cursor-pointer border-2 rounded-xl p-3 sm:p-4 text-center transition-all duration-200 ${
                    selectedPkg?.id === pkg.id
                      ? "border-primary-600 bg-primary-50 shadow-md transform scale-[1.02]"
                      : "border-gray-200 hover:border-primary-300 hover:shadow-sm"
                  }`}
                >
                  <p className="font-bold text-gray-800 text-sm sm:text-base">
                    {pkg.name}
                  </p>
                  <p className="text-sm sm:text-lg text-primary-600 font-bold mt-1">
                    TZS {parseFloat(pkg.price).toLocaleString()}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* NAMBA YA SIMU */}
          <div>
            <label className="block text-sm sm:text-base font-medium text-gray-700 mb-2">
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
                className="w-full pl-10 pr-4 py-3 sm:py-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none text-lg sm:text-xl font-mono tracking-wide transition-all"
              />
            </div>
            <p className="text-xs sm:text-sm text-gray-500 mt-2">
              Weka namba yako, mfumo utatambua mtandao wako kiOtomatiki.
            </p>
          </div>

          {/* MITANDAO: Grid ya 2x2 kwenye simu, 1x4 kwenye desktop */}
          <div>
            <label className="block text-sm sm:text-base font-medium text-gray-700 mb-2">
              Mtandao
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
              {["MPESA", "TIGO_PESA", "AIRTEL_MONEY", "HALOPESA"].map((net) => (
                <button
                  key={net}
                  type="button"
                  onClick={() => setMethod(net)}
                  className={`py-2 sm:py-3 text-xs sm:text-sm font-medium rounded-xl border-2 transition-all duration-200 ${
                    method === net
                      ? "bg-primary-600 text-white border-primary-600 shadow-md"
                      : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50 hover:border-gray-300"
                  }`}
                >
                  {net.replace("_", " ")}
                </button>
              ))}
            </div>
          </div>

          {/* KITUFE CHA MALIPO */}
          <button
            type="submit"
            disabled={loading || phone.length !== 10 || !siteId}
            // ONGEZA: pointer-events-none na opacity-75 wakati wa loading
            className={`w-full bg-primary-600 hover:bg-primary-700 text-white font-bold py-4 sm:py-5 rounded-xl transition-all duration-200 flex items-center justify-center gap-2 text-lg sm:text-xl shadow-lg ${
              loading || phone.length !== 10 || !siteId
                ? "opacity-50 cursor-not-allowed pointer-events-none"
                : "hover:shadow-xl transform hover:-translate-y-0.5"
            }`}
          >
            {loading ? (
              <>
                <Loader2 className="w-6 h-6 animate-spin" />
                Inasindika Malipo...
              </>
            ) : (
              <>
                <Smartphone className="w-6 h-6" />
                Lipa TZS{" "}
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
