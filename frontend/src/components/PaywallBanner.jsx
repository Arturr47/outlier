import { useState } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import { Crown, Zap } from 'lucide-react';
import api from '../lib/api';

export default function PaywallBanner() {
  const [loading, setLoading] = useState(false);

  const handleSubscribe = async () => {
    setLoading(true);
    try {
      const res = await api.post('/checkout/create-checkout-session');
      if (res.data.url) {
        window.location.href = res.data.url;
      }
    } catch (err) {
      console.error('Error checkout:', err);
      alert('Error al iniciar el pago. Intenta de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-gradient-to-r from-emerald-500/10 to-blue-500/10 border border-emerald-500/20 rounded-xl p-6 mb-6">
      <div className="flex items-start gap-4">
        <div className="p-3 bg-emerald-500/20 rounded-xl">
          <Crown className="w-8 h-8 text-emerald-400" />
        </div>
        <div className="flex-1">
          <h3 className="text-lg font-bold text-white mb-1">Tu prueba gratuita ha expirado</h3>
          <p className="text-slate-400 text-sm mb-4">
            Suscribete para seguir accediendo a momios, props, H2H y analisis completo de Liga MX, NBA, MLB y NHL.
          </p>
          <button
            onClick={handleSubscribe}
            disabled={loading}
            className="bg-emerald-500 hover:bg-emerald-600 disabled:bg-emerald-800 text-white font-semibold px-6 py-2.5 rounded-lg transition flex items-center gap-2"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                <Zap className="w-5 h-5" /> Suscribirme - $150 MXN/mes
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
