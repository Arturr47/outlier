import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import api from '../lib/api';
import { SportsbookBadge } from '../components/SportsbookIcon';

/* ── Color map ───────────────────────────────────────── */
const TEAM_COLOR = {
  ATL:'#ce1141',MIA:'#00a3e0',NYY:'#1d2854',BOS:'#bd3039',LAD:'#003087',
  SF:'#fd5a1e',CHC:'#0e3386',STL:'#c41e3a',HOU:'#002d62',PHI:'#e81828',
  WSH:'#ab0003',TOR:'#134a8e',KC:'#004687',MIN:'#002b5c',MIL:'#12284b',
  PIT:'#fdb827',TEX:'#003278',COL:'#33006f',ATH:'#003831',LAA:'#ba0021',
  SD:'#2f241d',ARI:'#a71930',SEA:'#0c2c56',CWS:'#27251f',CIN:'#c6011f',
  CLE:'#00385d',BAL:'#df4601',TB:'#092c5c',DET:'#0c2340',NYM:'#002d72',
};

function TeamBadge({ short, size = 28, radius = 8 }) {
  const c = TEAM_COLOR[short] || '#444';
  return (
    <div style={{
      width: size, height: size, borderRadius: radius === 'full' ? '50%' : radius,
      background: c + '22', border: `1.5px solid ${c}44`, flexShrink: 0,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      <span style={{ fontSize: size * 0.3, fontWeight: 800, color: c, letterSpacing: '-0.02em' }}>{short?.slice(0,3)}</span>
    </div>
  );
}

/* ── Main ────────────────────────────────────────────── */
export default function MatchDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [data, setData]       = useState(null);
  const [loading, setLoading] = useState(true);
  const [statsTab, setStatsTab] = useState('L10');
  const [rightTab, setRightTab] = useState('matchup');
  const [gamesFilter, setGamesFilter] = useState('all');
  const [selectedPick, setSelectedPick] = useState(null);   // { label, odds }
  const [pickSaved, setPickSaved]       = useState(null);

  useEffect(() => {
    api.get(`/matches/${id}`)
      .then(r => setData(r.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [id]);

  const savePick = async (pickType, pickValue, odds, sportsbook) => {
    try {
      await api.post('/picks', { matchId: parseInt(id), pickType, pickValue, odds, sportsbook });
      setPickSaved(`${pickType}-${pickValue}`);
      setTimeout(() => setPickSaved(null), 2000);
    } catch (e) { console.error(e); }
  };

  if (loading) return (
    <div style={{ paddingTop: '56px', minHeight: '100vh', background: '#0d0d0d', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <Loader2 size={20} style={{ color: '#6bfb9a', animation: 'spin 1s linear infinite' }} />
    </div>
  );
  if (!data) return (
    <div style={{ paddingTop: '56px', minHeight: '100vh', background: '#0d0d0d', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <span style={{ color: 'rgba(188,202,187,0.4)', fontSize: '14px' }}>Match not found</span>
    </div>
  );

  const { match, odds, h2h, injuries, props: playerProps, public_betting, home_recent, away_recent, home_lineup, away_lineup, probable_pitchers, team_batters } = data;
  const isSoccer = match.sport === 'soccer';
  const hasPitchers = Array.isArray(probable_pitchers) && probable_pitchers.length > 0;
  const matchDate = new Date(match.match_date);

  const moneyline   = odds.filter(o => o.bet_type === 'moneyline');
  const spreadsOdds = odds.filter(o => o.bet_type === 'spread');
  const totalsOdds  = odds.filter(o => o.bet_type === 'over_under');
  const bestHomeMl  = moneyline[0] || null;
  const bestAwayMl  = moneyline[0] || null;

  const homeRecord = `${match.home_wins}-${match.home_losses}${match.home_ties > 0 ? `-${match.home_ties}` : ''}`;
  const awayRecord = `${match.away_wins}-${match.away_losses}${match.away_ties > 0 ? `-${match.away_ties}` : ''}`;

  const statsTabs = ['L5', 'L10', 'L20', 'H2H', '2026', '2025'];
  const numGames = statsTab === 'L5' ? 5 : statsTab === 'L20' ? 20 : 10;

  const homeWinPct = home_recent?.length ? Math.round(home_recent.filter(g => g.result === 'W').length / home_recent.length * 100) : 0;
  const awayWinPct = away_recent?.length ? Math.round(away_recent.filter(g => g.result === 'W').length / away_recent.length * 100) : 0;

  const dateLabel = (() => {
    const isToday = new Date().toDateString() === matchDate.toDateString();
    const time = matchDate.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
    return `${isToday ? 'Today' : matchDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} ${time}`;
  })();

  return (
    <div style={{ paddingTop: '56px', minHeight: '100vh', background: '#0d0d0d' }}>

      {/* ── Header ────────────────────────────────────── */}
      <div style={{ background: 'rgba(14,14,16,0.95)', borderBottom: '1px solid rgba(61,74,62,0.4)', padding: '18px 28px 0' }}>

        {/* Back */}
        <button onClick={() => navigate(-1)} style={{ display:'flex', alignItems:'center', gap:'6px', background:'none', border:'none', cursor:'pointer', fontSize:'12px', color:'rgba(188,202,187,0.45)', padding:0, marginBottom:'16px' }}
          onMouseEnter={e=>e.currentTarget.style.color='#bccabb'} onMouseLeave={e=>e.currentTarget.style.color='rgba(188,202,187,0.45)'}>
          <span className="material-symbols-outlined" style={{ fontSize:'15px', fontVariationSettings:"'FILL' 0,'wght' 300" }}>arrow_back</span>
          Back to Games
        </button>

        {/* Match row */}
        <div style={{ display:'flex', alignItems:'center', gap:'14px', marginBottom:'14px' }}>
          {/* Overlapping team badges */}
          <div style={{ display:'flex', position:'relative', width:'68px', height:'44px', flexShrink:0 }}>
            <TeamBadge short={match.home_short} size={44} radius="full" />
            <div style={{ position:'absolute', left:'24px' }}>
              <TeamBadge short={match.away_short} size={44} radius="full" />
            </div>
          </div>

          <div>
            <div style={{ display:'flex', alignItems:'center', gap:'8px', fontSize:'12px', color:'rgba(188,202,187,0.45)', marginBottom:'4px' }}>
              <span style={{ fontWeight:600 }}>{match.home_short} @ {match.away_short}</span>
              <span>·</span>
              <span>{dateLabel}</span>
              {match.venue && <><span>·</span><span>{match.venue}</span></>}
            </div>
            <div style={{ display:'flex', alignItems:'center', gap:'8px' }}>
              <span style={{ fontSize:'20px', fontWeight:800, color:'#f0f0f0', letterSpacing:'-0.03em' }}>Money Line</span>
              <span style={{ fontSize:'20px', fontWeight:800, color:'#6bfb9a', letterSpacing:'-0.03em' }}>
                {bestHomeMl ? match.home_short : '—'}
              </span>
            </div>
          </div>
        </div>

        {/* Quick odds + betslip row */}
        <div style={{ display:'flex', alignItems:'center', gap:'8px', marginBottom:'14px', flexWrap:'wrap' }}>
          {/* Odds pills */}
          {bestHomeMl && (
            <button onClick={() => setSelectedPick(p => p?.label === match.home_short ? null : { label: match.home_short, odds: parseFloat(bestHomeMl.home_odds).toFixed(2) })}
              style={{
                display:'flex', alignItems:'center', gap:'7px', padding:'7px 12px', borderRadius:'8px', cursor:'pointer', border:'none', transition:'all 120ms',
                background: selectedPick?.label === match.home_short ? 'rgba(107,251,154,0.12)' : 'rgba(255,255,255,0.05)',
                outline: selectedPick?.label === match.home_short ? '1px solid rgba(107,251,154,0.3)' : '1px solid rgba(255,255,255,0.07)',
              }}>
              <span className="material-symbols-outlined" style={{ fontSize:'13px', color:'rgba(255,255,255,0.25)', fontVariationSettings:"'FILL' 0,'wght' 300" }}>bar_chart</span>
              <span style={{ fontSize:'13px', fontWeight:700, color:'#f0f0f0' }}>{match.home_short}</span>
              <span style={{ fontSize:'13px', fontWeight:700, color:'#f0f0f0', fontVariantNumeric:'tabular-nums' }}>{parseFloat(bestHomeMl.home_odds).toFixed(2)}</span>
            </button>
          )}
          {bestAwayMl && (
            <button onClick={() => setSelectedPick(p => p?.label === match.away_short ? null : { label: match.away_short, odds: parseFloat(bestAwayMl.away_odds).toFixed(2) })}
              style={{
                display:'flex', alignItems:'center', gap:'7px', padding:'7px 12px', borderRadius:'8px', cursor:'pointer', border:'none', transition:'all 120ms',
                background: selectedPick?.label === match.away_short ? 'rgba(107,251,154,0.12)' : 'rgba(255,255,255,0.05)',
                outline: selectedPick?.label === match.away_short ? '1px solid rgba(107,251,154,0.3)' : '1px solid rgba(255,255,255,0.07)',
              }}>
              <span className="material-symbols-outlined" style={{ fontSize:'13px', color:'rgba(255,255,255,0.25)', fontVariationSettings:"'FILL' 0,'wght' 300" }}>bar_chart</span>
              <span style={{ fontSize:'13px', fontWeight:700, color:'#f0f0f0' }}>{match.away_short}</span>
              <span style={{ fontSize:'13px', fontWeight:700, color:'#f0f0f0', fontVariantNumeric:'tabular-nums' }}>{parseFloat(bestAwayMl.away_odds).toFixed(2)}</span>
            </button>
          )}

          {/* Selected pick betslip pill */}
          {selectedPick && (
            <div style={{ display:'flex', alignItems:'center', gap:'8px', padding:'7px 14px', borderRadius:'8px', background:'rgba(107,251,154,0.08)', outline:'1px solid rgba(107,251,154,0.2)', marginLeft:'4px' }}>
              <span className="material-symbols-outlined" style={{ fontSize:'13px', color:'rgba(107,251,154,0.5)', fontVariationSettings:"'FILL' 0,'wght' 300" }}>add_circle</span>
              <span style={{ fontSize:'13px', fontWeight:600, color:'#f0f0f0' }}>{selectedPick.label}</span>
              <span style={{ fontSize:'13px', fontWeight:700, color:'#6bfb9a', fontVariantNumeric:'tabular-nums' }}>{selectedPick.odds}</span>
              <button onClick={() => setSelectedPick(null)} style={{ background:'none', border:'none', cursor:'pointer', padding:0, display:'flex', alignItems:'center' }}>
                <span className="material-symbols-outlined" style={{ fontSize:'14px', color:'rgba(188,202,187,0.4)', fontVariationSettings:"'FILL' 0,'wght' 300" }}>close</span>
              </button>
            </div>
          )}

          {/* Save to picks button */}
          {selectedPick && (
            <button
              onClick={() => { savePick('moneyline', `${selectedPick.label} ML`, selectedPick.odds, bestHomeMl?.sportsbook); setSelectedPick(null); }}
              style={{ display:'flex', alignItems:'center', gap:'6px', padding:'7px 14px', borderRadius:'8px', background:'#6bfb9a', border:'none', cursor:'pointer', fontSize:'12.5px', fontWeight:700, color:'#0a1a0e' }}>
              <span className="material-symbols-outlined" style={{ fontSize:'14px', fontVariationSettings:"'FILL' 1,'wght' 600" }}>bookmark_add</span>
              Save Pick
            </button>
          )}
        </div>

        {/* Stats tabs */}
        <div style={{ display:'flex', alignItems:'center', gap:'2px', borderTop:'1px solid rgba(255,255,255,0.05)', paddingTop:'10px' }}>
          <button style={{ padding:'4px 8px', background:'none', border:'none', cursor:'pointer', color:'rgba(188,202,187,0.3)', display:'flex', alignItems:'center' }}>
            <span className="material-symbols-outlined" style={{ fontSize:'15px', fontVariationSettings:"'FILL' 0,'wght' 300" }}>location_on</span>
          </button>
          {statsTabs.map(tab => {
            const active = statsTab === tab;
            return (
              <button key={tab} onClick={() => setStatsTab(tab)} style={{
                padding:'5px 13px', borderRadius:'7px', border:'none', cursor:'pointer',
                fontSize:'12.5px', fontWeight: active ? 700 : 500,
                background: active ? '#f0f0f0' : 'transparent',
                color: active ? '#0d0d0d' : 'rgba(188,202,187,0.5)',
                transition:'all 120ms',
              }}
                onMouseEnter={e=>{ if(!active) e.currentTarget.style.color='#bccabb'; }}
                onMouseLeave={e=>{ if(!active) e.currentTarget.style.color='rgba(188,202,187,0.5)'; }}>
                {tab}
              </button>
            );
          })}
          <button style={{ marginLeft:'auto', padding:'4px 10px', background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.07)', borderRadius:'7px', cursor:'pointer', display:'flex', alignItems:'center', gap:'5px', color:'rgba(188,202,187,0.4)', fontSize:'11px', fontWeight:500 }}>
            <span className="material-symbols-outlined" style={{ fontSize:'14px', fontVariationSettings:"'FILL' 0,'wght' 300" }}>tune</span>
          </button>
        </div>
      </div>

      {/* ── Two columns ───────────────────────────────── */}
      <div style={{ display:'flex' }}>

        {/* Left */}
        <div style={{ flex:1, padding:'24px 28px 40px', borderRight:'1px solid rgba(255,255,255,0.05)', minWidth:0 }}>

          {/* Stats header */}
          <div style={{ display:'flex', alignItems:'center', gap:'8px', marginBottom:'16px' }}>
            <span className="material-symbols-outlined" style={{ fontSize:'18px', color:'#6bfb9a', fontVariationSettings:"'FILL' 0,'wght' 300" }}>percent</span>
            <h2 style={{ fontSize:'15px', fontWeight:700, color:'#f0f0f0', margin:0 }}>Statistics</h2>
          </div>

          {/* Win/Loss card */}
          <div className="lit-card" style={{ padding:'18px', marginBottom:'20px' }}>
            <div style={{ display:'grid', gridTemplateColumns:'1fr auto 1fr', gap:'16px', alignItems:'center', marginBottom:'14px' }}>
              <div style={{ display:'flex', alignItems:'center', gap:'10px' }}>
                <TeamBadge short={match.home_short} size={30} radius="full" />
                <div>
                  <span style={{ fontSize:'13px', fontWeight:600, color:'#f0f0f0' }}>{match.home_team}</span>
                  <span style={{ fontSize:'11px', color:'rgba(255,255,255,0.2)', marginLeft:'5px' }}>{homeRecord}</span>
                </div>
              </div>
              <span style={{ fontSize:'11px', color:'rgba(188,202,187,0.25)', whiteSpace:'nowrap' }}>{numGames} games</span>
              <div style={{ display:'flex', alignItems:'center', gap:'10px', justifyContent:'flex-end' }}>
                <div style={{ textAlign:'right' }}>
                  <span style={{ fontSize:'13px', fontWeight:600, color:'#f0f0f0' }}>{match.away_team}</span>
                  <span style={{ fontSize:'11px', color:'rgba(255,255,255,0.2)', marginLeft:'5px' }}>{awayRecord}</span>
                </div>
                <TeamBadge short={match.away_short} size={30} radius="full" />
              </div>
            </div>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'16px' }}>
              {[
                { pct: homeWinPct, recent: home_recent },
                { pct: awayWinPct, recent: away_recent },
              ].map(({ pct, recent }, idx) => (
                <div key={idx}>
                  <div style={{ display:'flex', justifyContent:'space-between', fontSize:'11px', marginBottom:'5px' }}>
                    <span style={{ color:'#6bfb9a', fontWeight:600 }}>Win {pct}%</span>
                    <span style={{ color:'#f87171', fontWeight:600 }}>Lose {100-pct}%</span>
                  </div>
                  <div style={{ height:'5px', borderRadius:'99px', background:'rgba(255,255,255,0.06)', overflow:'hidden', display:'flex' }}>
                    <div style={{ width:`${pct}%`, background:'#6bfb9a' }} />
                    <div style={{ width:`${100-pct}%`, background:'#f87171' }} />
                  </div>
                  <div style={{ display:'flex', gap:'3px', marginTop:'7px' }}>
                    {(recent||[]).slice(0,numGames).reverse().map((g,i) => (
                      <div key={i} style={{ flex:1, height:'4px', borderRadius:'2px', background: g.result==='W'?'#6bfb9a':g.result==='L'?'#f87171':'#facc15' }} />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Games section */}
          {statsTab === 'H2H'
            ? <H2HSection h2h={h2h} match={match} />
            : <RecentGamesSection homeGames={home_recent} awayGames={away_recent} match={match} numGames={numGames} gamesFilter={gamesFilter} setGamesFilter={setGamesFilter} />
          }

          {/* Public Betting */}
          {public_betting?.length > 0 && (
            <div style={{ marginTop:'24px' }}>
              <div style={{ display:'flex', alignItems:'center', gap:'8px', marginBottom:'12px' }}>
                <span className="material-symbols-outlined" style={{ fontSize:'16px', color:'#6bfb9a', fontVariationSettings:"'FILL' 0,'wght' 300" }}>bar_chart</span>
                <h3 style={{ fontSize:'13px', fontWeight:700, color:'#f0f0f0', margin:0 }}>Public Betting</h3>
              </div>
              <div className="lit-card" style={{ padding:'18px' }}>
                <div style={{ display:'flex', flexDirection:'column', gap:'16px' }}>
                  {public_betting.map((pb,i) => {
                    const lB = parseFloat(pb.home_pct_bets)||0, rB = parseFloat(pb.away_pct_bets)||0;
                    const lM = parseFloat(pb.home_pct_money)||0, rM = parseFloat(pb.away_pct_money)||0;
                    const label = pb.bet_type==='moneyline'?'Money Line':pb.bet_type==='spread'?'Spread':'Over/Under';
                    const lL = pb.bet_type==='over_under'?'Over':match.home_short;
                    const rL = pb.bet_type==='over_under'?'Under':match.away_short;
                    return (
                      <div key={i}>
                        <p style={{ fontSize:'9px', fontWeight:700, letterSpacing:'0.1em', textTransform:'uppercase', color:'rgba(188,202,187,0.35)', marginBottom:'10px' }}>{label}</p>
                        <AnimBar lPct={lB} rPct={rB} lLabel={lL} rLabel={rL} barLabel="% Bets"  color="#00ff66" />
                        <div style={{ marginBottom:'10px' }} />
                        <AnimBar lPct={lM} rPct={rM} lLabel={lL} rLabel={rL} barLabel="% Money" color="#60a5fa" />
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* Player Props */}
          {playerProps?.length > 0 && (
            <div style={{ marginTop:'24px' }}>
              <div style={{ display:'flex', alignItems:'center', gap:'8px', marginBottom:'12px' }}>
                <span className="material-symbols-outlined" style={{ fontSize:'16px', color:'#facc15', fontVariationSettings:"'FILL' 1,'wght' 500" }}>bolt</span>
                <h3 style={{ fontSize:'13px', fontWeight:700, color:'#f0f0f0', margin:0 }}>Player Props</h3>
              </div>
              <div style={{ display:'flex', flexDirection:'column', gap:'6px' }}>
                {playerProps.map((prop,i) => (
                  <div key={i} className="lit-card" style={{ padding:'12px 16px' }}>
                    <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
                      <div style={{ display:'flex', alignItems:'center', gap:'10px' }}>
                        <span style={{ fontSize:'9px', fontWeight:700, color:'rgba(188,202,187,0.4)', background:'rgba(255,255,255,0.05)', padding:'2px 6px', borderRadius:'4px' }}>{prop.team_short}</span>
                        <span style={{ fontSize:'13px', color:'#f0f0f0', fontWeight:500 }}>{prop.player_name}</span>
                        <span style={{ fontSize:'11px', color:'rgba(188,202,187,0.4)', textTransform:'capitalize' }}>{prop.prop_type?.replace('_',' ')} {prop.line_value}</span>
                      </div>
                      <div style={{ display:'flex', alignItems:'center', gap:'10px' }}>
                        {prop.hit_rate && (
                          <span style={{ fontSize:'10px', fontWeight:700, padding:'2px 6px', borderRadius:'4px', color: parseFloat(prop.hit_rate)>=60?'#6bfb9a':parseFloat(prop.hit_rate)>=50?'#facc15':'#f87171', background: parseFloat(prop.hit_rate)>=60?'rgba(107,251,154,0.1)':parseFloat(prop.hit_rate)>=50?'rgba(250,204,21,0.1)':'rgba(248,113,113,0.1)' }}>{prop.hit_rate}%</span>
                        )}
                        <span style={{ fontSize:'12px', color:'#6bfb9a', fontWeight:700, fontVariantNumeric:'tabular-nums' }}>O {parseFloat(prop.over_odds).toFixed(2)}</span>
                        <span style={{ color:'rgba(255,255,255,0.1)' }}>|</span>
                        <span style={{ fontSize:'12px', color:'#f87171', fontWeight:700, fontVariantNumeric:'tabular-nums' }}>U {parseFloat(prop.under_odds).toFixed(2)}</span>
                        <button onClick={() => savePick('prop',`${prop.player_name} O${prop.line_value}`,prop.over_odds,prop.sportsbook)} style={{ background:'none', border:'none', cursor:'pointer', color:'rgba(188,202,187,0.3)', padding:0 }}>
                          <span className="material-symbols-outlined" style={{ fontSize:'15px', fontVariationSettings:"'FILL' 0,'wght' 300" }}>add_circle</span>
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* ── Right panel ──────────────────────────────── */}
        <div style={{ width:'360px', flexShrink:0, padding:'24px 20px' }}>

          {/* Odds Timeline */}
          <div style={{ marginBottom:'24px' }}>
            <h3 style={{ fontSize:'15px', fontWeight:700, color:'#f0f0f0', margin:'0 0 14px' }}>Odds Timeline</h3>
            <div className="lit-card" style={{ overflow:'hidden' }}>
              {/* Header row */}
              <div style={{ display:'grid', gridTemplateColumns:'1fr auto auto', gap:'8px', padding:'8px 14px', borderBottom:'1px solid rgba(255,255,255,0.04)' }}>
                <span style={{ fontSize:'9px', fontWeight:700, letterSpacing:'0.1em', textTransform:'uppercase', color:'rgba(188,202,187,0.3)' }}>Updated</span>
                <span style={{ fontSize:'9px', fontWeight:700, letterSpacing:'0.1em', textTransform:'uppercase', color:'rgba(188,202,187,0.3)', minWidth:'80px', textAlign:'right' }}>Odds</span>
                <span style={{ fontSize:'9px', fontWeight:700, letterSpacing:'0.1em', textTransform:'uppercase', color:'rgba(188,202,187,0.3)', minWidth:'50px', textAlign:'right' }}></span>
              </div>
              {moneyline.map((odd, i) => {
                const hoOdds = parseFloat(odd.home_odds);
                const awOdds = parseFloat(odd.away_odds);
                return (
                  <div key={i} style={{ borderTop: i > 0 ? '1px solid rgba(255,255,255,0.04)' : 'none' }}>
                    <div style={{ padding:'4px 14px 2px', background:'rgba(0,0,0,0.15)' }}>
                      <span style={{ fontSize:'9px', fontWeight:700, letterSpacing:'0.08em', textTransform:'uppercase', color:'rgba(188,202,187,0.3)' }}>{odd.sportsbook}</span>
                    </div>
                    {[
                      { label: match.home_short, val: hoOdds },
                      { label: match.away_short, val: awOdds },
                    ].map((row, j) => (
                      <div key={j} style={{ display:'grid', gridTemplateColumns:'1fr auto auto', gap:'8px', padding:'9px 14px', borderTop:'1px solid rgba(255,255,255,0.03)', alignItems:'center' }}>
                        <span style={{ fontSize:'12px', color:'#bccabb' }}>
                          {matchDate.toLocaleTimeString('en-US',{hour:'numeric',minute:'2-digit',hour12:true})}
                          {' '}
                          <span style={{ color:'rgba(188,202,187,0.4)' }}>
                            {new Date().toDateString()===matchDate.toDateString()?'Today':matchDate.toLocaleDateString('en-US',{month:'short',day:'numeric'})}
                          </span>
                        </span>
                        <div style={{ minWidth:'80px', textAlign:'right' }}>
                          <span style={{ fontSize:'13px', fontWeight:700, fontVariantNumeric:'tabular-nums', color:'#f0f0f0' }}>{row.val.toFixed(2)}</span>
                          <span style={{ fontSize:'10px', color:'rgba(188,202,187,0.4)', marginLeft:'5px' }}>{row.label}</span>
                        </div>
                        <div style={{ minWidth:'50px', textAlign:'right' }}>
                          <span style={{ fontSize:'11px', fontWeight:600, color:'rgba(188,202,187,0.3)', fontVariantNumeric:'tabular-nums' }}>Open</span>
                        </div>
                      </div>
                    ))}
                  </div>
                );
              })}
              <button style={{ width:'100%', padding:'10px', background:'none', border:'none', borderTop:'1px solid rgba(255,255,255,0.04)', cursor:'pointer', fontSize:'11px', fontWeight:600, letterSpacing:'0.06em', textTransform:'uppercase', color:'rgba(188,202,187,0.35)' }}
                onMouseEnter={e=>e.currentTarget.style.color='#bccabb'} onMouseLeave={e=>e.currentTarget.style.color='rgba(188,202,187,0.35)'}>
                Show More
              </button>
            </div>
          </div>

          {/* Right tabs: Matchup | Injuries | Insights */}
          <div style={{ display:'flex', borderBottom:'1px solid rgba(255,255,255,0.05)', marginBottom:'16px' }}>
            {['matchup','injuries','insights'].map(tab => {
              const active = rightTab === tab;
              return (
                <button key={tab} onClick={() => setRightTab(tab)} style={{
                  flex:1, padding:'9px 0', fontSize:'12px', fontWeight: active?600:500,
                  background:'none', border:'none', cursor:'pointer',
                  borderBottom: active?'2px solid #f0f0f0':'2px solid transparent',
                  color: active?'#f0f0f0':'rgba(188,202,187,0.3)',
                  textTransform:'capitalize', transition:'color 120ms', marginBottom:'-1px',
                }}
                  onMouseEnter={e=>{ if(!active) e.currentTarget.style.color='#bccabb'; }}
                  onMouseLeave={e=>{ if(!active) e.currentTarget.style.color='rgba(188,202,187,0.3)'; }}>
                  {tab === 'matchup' ? 'Matchup' : tab === 'injuries' ? 'Injuries' : 'Insights'}
                </button>
              );
            })}
          </div>

          {rightTab === 'matchup' && (
            <MatchupTab match={match} isSoccer={isSoccer} pitchers={probable_pitchers} batters={team_batters||[]} hasPitchers={hasPitchers} />
          )}
          {rightTab === 'injuries' && (
            <InjuriesTab injuries={injuries} />
          )}
          {rightTab === 'insights' && (
            <InsightsTab match={match} homeWinPct={homeWinPct} awayWinPct={awayWinPct} h2h={h2h} homeRecord={homeRecord} awayRecord={awayRecord} />
          )}
        </div>
      </div>
    </div>
  );
}

/* ── AnimBar ─────────────────────────────────────────── */
function AnimBar({ lPct, rPct, lLabel, rLabel, barLabel, color }) {
  const lW = lPct >= rPct;
  const [ready, setReady] = useState(false);
  useEffect(() => { const t = setTimeout(() => setReady(true), 30); return () => clearTimeout(t); }, []);
  return (
    <div>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'5px' }}>
        <span style={{ fontSize:'12px', fontWeight:700, fontVariantNumeric:'tabular-nums', color: lW?color:'rgba(255,255,255,0.25)' }}>{lPct}%</span>
        <span style={{ fontSize:'8.5px', fontWeight:600, letterSpacing:'0.08em', textTransform:'uppercase', color:'rgba(188,202,187,0.3)' }}>{barLabel}</span>
        <span style={{ fontSize:'12px', fontWeight:700, fontVariantNumeric:'tabular-nums', color: !lW?color:'rgba(255,255,255,0.25)' }}>{rPct}%</span>
      </div>
      <div style={{ height:'4px', borderRadius:'99px', background:'#404040', display:'flex', overflow:'hidden' }}>
        <div style={{ width:`${ready?lPct:0}%`, background:lW?color:'rgba(255,255,255,0.12)', flexShrink:0, transition:'width 0.7s cubic-bezier(0.4,0,0.2,1)' }} />
        <div style={{ width:`${ready?rPct:0}%`, background:!lW?color:'rgba(255,255,255,0.12)', flexShrink:0, transition:'width 0.7s cubic-bezier(0.4,0,0.2,1)' }} />
      </div>
      <div style={{ display:'flex', justifyContent:'space-between', marginTop:'4px' }}>
        <span style={{ fontSize:'9px', color:'rgba(188,202,187,0.25)' }}>{lLabel}</span>
        <span style={{ fontSize:'9px', color:'rgba(188,202,187,0.25)' }}>{rLabel}</span>
      </div>
    </div>
  );
}

/* ── RecentGamesSection ──────────────────────────────── */
function RecentGamesSection({ homeGames, awayGames, match, numGames, gamesFilter, setGamesFilter }) {
  const home = (homeGames||[]).slice(0,numGames);
  const away = (awayGames||[]).slice(0,numGames);
  if (!home.length && !away.length) return (
    <div className="lit-card" style={{ padding:'24px', textAlign:'center', fontSize:'12px', color:'rgba(188,202,187,0.3)' }}>No recent games</div>
  );

  const filterTabs = [
    { id:'all', label:'All games' },
    { id:'matchup', label:`${match.home_short} away / ${match.away_short} home` },
  ];

  return (
    <div className="lit-card" style={{ overflow:'hidden' }}>
      {/* Filter tabs */}
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'10px 14px', borderBottom:'1px solid rgba(255,255,255,0.04)' }}>
        <div style={{ display:'flex', gap:'4px' }}>
          {filterTabs.map(f => {
            const active = gamesFilter === f.id;
            return (
              <button key={f.id} onClick={() => setGamesFilter(f.id)} style={{
                padding:'4px 10px', borderRadius:'6px', border:'none', cursor:'pointer', fontSize:'11px', fontWeight: active?600:500,
                background: active?'rgba(255,255,255,0.08)':'transparent',
                color: active?'#f0f0f0':'rgba(188,202,187,0.4)',
                transition:'all 120ms',
              }}>{f.label}</button>
            );
          })}
        </div>
        {/* Starting pitcher toggle - visual only */}
        <button style={{ display:'flex', alignItems:'center', gap:'5px', padding:'4px 9px', borderRadius:'6px', background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.06)', cursor:'pointer', fontSize:'11px', color:'rgba(188,202,187,0.4)' }}>
          Starting pitcher
          <span className="material-symbols-outlined" style={{ fontSize:'13px', fontVariationSettings:"'FILL' 0,'wght' 300" }}>expand_more</span>
        </button>
      </div>

      {/* Column headers */}
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', borderBottom:'1px solid rgba(255,255,255,0.04)' }}>
        {[match.home_short, match.away_short].map((short,col) => (
          <div key={col} style={{ padding:'8px 14px', background:'rgba(0,0,0,0.2)', borderLeft: col>0?'1px solid rgba(255,255,255,0.04)':'none' }}>
            <span style={{ fontSize:'10px', fontWeight:700, color:'#bccabb' }}>{short}</span>
          </div>
        ))}
      </div>

      {/* Game rows */}
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr' }}>
        {[
          { games: home, short: match.home_short },
          { games: away, short: match.away_short },
        ].map(({ games, short }, col) => (
          <div key={col} style={{ borderLeft: col>0?'1px solid rgba(255,255,255,0.04)':'none' }}>
            {games.map((game, i) => {
              const dateStr = new Date(game.game_date).toLocaleDateString('en-US',{month:'numeric',day:'numeric'});
              const resColor = game.result==='W'?'#6bfb9a':game.result==='L'?'#f87171':'#facc15';
              return (
                <div key={i} style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'8px 14px', borderTop: i>0?'1px solid rgba(255,255,255,0.04)':'none' }}>
                  <div style={{ display:'flex', alignItems:'center', gap:'8px' }}>
                    {/* Team badge circle */}
                    <TeamBadge short={game.opponent_short} size={22} radius="full" />
                    <div>
                      <div style={{ display:'flex', alignItems:'center', gap:'5px' }}>
                        <span style={{ fontSize:'9.5px', color:'rgba(188,202,187,0.35)' }}>{game.is_home?'vs':'@'}</span>
                        <span style={{ fontSize:'11px', color:'#bccabb', fontWeight:600 }}>{game.opponent_short}</span>
                      </div>
                      <span style={{ fontSize:'9px', color:'rgba(188,202,187,0.25)' }}>{dateStr}</span>
                    </div>
                  </div>
                  <div style={{ display:'flex', alignItems:'center', gap:'8px' }}>
                    <span style={{ fontSize:'12px', fontWeight:700, color:'#f0f0f0', fontVariantNumeric:'tabular-nums' }}>{game.team_score}:{game.opponent_score}</span>
                    <span style={{ fontSize:'11px', fontWeight:700, color:resColor, width:'10px', textAlign:'center' }}>{game.result}</span>
                  </div>
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── H2HSection ──────────────────────────────────────── */
function H2HSection({ h2h, match }) {
  if (!h2h?.length) return (
    <div className="lit-card" style={{ padding:'24px', textAlign:'center', fontSize:'12px', color:'rgba(188,202,187,0.3)' }}>No H2H history</div>
  );
  return (
    <div className="lit-card" style={{ overflow:'hidden' }}>
      <div style={{ padding:'11px 14px', borderBottom:'1px solid rgba(255,255,255,0.04)' }}>
        <span style={{ fontSize:'11px', color:'#bccabb', fontWeight:500 }}>Head to Head</span>
        <span style={{ fontSize:'11px', color:'rgba(188,202,187,0.3)', marginLeft:'6px' }}>· Last {h2h.length} meetings</span>
      </div>
      {h2h.map((record,i) => {
        const isTeamA = record.team_a_id === match.home_team_id;
        const homeScore = isTeamA?record.score_a:record.score_b;
        const awayScore = isTeamA?record.score_b:record.score_a;
        const homeWin = homeScore > awayScore;
        const dateStr = new Date(record.match_date).toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric'});
        return (
          <div key={i} style={{ display:'grid', gridTemplateColumns:'1fr auto 1fr', alignItems:'center', padding:'9px 14px', borderTop: i>0?'1px solid rgba(255,255,255,0.04)':'none' }}>
            <div style={{ display:'flex', alignItems:'center', gap:'6px' }}>
              <span style={{ fontSize:'11px', fontWeight:700, color: homeWin?'#6bfb9a':'#f87171' }}>{homeWin?'W':homeScore===awayScore?'D':'L'}</span>
              <span style={{ fontSize:'10px', color:'rgba(188,202,187,0.3)' }}>{match.home_short}</span>
            </div>
            <div style={{ textAlign:'center' }}>
              <span style={{ fontSize:'13px', color:'#f0f0f0', fontWeight:700, fontVariantNumeric:'tabular-nums' }}>{homeScore} : {awayScore}</span>
              <p style={{ fontSize:'9px', color:'rgba(188,202,187,0.3)', margin:'1px 0 0' }}>{dateStr}</p>
            </div>
            <div style={{ display:'flex', alignItems:'center', gap:'6px', justifyContent:'flex-end' }}>
              <span style={{ fontSize:'10px', color:'rgba(188,202,187,0.3)' }}>{match.away_short}</span>
              <span style={{ fontSize:'11px', fontWeight:700, color: !homeWin?'#6bfb9a':'#f87171' }}>{!homeWin?'W':homeScore===awayScore?'D':'L'}</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* ── MatchupTab (Starting Pitcher + Team Rankings) ───── */
function MatchupTab({ match, isSoccer, pitchers, batters, hasPitchers }) {
  const [selectedTeam, setSelectedTeam] = useState(match?.away_team_id);
  const homePitcher = pitchers?.find(p => p.team_id === match.home_team_id);
  const awayPitcher = pitchers?.find(p => p.team_id === match.away_team_id);
  const isSelectedHome = selectedTeam === match.home_team_id;
  const selectedPitcher = isSelectedHome ? homePitcher : awayPitcher;
  const opposingPitcher = isSelectedHome ? awayPitcher : homePitcher;
  const selectedBatters = batters.filter(b => b.team_id === selectedTeam);

  const stats = [
    { stat:'Points',   home:'118.2',hRank:'6th', away:'115.1',aRank:'14th' },
    { stat:'FG %',     home:'47.3', hRank:'13th',away:'47.7', aRank:'22nd' },
    { stat:'3-Point %',home:'36.9', hRank:'6th', away:'35.3', aRank:'18th' },
    { stat:'Rebounds', home:'44.8', hRank:'10th',away:'43.2', aRank:'18th' },
    { stat:'Assists',  home:'28.4', hRank:'5th', away:'25.1', aRank:'20th' },
    { stat:'Turnovers',home:'13.5', hRank:'7th', away:'14.3', aRank:'15th' },
  ];

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:'20px' }}>

      {/* Starting Pitcher */}
      {hasPitchers && (
        <div>
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'10px' }}>
            <h4 style={{ fontSize:'13px', fontWeight:700, color:'#f0f0f0', margin:0 }}>Starting Pitcher</h4>
            <div style={{ display:'flex', gap:'5px' }}>
              {[match.away_team_id, match.home_team_id].map((tid,i) => {
                const short = i===0?match.away_short:match.home_short;
                const active = selectedTeam===tid;
                return (
                  <button key={tid} onClick={() => setSelectedTeam(tid)} style={{
                    display:'flex', alignItems:'center', gap:'5px', padding:'3px 9px', borderRadius:'99px', border:'1px solid', cursor:'pointer', transition:'all 120ms', fontSize:'11px', fontWeight:700,
                    background: active?'rgba(255,255,255,0.07)':'transparent',
                    borderColor: active?'rgba(255,255,255,0.15)':'rgba(255,255,255,0.07)',
                    color: active?'#f0f0f0':'rgba(188,202,187,0.4)',
                  }}>
                    <TeamBadge short={short} size={16} radius="full" />
                    {short}
                  </button>
                );
              })}
            </div>
          </div>

          {selectedPitcher ? (
            <div className="lit-card" style={{ padding:'14px 16px' }}>
              <div style={{ display:'flex', alignItems:'center', gap:'10px', marginBottom:'12px' }}>
                <div style={{ width:'32px', height:'32px', borderRadius:'50%', background:'rgba(255,255,255,0.06)', border:'1px solid rgba(255,255,255,0.08)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                  <span style={{ fontSize:'10px', fontWeight:700, color:'#bccabb' }}>{selectedPitcher.full_name.split(' ').map(w=>w[0]).slice(0,2).join('')}</span>
                </div>
                <div style={{ flex:1 }}>
                  <div style={{ display:'flex', alignItems:'center', gap:'6px' }}>
                    <span style={{ fontSize:'13px', color:'#f0f0f0', fontWeight:600 }}>{abbrevFirst(selectedPitcher.full_name)}</span>
                    {selectedPitcher.throws && <span style={{ fontSize:'10px', color:'rgba(188,202,187,0.4)', background:'rgba(255,255,255,0.05)', padding:'1px 5px', borderRadius:'4px' }}>{selectedPitcher.throws}HP</span>}
                    {/* external link icon */}
                    <span className="material-symbols-outlined" style={{ fontSize:'13px', color:'rgba(188,202,187,0.2)', fontVariationSettings:"'FILL' 0,'wght' 300" }}>open_in_new</span>
                  </div>
                </div>
                <div style={{ display:'flex', gap:'12px', fontSize:'10px', color:'rgba(188,202,187,0.3)' }}>
                  <span>{selectedPitcher.season_year}</span>
                  <span>vs. {isSelectedHome?match.away_short:match.home_short}</span>
                </div>
              </div>

              {[
                { label:'Record',           s:`${selectedPitcher.season_wins}-${selectedPitcher.season_losses}`, v:`${selectedPitcher.vs_wins??0}-${selectedPitcher.vs_losses??0}`, better:'neutral' },
                { label:'Earned runs per 9',s:fmt(selectedPitcher.season_era),    v:fmt(selectedPitcher.vs_era),    better:'lower'   },
                { label:'Innings pitched',  s:fmt(selectedPitcher.season_ip,1),   v:fmt(selectedPitcher.vs_ip,1),   better:'neutral' },
                { label:'Hits per 9',       s:fmt(selectedPitcher.season_hits_per9),v:fmt(selectedPitcher.vs_hits_per9),better:'lower'},
                { label:'Strikeouts per 9', s:fmt(selectedPitcher.season_k_per9), v:fmt(selectedPitcher.vs_k_per9), better:'higher'  },
                { label:'WHIP',             s:fmt(selectedPitcher.season_whip),   v:fmt(selectedPitcher.vs_whip),   better:'lower'   },
              ].map((r,i) => {
                const tone = compareTone(r.s, r.v, r.better);
                return (
                  <div key={i} style={{ display:'flex', alignItems:'center', padding:'7px 0', borderTop:'1px solid rgba(255,255,255,0.04)' }}>
                    <div style={{ flex:1, fontSize:'12px', color:'#bccabb' }}>{r.label}</div>
                    <div style={{ width:'52px', textAlign:'right', fontSize:'12px', color:'#f0f0f0', fontWeight:600, fontVariantNumeric:'tabular-nums' }}>{r.s}</div>
                    <div style={{ width:'52px', textAlign:'right', fontSize:'12px', fontWeight:600, fontVariantNumeric:'tabular-nums', color: tone==='good'?'#6bfb9a':tone==='bad'?'#f87171':'rgba(188,202,187,0.35)' }}>{r.v === '0.00' ? '-' : r.v}</div>
                  </div>
                );
              })}
              <div style={{ marginTop:'10px', paddingTop:'8px', borderTop:'1px solid rgba(255,255,255,0.04)', display:'flex', alignItems:'center', gap:'6px' }}>
                <div style={{ width:'10px', height:'10px', borderRadius:'2px', background:'#6bfb9a' }} />
                <span style={{ fontSize:'10px', color:'rgba(188,202,187,0.35)' }}>— compared to season stats</span>
              </div>
            </div>
          ) : (
            <div className="lit-card" style={{ padding:'16px', textAlign:'center', fontSize:'12px', color:'rgba(188,202,187,0.3)' }}>No pitcher announced yet</div>
          )}

          {/* Bullpen stats if batters exist */}
          {selectedBatters.length > 0 && opposingPitcher && (
            <BatterBlock batters={selectedBatters} pitcherThrows={opposingPitcher.throws} teamShort={isSelectedHome?match.home_short:match.away_short} season={opposingPitcher.season_year} />
          )}
        </div>
      )}

      {/* Team Rankings */}
      <div>
        <h4 style={{ fontSize:'13px', fontWeight:700, color:'#f0f0f0', margin:'0 0 10px' }}>Team Rankings ({new Date().getFullYear()})</h4>
        <div className="lit-card" style={{ overflow:'hidden' }}>
          <table style={{ width:'100%', borderCollapse:'collapse' }}>
            <thead>
              <tr style={{ fontSize:'9px', color:'rgba(188,202,187,0.3)', textTransform:'uppercase', letterSpacing:'0.08em' }}>
                <th style={{ textAlign:'left',   padding:'8px 12px' }}>Avg.</th>
                <th style={{ textAlign:'left',   padding:'8px 8px'  }}>Rank</th>
                <th style={{ textAlign:'center', padding:'8px 8px'  }}>Stat</th>
                <th style={{ textAlign:'right',  padding:'8px 8px'  }}>Rank</th>
                <th style={{ textAlign:'right',  padding:'8px 12px' }}>Avg.</th>
              </tr>
            </thead>
            <tbody>
              {stats.map((row,i) => {
                const hV = parseFloat(row.home), aV = parseFloat(row.away);
                const inv = row.stat==='Turnovers';
                const hB = inv?hV<aV:hV>aV;
                return (
                  <tr key={i} style={{ borderTop:'1px solid rgba(255,255,255,0.04)' }}>
                    <td style={{ padding:'9px 12px', fontSize:'12px', fontWeight:700, fontVariantNumeric:'tabular-nums', color: hB?'#6bfb9a':'#f0f0f0' }}>{row.home}</td>
                    <td style={{ padding:'9px 8px',  fontSize:'10px', color:'rgba(188,202,187,0.3)' }}>{row.hRank}</td>
                    <td style={{ padding:'9px 8px',  fontSize:'11px', color:'#bccabb', textAlign:'center', fontWeight:500 }}>{row.stat}</td>
                    <td style={{ padding:'9px 8px',  fontSize:'10px', color:'rgba(188,202,187,0.3)', textAlign:'right' }}>{row.aRank}</td>
                    <td style={{ padding:'9px 12px', fontSize:'12px', fontWeight:700, fontVariantNumeric:'tabular-nums', textAlign:'right', color: !hB?'#6bfb9a':'#f0f0f0' }}>{row.away}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

/* ── BatterBlock ─────────────────────────────────────── */
function BatterBlock({ batters, pitcherThrows, teamShort, season }) {
  const [tab, setTab] = useState('split');
  const isRhp = pitcherThrows === 'R';
  const splitLabel = isRhp ? 'vs. RHP' : 'vs. LHP';
  const rows = batters.slice().sort((a,b)=>(b.season_ab||0)-(a.season_ab||0)).slice(0,8).map(b => {
    const split = isRhp
      ? { ab:b.vr_ab, avg:b.vr_avg, hr:b.vr_hr, rbi:b.vr_rbi, ops:b.vr_ops }
      : { ab:b.vl_ab, avg:b.vl_avg, hr:b.vl_hr, rbi:b.vl_rbi, ops:b.vl_ops };
    const overall = { ab:b.season_ab, avg:b.season_avg, hr:b.season_hr, rbi:b.season_rbi, ops:b.season_ops };
    return { b, overall, split };
  });
  const pStats = r => tab==='overall' ? r.overall : r.split;

  return (
    <div className="lit-card" style={{ overflow:'hidden', marginTop:'12px' }}>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'12px 14px 6px' }}>
        <span style={{ fontSize:'13px', fontWeight:700, color:'#f0f0f0' }}>Bullpen Stats</span>
        <span style={{ fontSize:'9px', fontWeight:700, color:'#f0f0f0', background:'rgba(255,255,255,0.06)', border:'1px solid rgba(255,255,255,0.08)', borderRadius:'99px', padding:'2px 8px' }}>{teamShort}</span>
      </div>
      <div style={{ display:'flex', borderBottom:'1px solid rgba(255,255,255,0.04)', padding:'0 14px' }}>
        {[['overall',season],['split',`${splitLabel}`]].map(([t,lbl]) => (
          <button key={t} onClick={() => setTab(t)} style={{
            padding:'6px 0', marginRight:'16px', fontSize:'11px', fontWeight:tab===t?600:500,
            background:'none', border:'none', cursor:'pointer',
            borderBottom:tab===t?'2px solid #f0f0f0':'2px solid transparent',
            color:tab===t?'#f0f0f0':'rgba(188,202,187,0.35)',
            marginBottom:'-1px', whiteSpace:'nowrap', transition:'color 120ms',
          }}>{lbl}</button>
        ))}
      </div>
      <div style={{ display:'grid', gridTemplateColumns:'1.4fr 0.5fr 0.6fr 0.4fr 0.4fr 0.7fr', gap:'4px', padding:'8px 14px 4px', fontSize:'9px', fontWeight:700, color:'rgba(188,202,187,0.3)', textTransform:'uppercase', letterSpacing:'0.08em' }}>
        <div/><div style={{textAlign:'right'}}>AB</div><div style={{textAlign:'right'}}>AVG</div><div style={{textAlign:'right'}}>HR</div><div style={{textAlign:'right'}}>RBI</div><div style={{textAlign:'right'}}>OPS</div>
      </div>
      <div style={{ padding:'0 14px 10px' }}>
        {rows.map((r,i) => {
          const s = pStats(r);
          return (
            <div key={i} style={{ display:'grid', gridTemplateColumns:'1.4fr 0.5fr 0.6fr 0.4fr 0.4fr 0.7fr', gap:'4px', alignItems:'center', padding:'7px 0', borderTop:'1px solid rgba(255,255,255,0.04)', fontSize:'12px' }}>
              <div style={{ display:'flex', alignItems:'center', gap:'6px', minWidth:0 }}>
                <div style={{ width:'16px', height:'16px', borderRadius:'50%', background:'rgba(255,255,255,0.06)', flexShrink:0 }} />
                <span style={{ color:'#f0f0f0', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{shortName(r.b.full_name)}</span>
              </div>
              <div style={{ textAlign:'right', color:'rgba(188,202,187,0.4)', fontVariantNumeric:'tabular-nums' }}>{s.ab??'-'}</div>
              <div style={{ textAlign:'right', fontWeight:600, fontVariantNumeric:'tabular-nums', color:'#f0f0f0' }}>{fmtAvg(s.avg)}</div>
              <div style={{ textAlign:'right', fontWeight:600, fontVariantNumeric:'tabular-nums', color:'#f0f0f0' }}>{s.hr??'-'}</div>
              <div style={{ textAlign:'right', fontWeight:600, fontVariantNumeric:'tabular-nums', color:'#f0f0f0' }}>{s.rbi??'-'}</div>
              <div style={{ textAlign:'right', fontWeight:600, fontVariantNumeric:'tabular-nums', color:'#f0f0f0' }}>{fmtAvg(s.ops)}</div>
            </div>
          );
        })}
        {!rows.length && <p style={{ fontSize:'12px', color:'#bccabb', textAlign:'center', padding:'12px 0' }}>No batter data</p>}
      </div>
    </div>
  );
}

/* ── InjuriesTab ─────────────────────────────────────── */
function InjuriesTab({ injuries }) {
  if (!injuries?.length) return (
    <div style={{ padding:'24px', textAlign:'center', fontSize:'12px', color:'rgba(188,202,187,0.3)' }}>No injury reports</div>
  );
  return (
    <div style={{ display:'flex', flexDirection:'column', gap:'12px' }}>
      {['home','away'].map(side => {
        const teamInjuries = injuries; // backend doesn't split by side, show all
        return (
          <div className="lit-card" style={{ overflow:'hidden' }} key={side}>
            {injuries.map((inj,i) => (
              <div key={i} style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'11px 14px', borderTop: i>0?'1px solid rgba(255,255,255,0.04)':'none' }}>
                <div style={{ display:'flex', alignItems:'center', gap:'10px' }}>
                  <TeamBadge short={inj.team_short} size={24} radius="full" />
                  <div>
                    <p style={{ fontSize:'13px', color:'#f0f0f0', fontWeight:500, margin:0 }}>{inj.player_name}</p>
                    <p style={{ fontSize:'10px', color:'rgba(188,202,187,0.35)', margin:'1px 0 0' }}>{inj.position} · {inj.injury_type}</p>
                  </div>
                </div>
                <StatusBadge status={inj.status} />
              </div>
            ))}
          </div>
        );
        return null;
      }).slice(0,1)}
    </div>
  );
}

/* ── InsightsTab ─────────────────────────────────────── */
function InsightsTab({ match, homeWinPct, awayWinPct, h2h, homeRecord, awayRecord }) {
  const h2hHomeWins = (h2h||[]).filter(g => { const a = g.team_a_id===match.home_team_id; return a?g.score_a>g.score_b:g.score_b>g.score_a; }).length;
  const h2hTotal = h2h?.length||0;
  const insights = [
    { type: homeWinPct>awayWinPct?'positive':'neutral', text:`${match.home_team} has won ${homeWinPct}% of their last 10 games (${homeRecord} overall).` },
    { type: awayWinPct>homeWinPct?'positive':'neutral', text:`${match.away_team} has won ${awayWinPct}% of their last 10 games (${awayRecord} overall).` },
    h2hTotal>0&&{ type: h2hHomeWins>h2hTotal/2?'positive':'warning', text:`${match.home_team} has won ${h2hHomeWins} of the last ${h2hTotal} H2H matchups.` },
    homeWinPct>=60&&{ type:'positive', text:`${match.home_short} is on a hot streak with a ${homeWinPct}% win rate recently.` },
    awayWinPct<=40&&{ type:'warning',  text:`${match.away_short} has been struggling — only ${awayWinPct}% wins in last 10.` },
    { type:'neutral', text:`This match is at ${match.venue}. Home teams win ~55% of games.` },
  ].filter(Boolean);
  const iconMap = { positive:'trending_up', warning:'trending_down', neutral:'bar_chart' };
  const colMap  = { positive:'#6bfb9a', warning:'#f87171', neutral:'rgba(188,202,187,0.3)' };
  const bgMap   = { positive:'rgba(107,251,154,0.05)', warning:'rgba(248,113,113,0.05)', neutral:'rgba(255,255,255,0.02)' };
  const bdrMap  = { positive:'rgba(107,251,154,0.12)', warning:'rgba(248,113,113,0.12)', neutral:'rgba(255,255,255,0.05)' };
  return (
    <div style={{ display:'flex', flexDirection:'column', gap:'8px' }}>
      <h3 style={{ fontSize:'13px', fontWeight:700, color:'#f0f0f0', margin:'0 0 4px' }}>Key Insights</h3>
      {insights.map((ins,i) => (
        <div key={i} style={{ padding:'11px 13px', borderRadius:'10px', background:bgMap[ins.type], border:`1px solid ${bdrMap[ins.type]}`, fontSize:'12px', color:'#bccabb', lineHeight:1.5, display:'flex', gap:'8px' }}>
          <span className="material-symbols-outlined" style={{ fontSize:'14px', color:colMap[ins.type], flexShrink:0, marginTop:'1px', fontVariationSettings:"'FILL' 0,'wght' 300" }}>{iconMap[ins.type]}</span>
          {ins.text}
        </div>
      ))}
    </div>
  );
}

/* ── StatusBadge ─────────────────────────────────────── */
function StatusBadge({ status }) {
  const m = { out:{c:'#f87171',bg:'rgba(248,113,113,0.1)',l:'OUT'}, doubtful:{c:'#facc15',bg:'rgba(250,204,21,0.1)',l:'DTD'}, questionable:{c:'#fb923c',bg:'rgba(251,146,60,0.1)',l:'GTD'}, probable:{c:'#6bfb9a',bg:'rgba(107,251,154,0.1)',l:'PROB'} };
  const s = m[status]||{c:'rgba(188,202,187,0.3)',bg:'rgba(255,255,255,0.05)',l:status};
  return <span style={{ fontSize:'9px', fontWeight:700, color:s.c, background:s.bg, padding:'3px 7px', borderRadius:'5px' }}>{s.l}</span>;
}

/* ── Helpers ─────────────────────────────────────────── */
function fmtAvg(v) { if(!v&&v!==0) return '-'; const n=parseFloat(v); return isNaN(n)?'-':n.toFixed(3).replace(/^0\./,'.'); }
function shortName(f) { const p=(f||'').split(' '); return p.length<2?f:`${p[0][0]}. ${p.slice(1).join(' ')}`; }
function fmt(v,d=2) { if(v==null||v===''||isNaN(parseFloat(v))) return '0.00'; return parseFloat(v).toFixed(d); }
function abbrevFirst(f) { const p=f.split(' '); return p.length<2?f:`${p[0][0]}. ${p.slice(1).join(' ')}`; }
function compareTone(s,v,b) { if(b==='neutral') return 'neutral'; const sv=parseFloat(s),vv=parseFloat(v); if(isNaN(sv)||isNaN(vv)||sv===vv) return 'neutral'; return b==='lower'?(vv<sv?'good':'bad'):(vv>sv?'good':'bad'); }
