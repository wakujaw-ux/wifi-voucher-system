import { useAuth } from "../context/AuthContext";
import { TrendingUp, Ticket, Users, Wallet } from "lucide-react";

const StatCard = ({ icon: Icon, label, value, color, bgColor }) => (
  <div className="bg-white rounded-xl p-6 border border-gray-100 shadow-sm hover:shadow-md transition">
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm text-gray-500">{label}</p>
        <p className="text-2xl font-bold text-gray-800 mt-1">{value}</p>
      </div>
      <div className={`${bgColor} p-3 rounded-lg`}>
        <Icon className={`w-6 h-6 ${color}`} />
      </div>
    </div>
  </div>
);

const Dashboard = () => {
  const { user } = useAuth();

  // Tutajaza data halisi baadaye
  const stats = {
    todaySales: "0",
    revenue: "TZS 0",
    activeUsers: 0,
    availableVouchers: 0,
  };

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">
          Karibu, {user?.full_name || user?.username}!
        </h1>
        <p className="text-gray-500 mt-1">Muhtasari wa biashara yako leo</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard
          icon={TrendingUp}
          label="Mauzo ya Leo"
          value={stats.todaySales}
          color="text-blue-600"
          bgColor="bg-blue-50"
        />
        <StatCard
          icon={Wallet}
          label="Mapato"
          value={stats.revenue}
          color="text-green-600"
          bgColor="bg-green-50"
        />
        <StatCard
          icon={Users}
          label="Wateja Online"
          value={stats.activeUsers}
          color="text-purple-600"
          bgColor="bg-purple-50"
        />
        <StatCard
          icon={Ticket}
          label="Vocha Zilizopo"
          value={stats.availableVouchers}
          color="text-orange-600"
          bgColor="bg-orange-50"
        />
      </div>

      {/* Placeholder */}
      <div className="bg-white rounded-xl p-8 border border-gray-100 shadow-sm text-center">
        <p className="text-gray-500">
          Data halisi itaonekana hapa baada ya kuunganisha na API.
        </p>
      </div>
    </div>
  );
};

export default Dashboard;
