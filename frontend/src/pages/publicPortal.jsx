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

  useEffect(() => {
    const fetchPackages = async () => {
      try {
        const res = await client.get("/payments/packages");
        setPackages(res.data.data.packages);
        if (res.data.data.packages.length > 0) {
          setSelectedPkg(res.data.data.packages[0]);
        }
      } catch (err) {
        toast.error(err.message || "Imeshindwa kupata packages");
      }
    };
    fetchPackages();
  }, []);

  // ==========================================
  // FUNCTION MPYA: Inatambua mtandao mteja anapoandika
  // ==========================================
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
    if (!selectedPkg) return toast.error("Chagua kifurushi kwanza");

    // 1. Safisha namba
    let cleanPhone = phone.replace(/\D/g, "");
    if (cleanPhone.startsWith("255")) {
      cleanPhone = "0" + cleanPhone.substring(3);
    }

    // 2. Kagua kama ina tarakimu 10
    if (!/^0\d{9}$/.test(cleanPhone)) {
      return toast.error(
        "Namba ya simu si sahihi. Lazima iwe na tarakimu 10 (Mfano: 0755123456)",
      );
    }

    // 3. Tambua mtandao halisi wa namba
    let actualNetwork = "";
    if (/^(071|065|067)\d{7}$/.test(cleanPhone)) {
      actualNetwork = "Tigo Pesa";
    } else if (/^(074|075|076)\d{7}$/.test(cleanPhone)) {
      actualNetwork = "Vodacom (M-Pesa)";
    } else if (/^(068|069|078|079)\d{7}$/.test(cleanPhone)) {
      actualNetwork = "Airtel Money";
    } else if (/^(061|062)\d{7}$/.test(cleanPhone)) {
      actualNetwork = "Halotel (HaloPesa)";
    } else if (/^(073)\d{7}$/.test(cleanPhone)) {
      actualNetwork = "TTCL";
    } else {
      actualNetwork = "Mtandao Mwingine";
    }

    // 4. Linganisha na mtandao uliochaguliwa
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

    // 5. Kama namba si ya mtandao uliochaguliwa
    if (!isValid) {
      if (actualNetwork === "Mtandao Mwingine") {
        return toast.error(
          `Namba ${cleanPhone} haitambuliki kwenye mitandao ya malipo.`,
        );
      } else {
        return toast.error(
          `Namba uliyoweka ni ya ${actualNetwork}. Tafadhali chagua ${actualNetwork} kwenye vitufe vya mtandao.`,
        );
      }
    }

    // 6. Tuma Malipo
    setLoading(true);
    try {
      const res = await client.post("/payments/mock-pay", {
        phone: cleanPhone,
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

  // ==========================================
  // UKURASA WA MAFANIKIO (Baada ya kulipa)
  // ==========================================
  if (voucherResult) {
    const MIKROTIK_IP = "192.168.56.10";
    const autoLoginUrl = `http://${MIKROTIK_IP}/login?username=${voucherResult.voucher_code}&password=${voucherResult.voucher_code}`;

    return (
      <div className="min-h-screen bg-primary-600 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-6 sm:p-8 max-w-md w-full text-center">
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
            <p className="text-xs text-gray-500 mb-1">VOUCHER CODE</p>
            <p className="text-3xl sm:text-4xl font-bold font-mono text-primary-600 tracking-wider">
              {voucherResult.voucher_code}
            </p>
            <p className="text-sm text-gray-500 mt-3">
              Kifurushi: {voucherResult.package_name}
            </p>
          </div>

          <a
            href={autoLoginUrl}
            className="w-full flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white font-bold py-4 rounded-xl transition mb-4 text-lg shadow-lg"
          >
            <Wifi className="w-6 h-6" />
            Unganisha Sasa (Connect)
          </a>
        </div>
      </div>
    );
  }

  // ==========================================
  // UKURASA WA MALIPO (Fomu)
  // ==========================================
  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-3 sm:p-4">
      <div className="bg-white rounded-2xl shadow-xl max-w-md w-full overflow-hidden">
        <div className="bg-primary-600 p-6 text-center text-white">
          <Wifi className="w-12 h-12 mx-auto mb-2" />
          <h1 className="text-2xl font-bold">Nunua Wi-Fi</h1>
          <p className="text-primary-100 text-sm mt-1">
            Chagua kifurushi na ulipe kwa simu
          </p>
        </div>

        <form onSubmit={handlePayment} className="p-5 sm:p-6 space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Chagua Kifurushi
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {packages.map((pkg) => (
                <div
                  key={pkg.id}
                  onClick={() => setSelectedPkg(pkg)}
                  className={`cursor-pointer border-2 rounded-xl p-3 text-center transition ${
                    selectedPkg?.id === pkg.id
                      ? "border-primary-600 bg-primary-50 shadow-sm"
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
            <p className="text-xs text-gray-500 mt-1">
              Weka namba yako, mfumo utatambua mtandao wako.
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Mtandao
            </label>
            <div className="grid grid-cols-2 gap-2">
              {["MPESA", "TIGO_PESA", "AIRTEL_MONEY", "HALOPESA"].map((net) => (
                <button
                  key={net}
                  type="button"
                  onClick={() => setMethod(net)}
                  className={`py-3 text-xs sm:text-sm font-medium rounded-xl border transition ${
                    method === net
                      ? "bg-primary-600 text-white border-primary-600 shadow-md"
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
            disabled={loading || phone.length !== 10}
            className="w-full bg-primary-600 hover:bg-primary-700 text-white font-bold py-4 rounded-xl transition disabled:opacity-50 flex items-center justify-center gap-2 text-lg shadow-lg"
          >
            {loading ? (
              <>Inasindika Malipo...</>
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
