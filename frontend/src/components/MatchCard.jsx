import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const TEAM_COLOR = {
  ATL: '#ce1141', MIA: '#00a3e0', NYY: '#1d2854', BOS: '#bd3039',
  LAD: '#003087', SF:  '#fd5a1e', CHC: '#0e3386', STL: '#c41e3a',
  HOU: '#002d62', PHI: '#e81828', WSH: '#ab0003', TOR: '#134a8e',
  KC:  '#004687', MIN: '#002b5c', MIL: '#12284b', PIT: '#fdb827',
  TEX: '#003278', COL: '#33006f', ATH: '#003831', LAA: '#ba0021',
  SD:  '#2f241d', ARI: '#a71930', SEA: '#0c2c56', CWS: '#27251f',
  CIN: '#c6011f', CLE: '#00385d', BAL: '#df4601', TB:  '#092c5c',
  DET: '#0c2340', NYM: '#002d72',
};

const fmt = v => { const n = parseFloat(v); return (!n || isNaN(n)) ? null : n >= 10 ? n.toFixed(1) : n.toFixed(2); };
const isEv = v => parseFloat(v) > 2.0;
const fmtRec = (w, l, t) => (!w && w !== 0) ? '' : t > 0 ? `${w}-${l}-${t}` : `${w}-${l}`;
const fmtTime = dateStr => {
  const d = new Date(dateStr);
  const isToday = new Date().toDateString() === d.toDateString();
  const time = d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
  return `${isToday ? 'TODAY' : d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }).toUpperCase()} · ${time}`;
};

export default function MatchCard({ match }) {
  const navigate = useNavigate();
  const [pbOpen, setPbOpen] = useState(false);

  const ml = match.odds?.filter(o => o.bet_type === 'moneyline')  || [];
  const rl = match.odds?.filter(o => o.bet_type === 'spread')     || [];
  const ou = match.odds?.filter(o => o.bet_type === 'over_under') || [];

  const bestH  = ml.length ? ml.reduce((b, o) => +o.home_odds > +b.home_odds ? o : b, ml[0]) : null;
  const bestA  = ml.length ? ml.reduce((b, o) => +o.away_odds > +b.away_odds ? o : b, ml[0]) : null;
  const spread = rl[0];
  const total  = ou[0];

  const pbMl = match.public_betting?.find(p => p.bet_type === 'moneyline');
  const pbRl = match.public_betting?.find(p => p.bet_type === 'spread');
  const pbOu = match.public_betting?.find(p => p.bet_type === 'over_under');

  return (
    <article className="lit-card match-card-enter" style={{ display: 'flex', flexDirection: 'column' }}>

      {/* Time header */}
      <div style={{
        padding: '10px 16px',
        fontSize: '10px', fontWeight: 600,
        color: 'rgba(188,202,187,0.5)',
        letterSpacing: '0.1em',
        textTransform: 'uppercase',
        borderBottom: '1px solid rgba(255,255,255,0.05)',
        background: 'rgba(0,0,0,0.2)',
      }}>
        {fmtTime(match.match_date)}
      </div>

      {/* Body */}
      <div style={{ display: 'flex' }}>

        {/* Teams column */}
        <div style={{
          width: '210px', minWidth: '210px',
          padding: '16px',
          display: 'flex', flexDirection: 'column', gap: '12px',
          borderRight: '1px solid rgba(255,255,255,0.05)',
          justifyContent: 'center',
        }}>
          <TeamRow
            name={match.home_team} short={match.home_short}
            record={fmtRec(match.home_wins, match.home_losses, match.home_ties)}
            streak={match.home_streak} recent={match.home_recent}
            isLive={match.status === 'live'}
          />
          <div style={{ height: '1px', background: 'rgba(255,255,255,0.04)' }} />
          <TeamRow
            name={match.away_team} short={match.away_short}
            record={fmtRec(match.away_wins, match.away_losses, match.away_ties)}
            streak={match.away_streak} recent={match.away_recent}
          />
        </div>

        {/* Odds columns */}
        <div style={{ flex: 1, display: 'flex', overflowX: 'auto', padding: '16px', gap: '12px' }}>
          {/* Moneyline */}
          <div style={{ flex: '1 0 120px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <p style={{ fontSize: '9px', fontWeight: 700, letterSpacing: '0.1em', color: 'rgba(188,202,187,0.35)', textTransform: 'uppercase', marginBottom: '2px' }}>Moneyline</p>
                    <OddsPill label={match.home_short} value={fmt(bestH?.home_odds)} />
            <OddsPill label={match.away_short} value={fmt(bestA?.away_odds)} />
          </div>

          <div style={{ width: '1px', background: 'rgba(255,255,255,0.05)', flexShrink: 0 }} />

          {/* Run Line */}
          <div style={{ flex: '1 0 130px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <p style={{ fontSize: '9px', fontWeight: 700, letterSpacing: '0.1em', color: 'rgba(188,202,187,0.35)', textTransform: 'uppercase', marginBottom: '2px' }}>Run Line</p>
            {spread ? <>
              <OddsPill label={`${match.home_short} ${spread.spread_value > 0 ? '+' : ''}${spread.spread_value}`} value={fmt(spread.home_odds)} />
              <OddsPill label={`${match.away_short} ${spread.spread_value > 0 ? '-' : '+'}${Math.abs(spread.spread_value)}`} value={fmt(spread.away_odds)} />
            </> : <>
              <OddsPill label="—" value={null} />
              <OddsPill label="—" value={null} />
            </>}
          </div>

          <div style={{ width: '1px', background: 'rgba(255,255,255,0.05)', flexShrink: 0 }} />

          {/* Over/Under */}
          <div style={{ flex: '1 0 130px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <p style={{ fontSize: '9px', fontWeight: 700, letterSpacing: '0.1em', color: 'rgba(188,202,187,0.35)', textTransform: 'uppercase', marginBottom: '2px' }}>Over / Under</p>
            {total ? <>
              <OddsPill label={`Over ${total.total_value}`}  value={fmt(total.over_odds)} />
              <OddsPill label={`Under ${total.total_value}`} value={fmt(total.under_odds)} />
            </> : <>
              <OddsPill label="—" value={null} />
              <OddsPill label="—" value={null} />
            </>}
          </div>
        </div>
      </div>

      {/* Public Betting panel */}
      {pbOpen && (
        <div style={{ borderTop: '1px solid rgba(255,255,255,0.05)', background: '#080808', padding: '16px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '20px' }}>
            <PbCol title="Money Line"   pb={pbMl} left={match.home_short} right={match.away_short} />
            <PbCol title="Run Line"     pb={pbRl} left={match.home_short} right={match.away_short} />
            <PbCol title="Over / Under" pb={pbOu} left="Over"             right="Under" />
          </div>
        </div>
      )}

      {/* Footer */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '10px 16px',
        borderTop: '1px solid rgba(255,255,255,0.05)',
        background: '#080808',
      }}>
        <button
          style={{
            display: 'flex', alignItems: 'center', gap: '5px',
            background: 'none', border: 'none', cursor: 'pointer',
            fontSize: '10.5px', fontWeight: 600,
            letterSpacing: '0.07em', textTransform: 'uppercase',
            color: pbOpen ? 'rgba(255,255,255,0.5)' : 'rgba(255,255,255,0.28)',
            padding: 0, transition: 'color 120ms',
          }}
          onClick={() => setPbOpen(v => !v)}
          onMouseEnter={e => e.currentTarget.style.color = 'rgba(255,255,255,0.6)'}
          onMouseLeave={e => e.currentTarget.style.color = pbOpen ? 'rgba(255,255,255,0.5)' : 'rgba(255,255,255,0.28)'}
        >
          <span className="material-symbols-outlined" style={{ fontSize: '14px', fontVariationSettings: "'FILL' 0, 'wght' 300" }}>
            {pbOpen ? 'expand_less' : 'expand_more'}
          </span>
          Public Betting
        </button>

        <button
          style={{
            display: 'flex', alignItems: 'center', gap: '5px',
            background: 'none', border: 'none', cursor: 'pointer',
            fontSize: '10.5px', fontWeight: 600,
            letterSpacing: '0.07em', textTransform: 'uppercase',
            color: 'rgba(255,255,255,0.28)',
            padding: 0, transition: 'color 120ms',
          }}
          onClick={() => navigate(`/dashboard/match/${match.id}`)}
          onMouseEnter={e => e.currentTarget.style.color = '#6bfb9a'}
          onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,0.28)'}
        >
          Match Details
          <span className="material-symbols-outlined" style={{ fontSize: '14px', fontVariationSettings: "'FILL' 0, 'wght' 300" }}>chevron_right</span>
        </button>
      </div>
    </article>
  );
}

/* ── TeamRow ─────────────────────────────────────────────────── */
function TeamRow({ name, short, record, streak, recent, isLive }) {
  const color = TEAM_COLOR[short] || '#444';
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
      {/* Avatar */}
      <div style={{
        width: '28px', height: '28px', borderRadius: '6px', flexShrink: 0,
        background: color + '22', border: `1px solid ${color}38`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        position: 'relative',
      }}>
        <span style={{ fontSize: '9px', fontWeight: 800, color, letterSpacing: '-0.02em' }}>
          {short?.slice(0, 3)}
        </span>
        {isLive && (
          <span style={{
            position: 'absolute', top: '-3px', right: '-3px',
            width: '7px', height: '7px', borderRadius: '50%',
            background: '#6bfb9a', border: '1.5px solid #0e0e0e',
          }} className="live-dot" />
        )}
      </div>

      {/* Info */}
      <div style={{ minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '2px' }}>
          <span style={{
            fontSize: '13px', fontWeight: 600, color: '#f0f0f0',
            letterSpacing: '-0.02em', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          }}>
            {name}
          </span>
          {streak && (
            <span style={{
              fontSize: '8.5px', fontWeight: 700, padding: '1px 5px', borderRadius: '4px', flexShrink: 0,
              color: streak.startsWith('W') ? '#6bfb9a' : streak.startsWith('L') ? '#f87171' : 'rgba(255,255,255,0.35)',
              background: streak.startsWith('W') ? 'rgba(107,251,154,0.1)' : streak.startsWith('L') ? 'rgba(248,113,113,0.1)' : 'rgba(255,255,255,0.06)',
            }}>
              {streak}
            </span>
          )}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          {record && <span style={{ fontSize: '10.5px', color: 'rgba(255,255,255,0.25)', fontVariantNumeric: 'tabular-nums' }}>{record}</span>}
          <TrendDots games={recent} />
        </div>
      </div>
    </div>
  );
}

/* ── OddsPill ────────────────────────────────────────────────── */
function OddsPill({ label, value, ev }) {
  const empty = !value;
  return (
    <div
      className={`odds-pill${ev ? ' ev-plus' : ''}`}
      style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '7px 10px',
        gap: '6px',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', minWidth: 0 }}>
        <span
          className="material-symbols-outlined"
          style={{
            fontSize: '13px', flexShrink: 0,
            color: ev ? '#00ff66' : 'rgba(255,255,255,0.18)',
            fontVariationSettings: ev ? "'FILL' 1, 'wght' 600" : "'FILL' 0, 'wght' 300",
          }}
        >
          {ev ? 'check_circle' : 'bar_chart'}
        </span>
        <span style={{
          fontSize: '11.5px', fontWeight: 500,
          color: 'rgba(255,255,255,0.4)',
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
        }}>
          {label}
        </span>
      </div>
      <span style={{
        fontSize: '14px', fontWeight: 700, fontVariantNumeric: 'tabular-nums',
        letterSpacing: '-0.02em',
        color: empty ? 'rgba(255,255,255,0.12)' : ev ? '#00ff66' : '#fff',
        flexShrink: 0,
      }}>
        {value ?? '—'}
      </span>
    </div>
  );
}

/* ── TrendDots ───────────────────────────────────────────────── */
function TrendDots({ games }) {
  const r = (games || []).slice(0, 7).reverse();
  if (!r.length) return null;
  return (
    <div style={{ display: 'flex', gap: '2px', alignItems: 'center' }}>
      {r.map((g, i) => (
        <div key={i} style={{
          width: '5px', height: '5px', borderRadius: '50%',
          background: g.result === 'W' ? '#6bfb9a' : g.result === 'L' ? '#f87171' : 'rgba(255,255,255,0.12)',
        }} />
      ))}
    </div>
  );
}

/* ── Public Betting ──────────────────────────────────────────── */
function PbCol({ title, pb, left, right }) {
  if (!pb) return (
    <div>
      <p style={{ fontSize: '9px', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'rgba(188,202,187,0.3)', marginBottom: '12px' }}>{title}</p>
      <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.18)' }}>No data</p>
    </div>
  );

  const lB = parseFloat(pb.home_pct_bets)  || 0;
  const rB = parseFloat(pb.away_pct_bets)  || 0;
  const lM = parseFloat(pb.home_pct_money) || 0;
  const rM = parseFloat(pb.away_pct_money) || 0;

  return (
    <div>
      <p style={{ fontSize: '9px', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'rgba(188,202,187,0.3)', marginBottom: '14px' }}>
        {title}
      </p>
      <PbBar lPct={lB} rPct={rB} lLabel={left} rLabel={right} barLabel="% Bets"  color="#00ff66" />
      <div style={{ marginBottom: '12px' }} />
      <PbBar lPct={lM} rPct={rM} lLabel={left} rLabel={right} barLabel="% Money" color="#60a5fa" />
    </div>
  );
}

function PbBar({ lPct, rPct, lLabel, rLabel, barLabel, color }) {
  const lW = lPct >= rPct;
  const [ready, setReady] = useState(false);
  useEffect(() => { const t = setTimeout(() => setReady(true), 30); return () => clearTimeout(t); }, []);

  const lW_ = ready ? lPct : 0;
  const rW_ = ready ? rPct : 0;

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '5px' }}>
        <span style={{ fontSize: '12.5px', fontWeight: 700, fontVariantNumeric: 'tabular-nums', color: lW ? color : 'rgba(255,255,255,0.25)' }}>
          {lPct}%
        </span>
        <span style={{ fontSize: '8.5px', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'rgba(188,202,187,0.3)' }}>
          {barLabel}
        </span>
        <span style={{ fontSize: '12.5px', fontWeight: 700, fontVariantNumeric: 'tabular-nums', color: !lW ? color : 'rgba(255,255,255,0.25)' }}>
          {rPct}%
        </span>
      </div>
      <div style={{ height: '4px', borderRadius: '99px', background: '#404040', display: 'flex', overflow: 'hidden' }}>
        <div style={{ width: `${lW_}%`, background: lW ? color : 'rgba(255,255,255,0.12)', flexShrink: 0, transition: 'width 0.7s cubic-bezier(0.4,0,0.2,1)' }} />
        <div style={{ width: `${rW_}%`, background: !lW ? color : 'rgba(255,255,255,0.12)', flexShrink: 0, transition: 'width 0.7s cubic-bezier(0.4,0,0.2,1)' }} />
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '4px' }}>
        <span style={{ fontSize: '9px', color: 'rgba(255,255,255,0.2)' }}>{lLabel}</span>
        <span style={{ fontSize: '9px', color: 'rgba(255,255,255,0.2)' }}>{rLabel}</span>
      </div>
    </div>
  );
}
