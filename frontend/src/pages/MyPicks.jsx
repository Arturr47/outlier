import { useState, useEffect } from 'react';
import { Bookmark, Trash2, Loader2, Calendar, ExternalLink } from 'lucide-react';
import api from '../lib/api';

export default function MyPicks() {
  const [picks, setPicks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPicks();
  }, []);

  const fetchPicks = async () => {
    try {
      const res = await api.get('/picks');
      setPicks(res.data.picks);
    } catch (err) {
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  };

  const deletePick = async (id) => {
    try {
      await api.delete(`/picks/${id}`);
      setPicks(picks.filter((p) => p.id !== id));
    } catch (err) {
      console.error('Error eliminando pick:', err);
    }
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-emerald-400 animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex-1 p-6 lg:p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2 flex items-center gap-3">
          <Bookmark className="w-8 h-8 text-emerald-400" /> Mis Picks
        </h1>
        <p className="text-slate-400">
          Tus apuestas guardadas ({picks.length} picks)
        </p>
      </div>

      {picks.length === 0 ? (
        <div className="text-center py-20">
          <Bookmark className="w-12 h-12 text-slate-600 mx-auto mb-4" />
          <p className="text-slate-400 text-lg mb-2">No tienes picks guardados</p>
          <p className="text-slate-500 text-sm">
            Ve a un partido y agrega picks desde los momios o props
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {picks.map((pick) => {
            const matchDate = new Date(pick.match_date);
            return (
              <div
                key={pick.id}
                className="bg-[#111827] border border-[#1e293b] rounded-xl p-5 flex items-center justify-between hover:border-[#334155] transition"
              >
                <div className="flex items-center gap-4">
                  <div className="text-center min-w-[60px]">
                    <p className="text-xs text-emerald-400 font-medium">{pick.league_name}</p>
                    <p className="text-xs text-slate-500 mt-1">
                      {matchDate.toLocaleDateString('es-MX', { day: 'numeric', month: 'short' })}
                    </p>
                  </div>

                  <div className="h-10 w-px bg-[#1e293b]" />

                  <div>
                    <p className="text-sm text-white font-medium">
                      {pick.home_team} vs {pick.away_team}
                    </p>
                    <div className="flex items-center gap-3 mt-1">
                      <span className="text-xs text-slate-400 capitalize">
                        {pick.pick_type.replace('_', ' ')}
                      </span>
                      <span className="text-xs text-emerald-400 font-medium">{pick.pick_value}</span>
                      {pick.odds && (
                        <span className="text-xs text-white font-mono">
                          {pick.odds > 0 ? '+' : ''}{pick.odds}
                        </span>
                      )}
                      {pick.sportsbook && (
                        <span className="text-xs text-slate-500">{pick.sportsbook}</span>
                      )}
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => deletePick(pick.id)}
                  className="text-slate-500 hover:text-red-400 transition p-2"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
