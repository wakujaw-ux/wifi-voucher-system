import { NavLink, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  Ticket,
  Package,
  ShoppingCart,
  Users,
  UsersRound,
  BarChart3,
  Wallet,
  Settings as SettingsIcon,
  LogOut,
  Wifi,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import toast from "react-hot-toast";

const menuItems = [
  { path: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { path: "/vouchers", label: "Vouchers", icon: Ticket },
  { path: "/packages", label: "Packages", icon: Package },
  { path: "/sales", label: "Sales", icon: ShoppingCart },
  { path: "/sessions", label: "Sessions", icon: Users },
  { path: "/users", label: "Users", icon: UsersRound },
  { path: "/reports", label: "Reports", icon: BarChart3 },
  { path: "/expenses", label: "Expenses", icon: Wallet },
  { path: "/settings", label: "Settings", icon: SettingsIcon },
];

const Sidebar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    toast.success("Umetoka kwa mafanikio");
    navigate("/login");
  };

  return (
    <aside className="w-64 bg-white border-r border-gray-200 min-h-screen flex flex-col">
      {/* Logo */}
      <div className="h-16 flex items-center gap-2 px-6 border-b border-gray-200">
        <div className="bg-primary-100 p-2 rounded-lg">
          <Wifi className="w-5 h-5 text-primary-600" />
        </div>
        <span className="font-bold text-gray-800">Wifi Voucher</span>
      </div>
      {/* Menu */}
      <nav className="flex-1 py-4 overflow-y-auto overflow-x-hidden">
        {menuItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `flex items-center gap-3 px-6 py-3 text-sm font-medium transition-all duration-200 border-l-4 ${
                  isActive
                    ? "bg-primary-50 text-primary-700 border-primary-600 shadow-sm"
                    : "text-gray-600 border-transparent hover:bg-gray-50 hover:text-gray-900 hover:border-gray-300"
                }`
              }
            >
              <Icon className="w-5 h-5" />
              <span>{item.label}</span>
            </NavLink>
          );
        })}
      </nav>
      {/* User & Logout */}
      <div className="border-t border-gray-200 p-4">
        <div className="mb-3 px-2">
          <p className="text-sm font-medium text-gray-800 truncate">
            {user?.full_name || user?.username}
          </p>
          <p className="text-xs text-primary-600 font-medium bg-primary-50 px-2 py-0.5 rounded-full inline-block mt-0.5">
            {user?.role}
          </p>
        </div>
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 w-full px-2 py-2 text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg transition"
        >
          <LogOut className="w-5 h-5" />
          <span>Toka</span>
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
