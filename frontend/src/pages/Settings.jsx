import { useState, useEffect, useCallback } from "react";
import {
  Save,
  RefreshCw,
  Settings as SettingsIcon,
  Building2,
  Phone,
  DollarSign,
  Tag,
  Hash,
  Clock,
  Shield,
} from "lucide-react";
import toast from "react-hot-toast";
import { settingsApi } from "../api/settings.api";
import { useAuth } from "../context/AuthContext";

// Config ya kila setting
const SETTING_CONFIG = {
  business_name: {
    label: "Jina la Biashara",
    icon: Building2,
    placeholder: "Wifi Business",
    description: "Linaonekana kwenye captive portal na voucher",
  },
  support_phone: {
    label: "Simu ya Msaada",
    icon: Phone,
    placeholder: "0712345678",
    description: "Namba ya msaada kwa wateja",
  },
  currency: {
    label: "Sarafu",
    icon: DollarSign,
    placeholder: "TZS",
    description: "Sarafu inayotumika (TZS, USD, n.k.)",
  },
  voucher_prefix: {
    label: "Prefix ya Voucher",
    icon: Tag,
    placeholder: "WIFI",
    description: "Herufi za mwanzo za voucher codes",
  },
  voucher_code_length: {
    label: "Urefu wa Voucher Code",
    icon: Hash,
    placeholder: "6",
    description: "Idadi ya herufi kwenye voucher code",
    type: "number",
  },
  session_check_interval: {
    label: "Muda wa Kuangalia Sessions",
    icon: Clock,
    placeholder: "60",
    description: "Sekunde kati ya kila sync na MikroTik",
    type: "number",
  },
};

const Settings = () => {
  const { user } = useAuth();
  const [settings, setSettings] = useState({});
  const [originalSettings, setOriginalSettings] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const canEdit = user?.role === "SUPER_ADMIN";

  const fetchSettings = useCallback(async () => {
    setLoading(true);
    try {
      const response = await settingsApi.getAll();
      const asObject = response.data.as_object || {};
      setSettings(asObject);
      setOriginalSettings(asObject);
    } catch (err) {
      toast.error(err.response?.data?.message || "Imeshindwa kupata settings");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  const handleChange = (key, value) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  };

  const handleSave = async () => {
    // Pata settings zilizobadilika tu
    const changes = {};
    for (const [key, value] of Object.entries(settings)) {
      if (value !== originalSettings[key]) {
        changes[key] = value;
      }
    }

    if (Object.keys(changes).length === 0) {
      toast("Hakuna mabadiliko ya kuhifadhi", { icon: "ℹ️" });
      return;
    }

    setSaving(true);
    try {
      await settingsApi.updateBulk(changes);
      toast.success(`Settings ${Object.keys(changes).length} zimehifadhiwa`);
      setOriginalSettings(settings);
    } catch (err) {
      toast.error(err.response?.data?.message || "Imeshindwa kuhifadhi");
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    setSettings(originalSettings);
    toast("Mabadiliko yamefutwa", { icon: "↩️" });
  };

  const hasChanges = Object.keys(settings).some(
    (key) => settings[key] !== originalSettings[key],
  );

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Mipangilio</h1>
          <p className="text-gray-500 mt-1">Mipangilio ya mfumo</p>
        </div>

        <div className="flex gap-2">
          <button
            onClick={fetchSettings}
            disabled={loading}
            className="inline-flex items-center gap-2 bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 font-medium px-4 py-2 rounded-lg transition disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </button>

          {canEdit && hasChanges && (
            <>
              <button
                onClick={handleReset}
                disabled={saving}
                className="inline-flex items-center gap-2 bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 font-medium px-4 py-2 rounded-lg transition disabled:opacity-50"
              >
                Ghairi
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="inline-flex items-center gap-2 bg-primary-600 hover:bg-primary-700 text-white font-medium px-4 py-2 rounded-lg transition disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                {saving ? "Inahifadhi..." : "Hifadhi"}
              </button>
            </>
          )}
        </div>
      </div>

      {/* Notice */}
      {!canEdit && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6 flex items-start gap-2">
          <Shield className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-yellow-800">
              Unaweza kuona tu
            </p>
            <p className="text-xs text-yellow-700 mt-1">
              Kubadilisha settings kunahitaji ruhusa ya SUPER_ADMIN.
            </p>
          </div>
        </div>
      )}

      {/* Settings Form */}
      {loading ? (
        <div className="p-8 text-center text-gray-500">Inapakia...</div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-gray-100">
            <div className="flex items-center gap-2">
              <SettingsIcon className="w-5 h-5 text-gray-600" />
              <h2 className="font-medium text-gray-800">
                Mipangilio ya Msingi
              </h2>
            </div>
          </div>

          <div className="divide-y divide-gray-100">
            {Object.entries(SETTING_CONFIG).map(([key, config]) => {
              const Icon = config.icon;
              const value = settings[key] || "";
              const changed = value !== originalSettings[key];

              return (
                <div key={key} className="p-6">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="md:col-span-1">
                      <div className="flex items-start gap-3">
                        <div className="bg-gray-100 p-2 rounded-lg">
                          <Icon className="w-5 h-5 text-gray-600" />
                        </div>
                        <div>
                          <label className="text-sm font-medium text-gray-800">
                            {config.label}
                            {changed && (
                              <span className="ml-2 text-xs text-orange-600 font-normal">
                                (imebadilika)
                              </span>
                            )}
                          </label>
                          <p className="text-xs text-gray-500 mt-1">
                            {config.description}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="md:col-span-2">
                      <input
                        type={config.type || "text"}
                        value={value}
                        onChange={(e) => handleChange(key, e.target.value)}
                        placeholder={config.placeholder}
                        disabled={!canEdit}
                        className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none ${
                          changed
                            ? "border-orange-300 bg-orange-50"
                            : "border-gray-300"
                        } ${!canEdit ? "bg-gray-50 cursor-not-allowed" : ""}`}
                      />
                      <p className="text-xs text-gray-400 mt-1 font-mono">
                        key: {key}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {canEdit && hasChanges && (
            <div className="p-4 bg-orange-50 border-t border-orange-200">
              <p className="text-sm text-orange-800">
                Kuna mabadiliko ambayo hayajahifadhiwa. Bonyeza{" "}
                <strong>Hifadhi</strong> kuhifadhi.
              </p>
            </div>
          )}
        </div>
      )}

      {/* Info */}
      <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
        <p className="text-sm text-blue-800">
          <strong>Kidokezo:</strong> Settings hizi zinaathiri mfumo mzima.
          Badilisha kwa uangalifu. Settings za MikroTik zinawekwa kwenye{" "}
          <code className="bg-blue-100 px-1 rounded">.env</code> file, si hapa.
        </p>
      </div>
    </div>
  );
};

export default Settings;
