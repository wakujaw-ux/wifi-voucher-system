import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import toast from "react-hot-toast";
import { Wifi, Lock, User, ArrowRight, ArrowLeft } from "lucide-react";

const Login = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, isAuthenticated } = useAuth();

  const [showForm, setShowForm] = useState(false); // Hali ya kuonyesha fomu au la
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const from = location.state?.from?.pathname || "/dashboard";

  useEffect(() => {
    if (isAuthenticated) {
      navigate(from, { replace: true });
    }
  }, [isAuthenticated, navigate, from]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!username || !password) return toast.error("Weka username na password");

    setLoading(true);
    try {
      await login(username, password);
      toast.success("Umeingia kwa mafanikio");
      navigate(from, { replace: true });
    } catch (err) {
      toast.error(
        err.response?.data?.message || "Imeshindwa kuingia. Jaribu tena.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 p-4 relative overflow-hidden">
      {/* Mapambo ya background (Miviringo inayong'aa) */}
      <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-blue-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
      <div className="absolute top-[20%] right-[-10%] w-96 h-96 bg-purple-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>
      <div className="absolute bottom-[-10%] left-[20%] w-96 h-96 bg-teal-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-4000"></div>

      {/* ============================================================ */}
      {/* UKURASA WA KWANZA: LANDING PAGE (Kabla ya kuonyesha fomu) */}
      {/* ============================================================ */}
      {!showForm ? (
        <div className="text-center relative z-10 animate-fade-in-up">
          <div className="bg-primary-600/20 p-8 rounded-full inline-block mb-8 backdrop-blur-md border border-primary-500/30 shadow-2xl">
            <Wifi className="w-24 h-24 text-primary-400" />
          </div>
          <h1 className="text-5xl font-extrabold text-white mb-4 tracking-tight drop-shadow-lg">
            WIFI <span className="text-primary-400">VOUCHER</span>
          </h1>
          <p className="text-blue-200 text-lg mb-10 max-w-md mx-auto">
            Mfumo wa kisasa wa kusimamia na kuuza vocha za mtandao.
          </p>
          <button
            onClick={() => setShowForm(true)}
            className="bg-primary-600 hover:bg-primary-500 text-white font-bold text-lg py-4 px-12 rounded-full shadow-[0_0_40px_rgba(59,130,246,0.5)] transition transform hover:-translate-y-1 hover:scale-105 flex items-center justify-center gap-3 mx-auto"
          >
            Ingia Kwenye Mfumo <ArrowRight className="w-6 h-6" />
          </button>
        </div>
      ) : (
        // ============================================================ */}
        // UKURASA WA PILI: FOMU YA LOGIN (Inatokea baada ya kubonyeza) */}
        // ============================================================ */}
        <div className="bg-white/10 backdrop-blur-xl border border-white/20 w-full max-w-md rounded-3xl shadow-2xl p-8 relative z-10 animate-fade-in-up">
          {/* Kitufe cha Kurudi Nyuma */}
          <button
            onClick={() => setShowForm(false)}
            className="absolute top-6 left-6 text-blue-300 hover:text-white transition flex items-center gap-1 text-sm font-medium"
          >
            <ArrowLeft className="w-4 h-4" /> Rudi
          </button>

          <div className="flex flex-col items-center mb-8 mt-4">
            <div className="bg-primary-600 p-4 rounded-2xl shadow-lg mb-4 transform -rotate-6">
              <Wifi className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-white tracking-wide">
              WIFI <span className="text-primary-400">VOUCHER</span>
            </h1>
            <p className="text-blue-200 text-sm mt-1">
              Ingia kwenye mfumo wa usimamizi
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-blue-100 mb-2">
                Username
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <User className="w-5 h-5 text-blue-300" />
                </div>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="admin"
                  disabled={loading}
                  className="w-full pl-10 pr-4 py-3 bg-white/5 border border-white/10 text-white placeholder-blue-300/50 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-blue-100 mb-2">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="w-5 h-5 text-blue-300" />
                </div>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  disabled={loading}
                  className="w-full pl-10 pr-4 py-3 bg-white/5 border border-white/10 text-white placeholder-blue-300/50 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 bg-primary-600 hover:bg-primary-500 text-white font-bold py-3.5 rounded-xl shadow-lg transition transform hover:-translate-y-0.5 disabled:opacity-50 mt-4"
            >
              {loading ? "Inaingia..." : "Ingia Kwenye Mfumo"}
            </button>
          </form>
        </div>
      )}
    </div>
  );
};

export default Login;
