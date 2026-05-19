import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const NAV = [
  { to: '/dashboard',           icon: 'grid_view',        label: 'Dashboard', end: true },
  { to: '/dashboard/games',     icon: 'sports_baseball',  label: 'Games' },
  { to: '/dashboard/picks',     icon: 'bookmark',         label: 'My Picks' },
  { to: '/dashboard/ev',        icon: 'trending_up',      label: 'EV Finder' },
  { to: '/dashboard/arbitrage', icon: 'swap_horiz',       label: 'Arbitrage' },
  { to: '/dashboard/middle',    icon: 'center_focus_weak',label: 'Middles' },
];

export default function Sidebar() {
  const { logout } = useAuth();

  return (
    <aside style={{
      position: 'fixed',
      top: 0, left: 0,
      width: '220px',
      height: '100vh',
      background: '#0e0e0e',
      borderRight: '1px solid #3d4a3e',
      display: 'flex',
      flexDirection: 'column',
      zIndex: 50,
    }}>

      {/* Logo */}
      <div style={{ padding: '22px 20px 18px' }}>
        <p style={{
          fontSize: '19px', fontWeight: 800, color: '#6bfb9a',
          letterSpacing: '-0.04em', lineHeight: 1,
        }}>
          Outlier MX
        </p>
        <p style={{
          fontSize: '9px', fontWeight: 700, color: 'rgba(107,251,154,0.4)',
          letterSpacing: '0.18em', textTransform: 'uppercase', marginTop: '4px',
        }}>
          Premium Betting
        </p>
      </div>

      {/* Divider */}
      <div style={{ height: '1px', background: 'rgba(61,74,62,0.6)', margin: '0 16px' }} />

      {/* Nav */}
      <nav style={{ flex: 1, padding: '10px 10px', display: 'flex', flexDirection: 'column', gap: '1px', overflowY: 'auto' }}>
        {NAV.map(item => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            style={({ isActive }) => ({
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              padding: '8px 11px',
              borderRadius: '8px',
              fontSize: '13px',
              fontWeight: isActive ? 600 : 500,
              textDecoration: 'none',
              color: isActive ? '#e8f5e9' : '#bccabb',
              background: isActive ? '#2a2a2a' : 'transparent',
              transition: 'all 120ms',
            })}
            onMouseEnter={e => {
              if (!e.currentTarget.className.includes('active') && !e.currentTarget.getAttribute('data-active')) {
                const bg = e.currentTarget.style.background;
                if (bg !== '#2a2a2a') {
                  e.currentTarget.style.background = 'rgba(255,255,255,0.04)';
                  e.currentTarget.style.color = '#e8f5e9';
                }
              }
            }}
            onMouseLeave={e => {
              const bg = e.currentTarget.style.background;
              if (bg !== '#2a2a2a') {
                e.currentTarget.style.background = 'transparent';
                e.currentTarget.style.color = '#bccabb';
              }
            }}
          >
            {({ isActive }) => (
              <>
                <span
                  className="material-symbols-outlined"
                  style={{
                    fontSize: '17px',
                    color: isActive ? '#6bfb9a' : 'rgba(188,202,187,0.5)',
                    fontVariationSettings: "'FILL' 0, 'wght' 300, 'GRAD' 0, 'opsz' 20",
                  }}
                >
                  {item.icon}
                </span>
                {item.label}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Bottom */}
      <div style={{ padding: '10px 10px 20px', display: 'flex', flexDirection: 'column', gap: '1px' }}>
        {/* Place Quick Bet */}
        <button style={{
          width: '100%',
          padding: '11px',
          background: '#6bfb9a',
          border: 'none',
          borderRadius: '8px',
          color: '#0a1a0e',
          fontSize: '12.5px',
          fontWeight: 700,
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '7px',
          marginBottom: '8px',
          letterSpacing: '-0.01em',
          boxShadow: '0 0 20px rgba(107,251,154,0.25), 0 4px 12px rgba(107,251,154,0.15)',
          transition: 'box-shadow 150ms',
        }}
          onMouseEnter={e => e.currentTarget.style.boxShadow = '0 0 28px rgba(107,251,154,0.4), 0 4px 16px rgba(107,251,154,0.25)'}
          onMouseLeave={e => e.currentTarget.style.boxShadow = '0 0 20px rgba(107,251,154,0.25), 0 4px 12px rgba(107,251,154,0.15)'}
        >
          <span className="material-symbols-outlined" style={{ fontSize: '16px', fontVariationSettings: "'FILL' 1, 'wght' 500" }}>bolt</span>
          Place Quick Bet
        </button>

        <button style={{
          display: 'flex', alignItems: 'center', gap: '10px',
          padding: '8px 11px', borderRadius: '8px',
          background: 'none', border: 'none', cursor: 'pointer',
          color: '#bccabb', fontSize: '13px', fontWeight: 500,
          width: '100%', letterSpacing: 0,
        }}>
          <span className="material-symbols-outlined" style={{ fontSize: '17px', color: 'rgba(188,202,187,0.4)', fontVariationSettings: "'FILL' 0, 'wght' 300" }}>help</span>
          Support
        </button>

        <button
          onClick={logout}
          style={{
            display: 'flex', alignItems: 'center', gap: '10px',
            padding: '8px 11px', borderRadius: '8px',
            background: 'none', border: 'none', cursor: 'pointer',
            color: '#bccabb', fontSize: '13px', fontWeight: 500,
            width: '100%',
          }}
        >
          <span className="material-symbols-outlined" style={{ fontSize: '17px', color: 'rgba(188,202,187,0.4)', fontVariationSettings: "'FILL' 0, 'wght' 300" }}>logout</span>
          Sign Out
        </button>
      </div>
    </aside>
  );
}
