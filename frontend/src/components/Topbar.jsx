import { Menu } from "lucide-react";
import { useAuth } from "../context/AuthContext";

const Topbar = ({ onToggleSidebar }) => {
  const { user } = useAuth();

  return (
       <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6 shadow-sm z-10 relative">
      <div className="flex items-center gap-4">
        <button
          onClick={onToggleSidebar}
          className="lg:hidden p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition"
        >
          <Menu className="w-6 h-6" />
        </button>
        <h1 className="text-lg font-bold text-gray-800 tracking-tight">
          Wifi Voucher System
        </h1>
      </div>

      <div className="flex items-center gap-4">
        <div className="text-right hidden sm:block">
          <p className="text-sm font-semibold text-gray-800">
            {user?.full_name || user?.username}
          </p>
          <p className="text-xs text-primary-600 font-medium bg-primary-50 px-2 py-0.5 rounded-full inline-block mt-0.5">
            {user?.role}
          </p>
        </div>
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center shadow-md">
          <span className="text-white font-bold text-lg">
            {user?.username?.[0]?.toUpperCase()}
          </span>
        </div>
      </div>
    </header>
  );
};

export default Topbar;
