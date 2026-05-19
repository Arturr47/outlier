-- Partidos de ejemplo para demo/testing
-- Liga MX
INSERT INTO matches (league_id, home_team_id, away_team_id, match_date, status, venue) VALUES
  (1, 1, 2, '2026-04-04 21:00:00', 'scheduled', 'Estadio Azteca'),
  (1, 3, 4, '2026-04-04 19:00:00', 'scheduled', 'Estadio Ciudad de los Deportes'),
  (1, 5, 6, '2026-04-05 20:00:00', 'scheduled', 'Estadio Universitario'),
  (1, 7, 8, '2026-04-05 18:00:00', 'scheduled', 'Estadio Corona'),
  (1, 9, 10, '2026-04-06 17:00:00', 'scheduled', 'Estadio Nemesio Díez'),
  (1, 11, 12, '2026-04-06 19:00:00', 'scheduled', 'Estadio Hidalgo');

-- NBA
INSERT INTO matches (league_id, home_team_id, away_team_id, match_date, status, venue) VALUES
  (2, 13, 14, '2026-04-03 22:30:00', 'scheduled', 'Crypto.com Arena'),
  (2, 15, 16, '2026-04-03 20:00:00', 'scheduled', 'TD Garden'),
  (2, 17, 18, '2026-04-04 21:00:00', 'scheduled', 'American Airlines Center'),
  (2, 19, 20, '2026-04-04 20:00:00', 'scheduled', 'Fiserv Forum');

-- MLB
INSERT INTO matches (league_id, home_team_id, away_team_id, match_date, status, venue) VALUES
  (3, 21, 22, '2026-04-03 19:10:00', 'scheduled', 'Dodger Stadium'),
  (3, 23, 24, '2026-04-04 20:05:00', 'scheduled', 'Minute Maid Park'),
  (3, 25, 26, '2026-04-05 16:40:00', 'scheduled', 'Petco Park');

-- NHL
INSERT INTO matches (league_id, home_team_id, away_team_id, match_date, status, venue) VALUES
  (4, 27, 28, '2026-04-03 22:00:00', 'scheduled', 'T-Mobile Arena'),
  (4, 29, 30, '2026-04-04 21:00:00', 'scheduled', 'Rogers Place'),
  (4, 31, 32, '2026-04-05 19:00:00', 'scheduled', 'American Airlines Center');

-- Momios de ejemplo
-- Liga MX: América vs Chivas
INSERT INTO odds (match_id, sportsbook, bet_type, home_odds, away_odds, draw_odds) VALUES
  (1, 'Caliente', 'moneyline', -150, 320, 250),
  (1, 'Bet365', 'moneyline', -145, 310, 260),
  (1, 'Betcris', 'moneyline', -155, 330, 245);
INSERT INTO odds (match_id, sportsbook, bet_type, spread_value, home_odds, away_odds) VALUES
  (1, 'Caliente', 'spread', -1.0, -110, -110),
  (1, 'Bet365', 'spread', -1.0, -105, -115);
INSERT INTO odds (match_id, sportsbook, bet_type, total_value, over_odds, under_odds) VALUES
  (1, 'Caliente', 'over_under', 2.5, -120, 100),
  (1, 'Bet365', 'over_under', 2.5, -115, -105);

-- Liga MX: Cruz Azul vs Monterrey
INSERT INTO odds (match_id, sportsbook, bet_type, home_odds, away_odds, draw_odds) VALUES
  (2, 'Caliente', 'moneyline', 110, 180, 240),
  (2, 'Bet365', 'moneyline', 115, 175, 245);

-- NBA: Lakers vs Warriors
INSERT INTO odds (match_id, sportsbook, bet_type, home_odds, away_odds) VALUES
  (7, 'Caliente', 'moneyline', -130, 110),
  (7, 'Bet365', 'moneyline', -125, 105),
  (7, 'Betcris', 'moneyline', -135, 115);
INSERT INTO odds (match_id, sportsbook, bet_type, spread_value, home_odds, away_odds) VALUES
  (7, 'Caliente', 'spread', -2.5, -110, -110),
  (7, 'Bet365', 'spread', -3.0, -105, -115);
INSERT INTO odds (match_id, sportsbook, bet_type, total_value, over_odds, under_odds) VALUES
  (7, 'Caliente', 'over_under', 224.5, -110, -110),
  (7, 'Bet365', 'over_under', 225.0, -115, -105);

-- NBA: Celtics vs Heat
INSERT INTO odds (match_id, sportsbook, bet_type, home_odds, away_odds) VALUES
  (8, 'Caliente', 'moneyline', -200, 170),
  (8, 'Bet365', 'moneyline', -195, 165);

-- MLB: Dodgers vs Yankees
INSERT INTO odds (match_id, sportsbook, bet_type, home_odds, away_odds) VALUES
  (11, 'Caliente', 'moneyline', -160, 140),
  (11, 'Bet365', 'moneyline', -155, 135);

-- NHL: Golden Knights vs Panthers
INSERT INTO odds (match_id, sportsbook, bet_type, home_odds, away_odds) VALUES
  (14, 'Caliente', 'moneyline', -140, 120),
  (14, 'Bet365', 'moneyline', -135, 115);
INSERT INTO odds (match_id, sportsbook, bet_type, total_value, over_odds, under_odds) VALUES
  (14, 'Caliente', 'over_under', 5.5, -110, -110),
  (14, 'Bet365', 'over_under', 5.5, -120, 100);

-- H2H: América vs Chivas (últimos 5)
INSERT INTO h2h_records (team_a_id, team_b_id, match_date, score_a, score_b, league_id) VALUES
  (1, 2, '2026-01-15', 2, 1, 1),
  (2, 1, '2025-09-20', 0, 0, 1),
  (1, 2, '2025-04-12', 3, 2, 1),
  (2, 1, '2024-11-08', 1, 2, 1),
  (1, 2, '2024-05-25', 1, 0, 1);

-- H2H: Lakers vs Warriors (últimos 5)
INSERT INTO h2h_records (team_a_id, team_b_id, match_date, score_a, score_b, league_id) VALUES
  (13, 14, '2026-02-10', 118, 112, 2),
  (14, 13, '2025-12-25', 121, 115, 2),
  (13, 14, '2025-10-30', 105, 110, 2),
  (14, 13, '2025-03-18', 130, 125, 2),
  (13, 14, '2024-11-22', 108, 102, 2);

-- Jugadores de ejemplo
INSERT INTO players (team_id, name, position, number, status) VALUES
  -- América
  (1, 'Henry Martín', 'Delantero', 21, 'active'),
  (1, 'Alejandro Zendejas', 'Mediocampista', 10, 'active'),
  (1, 'Luis Fuentes', 'Defensa', 3, 'injured'),
  -- Chivas
  (2, 'Chicharito Hernández', 'Delantero', 14, 'active'),
  (2, 'Fernando Beltrán', 'Mediocampista', 20, 'active'),
  -- Lakers
  (13, 'LeBron James', 'SF', 23, 'active'),
  (13, 'Anthony Davis', 'PF/C', 3, 'active'),
  -- Warriors
  (14, 'Stephen Curry', 'PG', 30, 'active'),
  (14, 'Klay Thompson', 'SG', 11, 'active');

-- Props de ejemplo: NBA Lakers vs Warriors
INSERT INTO player_props (match_id, player_id, prop_type, line_value, over_odds, under_odds, sportsbook, hit_rate, last_5_avg, last_10_avg) VALUES
  (7, 6, 'points', 25.5, -115, -105, 'Caliente', 62.5, 27.4, 26.8),
  (7, 6, 'assists', 7.5, -110, -110, 'Caliente', 55.0, 8.2, 7.6),
  (7, 6, 'rebounds', 7.5, 100, -120, 'Caliente', 48.0, 7.1, 7.8),
  (7, 7, 'points', 24.5, -110, -110, 'Bet365', 58.0, 25.6, 24.2),
  (7, 8, 'points', 28.5, -105, -115, 'Caliente', 52.0, 29.2, 28.1),
  (7, 8, 'three_pointers', 4.5, 110, -130, 'Bet365', 45.0, 4.8, 4.3);

-- Lesiones de ejemplo
INSERT INTO injuries (player_id, team_id, injury_type, status, expected_return) VALUES
  (3, 1, 'Esguince de tobillo', 'out', '2026-04-15'),
  (7, 13, 'Molestia en rodilla', 'probable', '2026-04-03');
