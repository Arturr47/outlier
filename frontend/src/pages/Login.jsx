import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LogIn, UserPlus, TrendingUp, BarChart3, Target, Zap } from 'lucide-react';

export default function Login() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login, register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isLogin) {
        await login(email, password);
      } else {
        await register(email, password, name);
      }
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.error || 'Error de conexion');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0d1117] flex">
      {/* Panel izquierdo - Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-[#0a0e17] via-[#111827] to-[#1a2332] flex-col justify-center px-16">
        <div className="mb-12">
          <h1 className="text-5xl font-bold text-white mb-4">
            Outlier<span className="text-emerald-400"> MX</span>
          </h1>
          <p className="text-xl text-slate-400">
            La plataforma #1 de analisis deportivo en Mexico
          </p>
        </div>

        <div className="space-y-6">
          <Feature icon={<BarChart3 className="w-6 h-6 text-emerald-400" />} title="Momios en Tiempo Real" desc="Caliente, Bet365, Betcris - compara las mejores lineas" />
          <Feature icon={<Target className="w-6 h-6 text-blue-400" />} title="Liga MX, NBA, MLB, NHL" desc="Cobertura completa de las ligas que mas se juegan" />
          <Feature icon={<TrendingUp className="w-6 h-6 text-purple-400" />} title="Props y Analisis" desc="Stats de jugadores, H2H, lesionados y tendencias" />
          <Feature icon={<Zap className="w-6 h-6 text-yellow-400" />} title="5 Dias Gratis" desc="Prueba todo sin compromiso - despues $150 MXN/mes" />
        </div>
      </div>

      {/* Panel derecho - Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          {/* Logo mobile */}
          <div className="lg:hidden text-center mb-10">
            <h1 className="text-4xl font-bold text-white">
              Outlier<span className="text-emerald-400"> MX</span>
            </h1>
            <p className="text-slate-400 mt-2">Analisis deportivo para Mexico</p>
          </div>

          <div className="bg-[#111827] rounded-2xl p-8 border border-[#1e293b]">
            <h2 className="text-2xl font-bold text-white mb-2">
              {isLogin ? 'Iniciar Sesion' : 'Crear Cuenta'}
            </h2>
            <p className="text-slate-400 mb-6">
              {isLogin
                ? 'Accede a tu dashboard de analisis'
                : '5 dias gratis - sin tarjeta de credito'}
            </p>

            {error && (
              <div className="bg-red-500/10 border border-red-500/30 text-red-400 px-4 py-3 rounded-lg mb-4 text-sm">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {!isLogin && (
                <div>
                  <label className="block text-sm text-slate-400 mb-1.5">Nombre</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full bg-[#0d1117] border border-[#1e293b] rounded-lg px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition"
                    placeholder="Tu nombre"
                  />
                </div>
              )}

              <div>
                <label className="block text-sm text-slate-400 mb-1.5">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full bg-[#0d1117] border border-[#1e293b] rounded-lg px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition"
                  placeholder="tu@email.com"
                />
              </div>

              <div>
                <label className="block text-sm text-slate-400 mb-1.5">Contrasena</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                  className="w-full bg-[#0d1117] border border-[#1e293b] rounded-lg px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition"
                  placeholder="Minimo 6 caracteres"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-emerald-500 hover:bg-emerald-600 disabled:bg-emerald-800 text-white font-semibold py-3 rounded-lg transition flex items-center justify-center gap-2"
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : isLogin ? (
                  <>
                    <LogIn className="w-5 h-5" /> Entrar
                  </>
                ) : (
                  <>
                    <UserPlus className="w-5 h-5" /> Crear Cuenta Gratis
                  </>
                )}
              </button>
            </form>

            <div className="mt-6 text-center">
              <button
                onClick={() => {
                  setIsLogin(!isLogin);
                  setError('');
                }}
                className="text-emerald-400 hover:text-emerald-300 text-sm transition"
              >
                {isLogin ? 'No tienes cuenta? Registrate gratis' : 'Ya tienes cuenta? Inicia sesion'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Feature({ icon, title, desc }) {
  return (
    <div className="flex items-start gap-4">
      <div className="p-2 bg-[#1a2332] rounded-lg">{icon}</div>
      <div>
        <h3 className="text-white font-semibold">{title}</h3>
        <p className="text-slate-400 text-sm">{desc}</p>
      </div>
    </div>
  );
}
