import { useState, useEffect, useMemo } from 'react';
import { useOutletContext } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import MatchCard from '../components/MatchCard';
import api from '../lib/api';

function buildDates() {
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() + i);
    return {
      iso: i === 0 ? '' : d.toISOString().split('T')[0],
      label: i === 0 ? 'Today' : d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      weekday: d.toLocaleDateString('en-US', { weekday: 'short' }),
    };
  });
}

export default function Dashboard() {
  const ctx = useOutletContext() || {};
  const activeLeague = ctx.activeLeague || 'mlb';

  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [date, setDate]       = useState('');

  const dates = useMemo(buildDates, []);

  useEffect(() => { load(); }, [activeLeague, date]);

  async function load() {
    setLoading(true);
    try {
      const params = { league: activeLeague };
      if (date) params.date = date;
      const res = await api.get('/matches', { params });
      setMatches(res.data.matches || []);
    } catch {
      setMatches([]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ padding: '88px 28px 60px', background: '#0d0d0d', minHeight: '100vh' }}>

      {/* Title */}
      <h1 style={{
        fontSize: '32px', fontWeight: 700, color: '#fff',
        letterSpacing: '-0.03em', marginBottom: '20px', lineHeight: 1,
      }}>
        Games
      </h1>

      {/* Date tabs */}
      <div style={{
        display: 'flex', gap: 0, marginBottom: '28px',
        borderBottom: '1px solid rgba(255,255,255,0.07)',
      }}>
        {dates.map(d => {
          const active = date === d.iso;
          return (
            <button
              key={d.iso}
              onClick={() => setDate(d.iso)}
              style={{
                display: 'flex', flexDirection: 'column', alignItems: 'center',
                padding: '8px 20px', background: 'none', border: 'none',
                borderBottom: active ? '2px solid #4ade80' : '2px solid transparent',
                marginBottom: '-1px', cursor: 'pointer',
                color: active ? '#fff' : 'rgba(255,255,255,0.3)',
                transition: 'all 120ms',
              }}
              onMouseEnter={e => { if (!active) e.currentTarget.style.color = 'rgba(255,255,255,0.6)'; }}
              onMouseLeave={e => { if (!active) e.currentTarget.style.color = 'rgba(255,255,255,0.3)'; }}
            >
              <span style={{ fontSize: '13px', fontWeight: active ? 600 : 500 }}>{d.label}</span>
              <span style={{ fontSize: '10px', color: 'rgba(255,255,255,0.25)', marginTop: '2px' }}>{d.weekday}</span>
            </button>
          );
        })}
      </div>

      {/* Match list */}
      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', paddingTop: '80px' }}>
          <Loader2 size={18} style={{ color: 'rgba(255,255,255,0.2)', animation: 'spin 1s linear infinite' }} />
        </div>
      ) : matches.length === 0 ? (
        <div style={{ textAlign: 'center', paddingTop: '80px', color: 'rgba(255,255,255,0.25)', fontSize: '14px' }}>
          No games scheduled
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {matches.map(m => <MatchCard key={m.id} match={m} />)}
        </div>
      )}
    </div>
  );
}
