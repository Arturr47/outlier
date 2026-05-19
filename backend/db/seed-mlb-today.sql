-- MLB: Partidos para hoy (2026-04-15) con stats actualizadas
-- Asume que los equipos 21-26 ya existen (Dodgers, Yankees, Astros, Braves, Padres, Phillies)

BEGIN;

-- Limpiar datos MLB previos (mantenemos la estructura de teams/leagues)
DELETE FROM team_games WHERE team_id BETWEEN 21 AND 26;
DELETE FROM public_betting WHERE match_id IN (SELECT id FROM matches WHERE league_id = 3);
DELETE FROM odds WHERE match_id IN (SELECT id FROM matches WHERE league_id = 3);
DELETE FROM player_props WHERE match_id IN (SELECT id FROM matches WHERE league_id = 3);
DELETE FROM lineups WHERE match_id IN (SELECT id FROM matches WHERE league_id = 3);
DELETE FROM h2h_records WHERE league_id = 3;
DELETE FROM matches WHERE league_id = 3;

-- ========================================
-- STATS ACTUALIZADAS (al 14-abr-2026, ~15 juegos)
-- ========================================
UPDATE teams SET wins=11, losses=4, ties=0, win_pct=0.733, streak='W3' WHERE id=21; -- Dodgers
UPDATE teams SET wins=9,  losses=6, ties=0, win_pct=0.600, streak='L1' WHERE id=22; -- Yankees
UPDATE teams SET wins=8,  losses=7, ties=0, win_pct=0.533, streak='W2' WHERE id=23; -- Astros
UPDATE teams SET wins=10, losses=5, ties=0, win_pct=0.667, streak='W4' WHERE id=24; -- Braves
UPDATE teams SET wins=9,  losses=6, ties=0, win_pct=0.600, streak='L2' WHERE id=25; -- Padres
UPDATE teams SET wins=7,  losses=8, ties=0, win_pct=0.467, streak='W1' WHERE id=26; -- Phillies

-- ========================================
-- PARTIDOS DE HOY (2026-04-15)
-- ========================================
INSERT INTO matches (league_id, home_team_id, away_team_id, match_date, status, venue) VALUES
  (3, 21, 25, '2026-04-15 22:10:00', 'scheduled', 'Dodger Stadium'),      -- LAD vs SD
  (3, 22, 23, '2026-04-15 23:05:00', 'scheduled', 'Yankee Stadium'),      -- NYY vs HOU
  (3, 24, 26, '2026-04-15 23:20:00', 'scheduled', 'Truist Park');         -- ATL vs PHI

-- Capturamos IDs reales
DO $$
DECLARE
  m1 INT; m2 INT; m3 INT;
BEGIN
  SELECT id INTO m1 FROM matches WHERE league_id=3 AND home_team_id=21 AND DATE(match_date)='2026-04-15';
  SELECT id INTO m2 FROM matches WHERE league_id=3 AND home_team_id=22 AND DATE(match_date)='2026-04-15';
  SELECT id INTO m3 FROM matches WHERE league_id=3 AND home_team_id=24 AND DATE(match_date)='2026-04-15';

  -- ODDS
  -- Match 1: Dodgers (home) vs Padres (away) — LAD favorito
  INSERT INTO odds (match_id, sportsbook, bet_type, home_odds, away_odds) VALUES
    (m1, 'Caliente', 'moneyline', 1.67, 2.30),
    (m1, 'Bet365',   'moneyline', 1.69, 2.25),
    (m1, 'Betcris',  'moneyline', 1.65, 2.35);
  INSERT INTO odds (match_id, sportsbook, bet_type, spread_value, home_odds, away_odds) VALUES
    (m1, 'Caliente', 'spread', -1.5, 2.15, 1.74),
    (m1, 'Bet365',   'spread', -1.5, 2.20, 1.71);
  INSERT INTO odds (match_id, sportsbook, bet_type, total_value, over_odds, under_odds) VALUES
    (m1, 'Caliente', 'over_under', 8.5, 1.87, 1.95),
    (m1, 'Bet365',   'over_under', 8.5, 1.91, 1.91);

  -- Match 2: Yankees (home) vs Astros (away) — NYY ligero favorito
  INSERT INTO odds (match_id, sportsbook, bet_type, home_odds, away_odds) VALUES
    (m2, 'Caliente', 'moneyline', 1.83, 2.05),
    (m2, 'Bet365',   'moneyline', 1.80, 2.10),
    (m2, 'Betcris',  'moneyline', 1.85, 2.00);
  INSERT INTO odds (match_id, sportsbook, bet_type, spread_value, home_odds, away_odds) VALUES
    (m2, 'Caliente', 'spread', -1.5, 2.45, 1.60);
  INSERT INTO odds (match_id, sportsbook, bet_type, total_value, over_odds, under_odds) VALUES
    (m2, 'Caliente', 'over_under', 9.0, 1.91, 1.91),
    (m2, 'Bet365',   'over_under', 9.0, 1.95, 1.87);

  -- Match 3: Braves (home) vs Phillies (away) — ATL favorito
  INSERT INTO odds (match_id, sportsbook, bet_type, home_odds, away_odds) VALUES
    (m3, 'Caliente', 'moneyline', 1.63, 2.40),
    (m3, 'Bet365',   'moneyline', 1.65, 2.35);
  INSERT INTO odds (match_id, sportsbook, bet_type, spread_value, home_odds, away_odds) VALUES
    (m3, 'Caliente', 'spread', -1.5, 2.05, 1.80);
  INSERT INTO odds (match_id, sportsbook, bet_type, total_value, over_odds, under_odds) VALUES
    (m3, 'Caliente', 'over_under', 8.0, 1.87, 1.95),
    (m3, 'Bet365',   'over_under', 8.0, 1.83, 2.00);

  -- PUBLIC BETTING
  INSERT INTO public_betting (match_id, bet_type, home_pct_bets, away_pct_bets, home_pct_money, away_pct_money) VALUES
    (m1, 'moneyline', 68, 32, 72, 28),
    (m1, 'spread',    48, 52, 55, 45),
    (m1, 'over_under',62, 38, 60, 40),
    (m2, 'moneyline', 55, 45, 52, 48),
    (m2, 'spread',    42, 58, 40, 60),
    (m2, 'over_under',58, 42, 55, 45),
    (m3, 'moneyline', 62, 38, 58, 42),
    (m3, 'spread',    52, 48, 50, 50),
    (m3, 'over_under',45, 55, 48, 52);

  -- PLAYER PROPS para Dodgers vs Padres
  INSERT INTO player_props (match_id, player_id, prop_type, line_value, over_odds, under_odds, sportsbook, hit_rate, last_5_avg, last_10_avg) VALUES
    (m1, 32, 'hits',        1.5, 1.71, 2.15, 'Caliente', 72.0, 2.2, 1.9),
    (m1, 32, 'total_bases', 2.5, 1.87, 1.95, 'Bet365',   60.0, 3.1, 2.7),
    (m1, 33, 'hits',        1.5, 1.80, 2.05, 'Caliente', 64.0, 1.9, 1.7),
    (m1, 34, 'total_bases', 1.5, 1.91, 1.91, 'Caliente', 55.0, 1.8, 1.6);

  -- PLAYER PROPS Yankees vs Astros
  INSERT INTO player_props (match_id, player_id, prop_type, line_value, over_odds, under_odds, sportsbook, hit_rate, last_5_avg, last_10_avg) VALUES
    (m2, 35, 'hits',        1.5, 1.67, 2.20, 'Caliente', 70.0, 2.1, 1.8),
    (m2, 35, 'home_runs',   0.5, 2.80, 1.45, 'Bet365',   40.0, 0.6, 0.5),
    (m2, 36, 'total_bases', 2.5, 1.95, 1.87, 'Caliente', 58.0, 2.9, 2.6);

  -- H2H
  INSERT INTO h2h_records (team_a_id, team_b_id, match_date, score_a, score_b, league_id) VALUES
    -- Dodgers vs Padres
    (21, 25, '2026-04-07', 7, 4, 3),
    (25, 21, '2026-04-06', 2, 5, 3),
    (21, 25, '2026-04-05', 3, 6, 3),
    (25, 21, '2025-09-28', 8, 3, 3),
    (21, 25, '2025-09-27', 4, 2, 3),
    -- Yankees vs Astros
    (22, 23, '2025-10-12', 5, 3, 3),
    (23, 22, '2025-10-11', 7, 4, 3),
    (22, 23, '2025-07-22', 3, 6, 3),
    (23, 22, '2025-07-21', 2, 8, 3),
    (22, 23, '2025-04-18', 6, 5, 3),
    -- Braves vs Phillies
    (24, 26, '2025-09-30', 4, 2, 3),
    (26, 24, '2025-09-29', 3, 5, 3),
    (24, 26, '2025-08-15', 6, 4, 3),
    (26, 24, '2025-08-14', 5, 7, 3),
    (24, 26, '2025-05-20', 2, 3, 3);
END $$;

-- ========================================
-- LAST 10 GAMES (team_games) — actualizadas al 2026-04-14
-- ========================================

-- Dodgers (11-4, W3) — última racha buena
INSERT INTO team_games (team_id, opponent_id, game_date, is_home, team_score, opponent_score, result, league_id) VALUES
  (21, 25, '2026-04-14', true,  6, 3, 'W', 3),
  (21, 25, '2026-04-13', true,  4, 2, 'W', 3),
  (21, 25, '2026-04-12', true,  8, 5, 'W', 3),
  (21, 24, '2026-04-10', false, 3, 5, 'L', 3),
  (21, 24, '2026-04-09', false, 7, 4, 'W', 3),
  (21, 24, '2026-04-08', false, 5, 2, 'W', 3),
  (21, 23, '2026-04-06', true,  4, 7, 'L', 3),
  (21, 23, '2026-04-05', true,  6, 4, 'W', 3),
  (21, 22, '2026-04-03', false, 2, 5, 'L', 3),
  (21, 22, '2026-04-02', false, 8, 3, 'W', 3);

-- Padres (9-6, L2)
INSERT INTO team_games (team_id, opponent_id, game_date, is_home, team_score, opponent_score, result, league_id) VALUES
  (25, 21, '2026-04-14', false, 3, 6, 'L', 3),
  (25, 21, '2026-04-13', false, 2, 4, 'L', 3),
  (25, 21, '2026-04-12', false, 5, 8, 'L', 3),
  (25, 26, '2026-04-10', true,  7, 3, 'W', 3),
  (25, 26, '2026-04-09', true,  4, 2, 'W', 3),
  (25, 26, '2026-04-08', true,  5, 6, 'L', 3),
  (25, 22, '2026-04-06', false, 8, 4, 'W', 3),
  (25, 22, '2026-04-05', false, 3, 5, 'L', 3),
  (25, 23, '2026-04-03', true,  6, 2, 'W', 3),
  (25, 23, '2026-04-02', true,  4, 3, 'W', 3);

-- Yankees (9-6, L1)
INSERT INTO team_games (team_id, opponent_id, game_date, is_home, team_score, opponent_score, result, league_id) VALUES
  (22, 26, '2026-04-14', false, 4, 6, 'L', 3),
  (22, 26, '2026-04-13', false, 7, 3, 'W', 3),
  (22, 26, '2026-04-12', false, 5, 2, 'W', 3),
  (22, 24, '2026-04-10', true,  3, 5, 'L', 3),
  (22, 24, '2026-04-09', true,  6, 4, 'W', 3),
  (22, 24, '2026-04-08', true,  2, 7, 'L', 3),
  (22, 25, '2026-04-06', true,  4, 8, 'L', 3),
  (22, 25, '2026-04-05', true,  5, 3, 'W', 3),
  (22, 21, '2026-04-03', true,  5, 2, 'W', 3),
  (22, 21, '2026-04-02', true,  3, 8, 'L', 3);

-- Astros (8-7, W2)
INSERT INTO team_games (team_id, opponent_id, game_date, is_home, team_score, opponent_score, result, league_id) VALUES
  (23, 24, '2026-04-14', false, 5, 3, 'W', 3),
  (23, 24, '2026-04-13', false, 4, 2, 'W', 3),
  (23, 26, '2026-04-11', true,  3, 5, 'L', 3),
  (23, 26, '2026-04-10', true,  6, 4, 'W', 3),
  (23, 26, '2026-04-09', true,  2, 5, 'L', 3),
  (23, 25, '2026-04-07', false, 2, 6, 'L', 3),
  (23, 25, '2026-04-06', false, 5, 3, 'W', 3),
  (23, 21, '2026-04-05', false, 7, 4, 'W', 3),
  (23, 21, '2026-04-04', false, 4, 6, 'L', 3),
  (23, 22, '2026-04-02', false, 3, 5, 'L', 3);

-- Braves (10-5, W4)
INSERT INTO team_games (team_id, opponent_id, game_date, is_home, team_score, opponent_score, result, league_id) VALUES
  (24, 23, '2026-04-14', true,  3, 5, 'L', 3),
  (24, 23, '2026-04-13', true,  2, 4, 'L', 3),
  (24, 21, '2026-04-10', true,  5, 3, 'W', 3),
  (24, 21, '2026-04-09', true,  4, 7, 'L', 3),
  (24, 21, '2026-04-08', true,  2, 5, 'L', 3),
  (24, 22, '2026-04-06', false, 5, 3, 'W', 3),
  (24, 22, '2026-04-05', false, 7, 2, 'W', 3),
  (24, 26, '2026-04-04', true,  6, 4, 'W', 3),
  (24, 26, '2026-04-03', true,  8, 5, 'W', 3),
  (24, 26, '2026-04-02', true,  4, 2, 'W', 3);

-- Phillies (7-8, W1)
INSERT INTO team_games (team_id, opponent_id, game_date, is_home, team_score, opponent_score, result, league_id) VALUES
  (26, 22, '2026-04-14', true,  6, 4, 'W', 3),
  (26, 22, '2026-04-13', true,  3, 7, 'L', 3),
  (26, 22, '2026-04-12', true,  2, 5, 'L', 3),
  (26, 23, '2026-04-11', false, 5, 3, 'W', 3),
  (26, 23, '2026-04-10', false, 4, 6, 'L', 3),
  (26, 23, '2026-04-09', false, 5, 2, 'W', 3),
  (26, 25, '2026-04-07', false, 3, 7, 'L', 3),
  (26, 25, '2026-04-06', false, 2, 4, 'L', 3),
  (26, 25, '2026-04-05', false, 6, 5, 'W', 3),
  (26, 24, '2026-04-03', false, 5, 8, 'L', 3);

COMMIT;

-- Verificación
SELECT m.id, ht.short_name AS home, at.short_name AS away, m.match_date, m.venue
FROM matches m
JOIN teams ht ON m.home_team_id=ht.id
JOIN teams at ON m.away_team_id=at.id
WHERE m.league_id=3
ORDER BY m.match_date;
