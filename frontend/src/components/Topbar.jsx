import { Menu } from "lucide-react";
import { useAuth } from "../context/AuthContext";

const Topbar = ({ onToggleSidebar }) => {
  const { user } = useAuth();

  return (
    <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6">
      <div className="flex items-center gap-4">
        <button
          onClick={onToggleSidebar}
          className="lg:hidden text-gray-600 hover:text-gray-900"
        >
          <Menu className="w-6 h-6" />
        </button>
        <h1 className="text-lg font-semibold text-gray-800">
          Wifi Voucher System
        </h1>
      </div>

      <div className="flex items-center gap-4">
        <div className="text-right hidden sm:block">
          <p className="text-sm font-medium text-gray-800">
            {user?.full_name || user?.username}
          </p>
          <p className="text-xs text-gray-500">{user?.role}</p>
        </div>
        <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center">
          <span className="text-primary-600 font-bold">
            {user?.username?.[0]?.toUpperCase()}
          </span>
        </div>
      </div>
    </header>
  );
};

export default Topbar;
