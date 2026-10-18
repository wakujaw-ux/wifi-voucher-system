import { Wifi, Phone } from "lucide-react";

const VoucherPrintCard = ({ voucher, businessName, supportPhone }) => {
  return (
    <div className="voucher-card bg-white border-2 border-dashed border-gray-400 rounded-lg p-3 text-center break-inside-avoid">
      {/* Header */}
      <div className="flex items-center justify-center gap-1 mb-2">
        <Wifi className="w-4 h-4 text-primary-600" />
        <span className="text-xs font-bold text-primary-600 uppercase">
          {businessName || "WIFI"}
        </span>
      </div>

      {/* Divider */}
      <div className="border-t border-gray-300 mb-2" />

      {/* Code */}
      <div className="mb-2">
        <p className="text-[9px] text-gray-500 uppercase tracking-wider">
          Voucher Code
        </p>
        <p className="text-xl font-bold font-mono text-gray-900 tracking-wider mt-0.5">
          {voucher.code}
        </p>
      </div>

      {/* Details */}
      <div className="grid grid-cols-2 gap-1 text-[10px] border-t border-gray-300 pt-2">
        <div className="text-left">
          <p className="text-gray-500">Muda</p>
          <p className="font-semibold text-gray-800">
            {voucher.duration_minutes} min
          </p>
        </div>
        <div className="text-right">
          <p className="text-gray-500">Bei</p>
          <p className="font-semibold text-gray-800">
            TZS {parseFloat(voucher.price).toLocaleString()}
          </p>
        </div>
        <div className="text-left">
          <p className="text-gray-500">Speed</p>
          <p className="font-semibold text-gray-800">
            {voucher.speed_limit_mbps} Mbps
          </p>
        </div>
        <div className="text-right">
          <p className="text-gray-500">Valid</p>
          <p className="font-semibold text-gray-800">
            {voucher.validity_days} siku
          </p>
        </div>
      </div>

      {/* Footer */}
      <div className="border-t border-gray-300 mt-2 pt-2">
        <div className="flex items-center justify-center gap-1 text-[9px] text-gray-600">
          <Phone className="w-3 h-3" />
          <span>{supportPhone || "Msaada"}</span>
        </div>
        <p className="text-[8px] text-gray-400 mt-1">
          Ingia kwenye Wi-Fi na uweke code hii
        </p>
      </div>
    </div>
  );
};

export default VoucherPrintCard;
