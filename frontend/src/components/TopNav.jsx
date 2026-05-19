import { useState } from 'react';

const LEAGUES = [
  { slug: 'mlb',     name: 'MLB' },
  { slug: 'nba',     name: 'NBA' },
  { slug: 'nfl',     name: 'NFL' },
  { slug: 'nhl',     name: 'NHL' },
  { slug: 'liga-mx', name: 'Soccer' },
];

export default function TopNav({ activeLeague, onLeague }) {
  const [search, setSearch] = useState('');

  return (
    <header style={{
      position: 'fixed',
      top: 0, right: 0,
      width: 'calc(100% - 220px)',
      height: '56px',
      background: 'rgba(9,9,9,0.85)',
      backdropFilter: 'blur(20px)',
      WebkitBackdropFilter: 'blur(20px)',
      borderBottom: '1px solid rgba(61,74,62,0.5)',
      display: 'flex',
      alignItems: 'center',
      paddingLeft: '24px',
      paddingRight: '20px',
      gap: '0',
      zIndex: 40,
    }}>

      {/* League tabs */}
      <nav style={{ display: 'flex', alignItems: 'stretch', height: '100%', flex: 1 }}>
        {LEAGUES.map(l => {
          const active = activeLeague === l.slug;
          return (
            <button
              key={l.slug}
              onClick={() => onLeague(l.slug)}
              style={{
                height: '100%',
                padding: '0 18px',
                fontSize: '13px',
                fontWeight: active ? 600 : 500,
                color: active ? '#6bfb9a' : 'rgba(188,202,187,0.45)',
                background: 'none',
                border: 'none',
                borderBottom: active ? '2px solid #6bfb9a' : '2px solid transparent',
                cursor: 'pointer',
                transition: 'color 120ms, border-color 120ms',
                letterSpacing: '-0.01em',
                marginBottom: '-1px',
              }}
              onMouseEnter={e => { if (!active) e.currentTarget.style.color = 'rgba(188,202,187,0.8)'; }}
              onMouseLeave={e => { if (!active) e.currentTarget.style.color = 'rgba(188,202,187,0.45)'; }}
            >
              {l.name}
            </button>
          );
        })}
      </nav>

      {/* Right: search + icons */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        {/* Search */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: '8px',
          background: 'rgba(255,255,255,0.04)',
          border: '1px solid rgba(255,255,255,0.07)',
          borderRadius: '8px',
          padding: '0 12px',
          height: '32px',
          width: '200px',
        }}>
          <span className="material-symbols-outlined" style={{ fontSize: '15px', color: 'rgba(255,255,255,0.2)', fontVariationSettings: "'FILL' 0, 'wght' 300" }}>search</span>
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search..."
            style={{
              background: 'none', border: 'none', outline: 'none',
              fontSize: '12px', color: 'rgba(255,255,255,0.6)',
              width: '100%',
            }}
          />
        </div>

        {/* Bell */}
        <button style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '5px', position: 'relative', borderRadius: '6px' }}>
          <span className="material-symbols-outlined" style={{ fontSize: '18px', color: 'rgba(255,255,255,0.35)', fontVariationSettings: "'FILL' 0, 'wght' 300, 'GRAD' 0, 'opsz' 20" }}>notifications</span>
          <span style={{
            position: 'absolute', top: '4px', right: '4px',
            width: '5px', height: '5px', borderRadius: '50%',
            background: '#6bfb9a', border: '1.5px solid #090909',
          }} />
        </button>

        {/* Wallet */}
        <button style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '5px', borderRadius: '6px' }}>
          <span className="material-symbols-outlined" style={{ fontSize: '18px', color: 'rgba(255,255,255,0.35)', fontVariationSettings: "'FILL' 0, 'wght' 300, 'GRAD' 0, 'opsz' 20" }}>account_balance_wallet</span>
        </button>

        {/* Avatar */}
        <div style={{
          width: '30px', height: '30px', borderRadius: '50%',
          background: 'rgba(107,251,154,0.12)',
          border: '1px solid rgba(107,251,154,0.25)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          cursor: 'pointer', marginLeft: '4px',
        }}>
          <span style={{ fontSize: '12px', fontWeight: 700, color: '#6bfb9a' }}>A</span>
        </div>
      </div>
    </header>
  );
}
