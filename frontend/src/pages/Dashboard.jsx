import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";

const Dashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    toast.success("Umetoka kwa mafanikio");
    navigate("/login");
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow p-6">
          <h1 className="text-2xl font-bold text-gray-800">
            Karibu, {user?.full_name || user?.username}!
          </h1>
          <p className="text-gray-500 mt-1">
            Role: <span className="font-medium">{user?.role}</span>
          </p>

          <button
            onClick={handleLogout}
            className="mt-6 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition"
          >
            Toka (Logout)
          </button>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
