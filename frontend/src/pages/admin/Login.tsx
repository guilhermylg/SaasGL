import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Train, Lock, Mail, Loader2 } from "lucide-react";
import api from "../../services/api";

const Login = () => {
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const response = await api.post("/auth/login", { email, senha });
      localStorage.setItem("trem_admin_token", response.data.token);
      navigate("/admin");
    } catch (err: any) {
      setError(err.response?.data?.error || "Erro ao fazer login");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center text-accent">
          <Train size={48} strokeWidth={1.5} />
        </div>
        <h2 className="mt-6 text-center text-3xl font-bold tracking-tight text-navy">
          Acesso Restrito
        </h2>
        <p className="mt-2 text-center text-sm text-slate-600">
          Gerenciamento Trem das Onze
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10 border border-slate-100">
          <form className="space-y-6" onSubmit={handleLogin}>
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-slate-700"
              >
                E-mail
              </label>
              <div className="mt-1 relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Mail size={18} />
                </div>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="input pl-10 block w-full sm:text-sm rounded-md"
                  placeholder="admin@tremdasonze.com"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-slate-700"
              >
                Senha
              </label>
              <div className="mt-1 relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Lock size={18} />
                </div>
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  value={senha}
                  onChange={(e) => setSenha(e.target.value)}
                  className="input pl-10 block w-full sm:text-sm rounded-md"
                  placeholder="••••••••"
                />
              </div>
            </div>

            {error && (
              <div className="text-red-500 text-sm text-center font-medium bg-red-50 p-2 rounded-md">
                {error}
              </div>
            )}

            <div>
              <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center py-2.5 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-navy hover:bg-opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-navy transition-all duration-200 disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <Loader2 size={18} className="animate-spin" /> Entrando...
                  </span>
                ) : (
                  "Entrar no Dashboard"
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Login;
