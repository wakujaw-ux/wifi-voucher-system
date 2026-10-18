import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { ArrowLeft, Printer, Settings, Eye } from "lucide-react";
import toast from "react-hot-toast";
import { voucherApi } from "../api/voucher.api";
import { settingsApi } from "../api/settings.api";
import VoucherPrintCard from "../components/VoucherPrintCard";

const LAYOUT_OPTIONS = [
  { value: 2, label: "Vocha 2 kwa safu (kubwa)", cols: "grid-cols-2" },
  { value: 3, label: "Vocha 3 kwa safu", cols: "grid-cols-3" },
  { value: 4, label: "Vocha 4 kwa safu", cols: "grid-cols-4" },
  { value: 5, label: "Vocha 5 kwa safu (ndogo)", cols: "grid-cols-5" },
];

const PrintVouchers = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [vouchers, setVouchers] = useState([]);
  const [settings, setSettings] = useState({});
  const [loading, setLoading] = useState(true);
  const [columns, setColumns] = useState(3);

  const batchId = searchParams.get("batch_id");
  const statusFilter = searchParams.get("status");

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const filters = { limit: 1000 };
        if (batchId) filters.batch_id = batchId;
        if (statusFilter) filters.status = statusFilter;

        const [vouchersRes, settingsRes] = await Promise.all([
          voucherApi.getAll(filters),
          settingsApi.getAll(),
        ]);

        // Chuja vocha ambazo zinaweza kuchapishwa (CREATED, AVAILABLE)
        const printable = (vouchersRes.data.vouchers || []).filter(
          (v) => v.status === "CREATED" || v.status === "AVAILABLE",
        );

        if (printable.length === 0) {
          toast.error("Hakuna vocha zinazoweza kuchapishwa");
        }

        setVouchers(printable);
        setSettings(settingsRes.data.as_object || {});
      } catch (err) {
        toast.error(err.response?.data?.message || "Imeshindwa kupata data");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [batchId, statusFilter]);

  const handlePrint = () => {
    window.print();
  };

  const layout = LAYOUT_OPTIONS.find((l) => l.value === columns);

  return (
    <div>
      {/* Print controls — haya hayachapishwi */}
      <div className="no-print mb-6">
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={() => navigate("/vouchers")}
            className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 font-medium"
          >
            <ArrowLeft className="w-4 h-4" />
            Rudi Vouchers
          </button>

          <button
            onClick={handlePrint}
            disabled={vouchers.length === 0}
            className="inline-flex items-center gap-2 bg-primary-600 hover:bg-primary-700 text-white font-medium px-6 py-2 rounded-lg transition disabled:opacity-50"
          >
            <Printer className="w-4 h-4" />
            Chapisha ({vouchers.length})
          </button>
        </div>

        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Settings className="w-4 h-4 text-gray-500" />
              <span className="text-sm font-medium text-gray-700">Layout:</span>
            </div>
            <select
              value={columns}
              onChange={(e) => setColumns(parseInt(e.target.value, 10))}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
            >
              {LAYOUT_OPTIONS.map((l) => (
                <option key={l.value} value={l.value}>
                  {l.label}
                </option>
              ))}
            </select>

            <div className="flex items-center gap-2 text-sm text-gray-500 ml-auto">
              <Eye className="w-4 h-4" />
              <span>Preview chini</span>
            </div>
          </div>
        </div>
      </div>

      {/* Print area — hii ndiyo inachapishwa */}
      {loading ? (
        <div className="p-8 text-center text-gray-500 no-print">
          Inapakia...
        </div>
      ) : vouchers.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-8 text-center no-print">
          <p className="text-gray-500">
            Hakuna vocha zinazoweza kuchapishwa. Vocha lazima ziwe na status
            CREATED au AVAILABLE.
          </p>
        </div>
      ) : (
        <div className="bg-white p-4 rounded-xl shadow-sm">
          <div className={`grid ${layout.cols} gap-2 print-container`}>
            {vouchers.map((voucher) => (
              <VoucherPrintCard
                key={voucher.id}
                voucher={voucher}
                businessName={settings.business_name}
                supportPhone={settings.support_phone}
              />
            ))}
          </div>
        </div>
      )}

      {/* Tips */}
      <div className="no-print mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
        <p className="text-sm text-blue-800">
          <strong>Kidokezo cha Kuchapisha:</strong>
        </p>
        <ul className="text-xs text-blue-700 mt-2 space-y-1 list-disc list-inside">
          <li>
            Bonyeza <strong>Chapisha</strong>, kisha chagua printer yako.
          </li>
          <li>
            Kwenye dialog ya print, chagua <strong>A4</strong>.
          </li>
          <li>
            Set margins kuwa <strong>Default</strong> au{" "}
            <strong>Minimum</strong>.
          </li>
          <li>
            Angalia <strong>Preview</strong> kabla ya kuchapisha.
          </li>
          <li>
            Kama hutaki background — chagua <strong>Save as PDF</strong> kwa
            file.
          </li>
        </ul>
      </div>
    </div>
  );
};

export default PrintVouchers;
