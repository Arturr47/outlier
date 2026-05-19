-- Migration V2: Massive data expansion + new tables
-- Run with: PGPASSWORD=Artur47 psql -U postgres -d outlier_mexicano -f migration-v2.sql

-- ============================================
-- 1. ALTER TABLES: Add team records
-- ============================================
ALTER TABLE teams ADD COLUMN IF NOT EXISTS wins INTEGER DEFAULT 0;
ALTER TABLE teams ADD COLUMN IF NOT EXISTS losses INTEGER DEFAULT 0;
ALTER TABLE teams ADD COLUMN IF NOT EXISTS ties INTEGER DEFAULT 0;
ALTER TABLE teams ADD COLUMN IF NOT EXISTS win_pct DECIMAL(4,3) DEFAULT 0.000;
ALTER TABLE teams ADD COLUMN IF NOT EXISTS streak VARCHAR(10) DEFAULT '';

-- ============================================
-- 2. NEW TABLES
-- ============================================

-- Public Betting percentages per match
CREATE TABLE IF NOT EXISTS public_betting (
  id SERIAL PRIMARY KEY,
  match_id INTEGER REFERENCES matches(id),
  bet_type VARCHAR(50) NOT NULL, -- moneyline, spread, over_under
  home_pct_bets DECIMAL(5,2),
  away_pct_bets DECIMAL(5,2),
  draw_pct_bets DECIMAL(5,2),
  home_pct_money DECIMAL(5,2),
  away_pct_money DECIMAL(5,2),
  draw_pct_money DECIMAL(5,2),
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Lineups per match
CREATE TABLE IF NOT EXISTS lineups (
  id SERIAL PRIMARY KEY,
  match_id INTEGER REFERENCES matches(id),
  team_id INTEGER REFERENCES teams(id),
  player_id INTEGER REFERENCES players(id),
  is_starter BOOLEAN DEFAULT true,
  position_order INTEGER,
  minutes_projected DECIMAL(4,1),
  status VARCHAR(50) DEFAULT 'confirmed' -- confirmed, expected, questionable
);

-- Recent game results per team (separate from h2h, tracks each team's last N games)
CREATE TABLE IF NOT EXISTS team_games (
  id SERIAL PRIMARY KEY,
  team_id INTEGER REFERENCES teams(id),
  opponent_id INTEGER REFERENCES teams(id),
  game_date DATE NOT NULL,
  is_home BOOLEAN,
  team_score INTEGER,
  opponent_score INTEGER,
  result CHAR(1) NOT NULL, -- W, L, D
  league_id INTEGER REFERENCES leagues(id)
);

CREATE INDEX IF NOT EXISTS idx_public_betting_match ON public_betting(match_id);
CREATE INDEX IF NOT EXISTS idx_lineups_match ON lineups(match_id);
CREATE INDEX IF NOT EXISTS idx_team_games_team ON team_games(team_id);

-- ============================================
-- 3. UPDATE TEAM RECORDS
-- ============================================

-- Liga MX records (Clausura 2026)
UPDATE teams SET wins=10, losses=3, ties=4, win_pct=0.588, streak='W3' WHERE id=1;  -- América
UPDATE teams SET wins=8,  losses=5, ties=4, win_pct=0.471, streak='L1' WHERE id=2;  -- Chivas
UPDATE teams SET wins=11, losses=2, ties=4, win_pct=0.647, streak='W5' WHERE id=3;  -- Cruz Azul
UPDATE teams SET wins=9,  losses=4, ties=4, win_pct=0.529, streak='W1' WHERE id=4;  -- Monterrey
UPDATE teams SET wins=10, losses=4, ties=3, win_pct=0.588, streak='W2' WHERE id=5;  -- Tigres
UPDATE teams SET wins=6,  losses=7, ties=4, win_pct=0.353, streak='L2' WHERE id=6;  -- Pumas
UPDATE teams SET wins=5,  losses=8, ties=4, win_pct=0.294, streak='D1' WHERE id=7;  -- Santos
UPDATE teams SET wins=7,  losses=6, ties=4, win_pct=0.412, streak='W1' WHERE id=8;  -- León
UPDATE teams SET wins=9,  losses=5, ties=3, win_pct=0.529, streak='L1' WHERE id=9;  -- Toluca
UPDATE teams SET wins=4,  losses=9, ties=4, win_pct=0.235, streak='L3' WHERE id=10; -- Atlas
UPDATE teams SET wins=8,  losses=4, ties=5, win_pct=0.471, streak='D2' WHERE id=11; -- Pachuca
UPDATE teams SET wins=3,  losses=10, ties=4, win_pct=0.176, streak='L4' WHERE id=12; -- Puebla

-- NBA records (2025-26 season)
UPDATE teams SET wins=43, losses=33, ties=0, win_pct=0.566, streak='W2' WHERE id=13; -- Lakers
UPDATE teams SET wins=39, losses=37, ties=0, win_pct=0.513, streak='L1' WHERE id=14; -- Warriors
UPDATE teams SET wins=56, losses=20, ties=0, win_pct=0.737, streak='W4' WHERE id=15; -- Celtics
UPDATE teams SET wins=41, losses=35, ties=0, win_pct=0.539, streak='W1' WHERE id=16; -- Heat
UPDATE teams SET wins=48, losses=28, ties=0, win_pct=0.632, streak='W3' WHERE id=17; -- Mavericks
UPDATE teams SET wins=52, losses=24, ties=0, win_pct=0.684, streak='L1' WHERE id=18; -- Nuggets
UPDATE teams SET wins=46, losses=30, ties=0, win_pct=0.605, streak='W1' WHERE id=19; -- Bucks
UPDATE teams SET wins=44, losses=32, ties=0, win_pct=0.579, streak='L2' WHERE id=20; -- Suns

-- MLB records (early 2026 season)
UPDATE teams SET wins=5, losses=2, ties=0, win_pct=0.714, streak='W3' WHERE id=21; -- Dodgers
UPDATE teams SET wins=4, losses=3, ties=0, win_pct=0.571, streak='L1' WHERE id=22; -- Yankees
UPDATE teams SET wins=3, losses=4, ties=0, win_pct=0.429, streak='W1' WHERE id=23; -- Astros
UPDATE teams SET wins=4, losses=3, ties=0, win_pct=0.571, streak='W2' WHERE id=24; -- Braves
UPDATE teams SET wins=5, losses=2, ties=0, win_pct=0.714, streak='W2' WHERE id=25; -- Padres
UPDATE teams SET wins=3, losses=4, ties=0, win_pct=0.429, streak='L2' WHERE id=26; -- Phillies

-- NHL records (2025-26 season)
UPDATE teams SET wins=48, losses=22, ties=0, win_pct=0.686, streak='W3' WHERE id=27; -- Golden Knights
UPDATE teams SET wins=50, losses=20, ties=0, win_pct=0.714, streak='W5' WHERE id=28; -- Panthers
UPDATE teams SET wins=45, losses=25, ties=0, win_pct=0.643, streak='L1' WHERE id=29; -- Oilers
UPDATE teams SET wins=47, losses=23, ties=0, win_pct=0.671, streak='W2' WHERE id=30; -- Stars
UPDATE teams SET wins=42, losses=28, ties=0, win_pct=0.600, streak='W1' WHERE id=31; -- Rangers
UPDATE teams SET wins=49, losses=21, ties=0, win_pct=0.700, streak='W4' WHERE id=32; -- Avalanche

-- ============================================
-- 4. FIX ODDS TO DECIMAL FORMAT
-- ============================================
DELETE FROM odds;

-- Liga MX: América vs Chivas (match 1)
INSERT INTO odds (match_id, sportsbook, bet_type, home_odds, away_odds, draw_odds) VALUES
  (1, 'Caliente', 'moneyline', 1.67, 4.20, 3.50),
  (1, 'Bet365', 'moneyline', 1.69, 4.10, 3.60),
  (1, 'Betcris', 'moneyline', 1.65, 4.30, 3.45);
INSERT INTO odds (match_id, sportsbook, bet_type, spread_value, home_odds, away_odds) VALUES
  (1, 'Caliente', 'spread', -1.0, 1.91, 1.91),
  (1, 'Bet365', 'spread', -1.0, 1.95, 1.87);
INSERT INTO odds (match_id, sportsbook, bet_type, total_value, over_odds, under_odds) VALUES
  (1, 'Caliente', 'over_under', 2.5, 1.83, 2.00),
  (1, 'Bet365', 'over_under', 2.5, 1.87, 1.95);

-- Liga MX: Cruz Azul vs Monterrey (match 2)
INSERT INTO odds (match_id, sportsbook, bet_type, home_odds, away_odds, draw_odds) VALUES
  (2, 'Caliente', 'moneyline', 2.10, 2.80, 3.40),
  (2, 'Bet365', 'moneyline', 2.15, 2.75, 3.45),
  (2, 'Betcris', 'moneyline', 2.05, 2.85, 3.35);
INSERT INTO odds (match_id, sportsbook, bet_type, spread_value, home_odds, away_odds) VALUES
  (2, 'Caliente', 'spread', -0.5, 1.87, 1.95);
INSERT INTO odds (match_id, sportsbook, bet_type, total_value, over_odds, under_odds) VALUES
  (2, 'Caliente', 'over_under', 2.5, 1.95, 1.87);

-- Liga MX: Tigres vs Pumas (match 3)
INSERT INTO odds (match_id, sportsbook, bet_type, home_odds, away_odds, draw_odds) VALUES
  (3, 'Caliente', 'moneyline', 1.55, 5.00, 3.80),
  (3, 'Bet365', 'moneyline', 1.57, 4.80, 3.75),
  (3, 'Betcris', 'moneyline', 1.53, 5.20, 3.85);
INSERT INTO odds (match_id, sportsbook, bet_type, spread_value, home_odds, away_odds) VALUES
  (3, 'Caliente', 'spread', -1.5, 1.95, 1.87);
INSERT INTO odds (match_id, sportsbook, bet_type, total_value, over_odds, under_odds) VALUES
  (3, 'Caliente', 'over_under', 2.5, 1.91, 1.91);

-- Liga MX: Santos vs León (match 4)
INSERT INTO odds (match_id, sportsbook, bet_type, home_odds, away_odds, draw_odds) VALUES
  (4, 'Caliente', 'moneyline', 2.40, 2.60, 3.20),
  (4, 'Bet365', 'moneyline', 2.45, 2.55, 3.25);

-- Liga MX: Toluca vs Atlas (match 5)
INSERT INTO odds (match_id, sportsbook, bet_type, home_odds, away_odds, draw_odds) VALUES
  (5, 'Caliente', 'moneyline', 1.80, 3.60, 3.30),
  (5, 'Bet365', 'moneyline', 1.83, 3.50, 3.35);

-- Liga MX: Pachuca vs Puebla (match 6)
INSERT INTO odds (match_id, sportsbook, bet_type, home_odds, away_odds, draw_odds) VALUES
  (6, 'Caliente', 'moneyline', 1.50, 5.50, 4.00),
  (6, 'Bet365', 'moneyline', 1.52, 5.30, 3.90);

-- NBA: Lakers vs Warriors (match 7)
INSERT INTO odds (match_id, sportsbook, bet_type, home_odds, away_odds) VALUES
  (7, 'Caliente', 'moneyline', 1.77, 2.10),
  (7, 'Bet365', 'moneyline', 1.80, 2.05),
  (7, 'Betcris', 'moneyline', 1.74, 2.15);
INSERT INTO odds (match_id, sportsbook, bet_type, spread_value, home_odds, away_odds) VALUES
  (7, 'Caliente', 'spread', -2.5, 1.91, 1.91),
  (7, 'Bet365', 'spread', -3.0, 1.95, 1.87);
INSERT INTO odds (match_id, sportsbook, bet_type, total_value, over_odds, under_odds) VALUES
  (7, 'Caliente', 'over_under', 224.5, 1.91, 1.91),
  (7, 'Bet365', 'over_under', 225.0, 1.87, 1.95);

-- NBA: Celtics vs Heat (match 8)
INSERT INTO odds (match_id, sportsbook, bet_type, home_odds, away_odds) VALUES
  (8, 'Caliente', 'moneyline', 1.50, 2.70),
  (8, 'Bet365', 'moneyline', 1.51, 2.65),
  (8, 'Betcris', 'moneyline', 1.48, 2.75);
INSERT INTO odds (match_id, sportsbook, bet_type, spread_value, home_odds, away_odds) VALUES
  (8, 'Caliente', 'spread', -6.5, 1.91, 1.91);
INSERT INTO odds (match_id, sportsbook, bet_type, total_value, over_odds, under_odds) VALUES
  (8, 'Caliente', 'over_under', 215.5, 1.87, 1.95);

-- NBA: Mavericks vs Nuggets (match 9)
INSERT INTO odds (match_id, sportsbook, bet_type, home_odds, away_odds) VALUES
  (9, 'Caliente', 'moneyline', 2.05, 1.80),
  (9, 'Bet365', 'moneyline', 2.10, 1.77),
  (9, 'Betcris', 'moneyline', 2.00, 1.83);
INSERT INTO odds (match_id, sportsbook, bet_type, spread_value, home_odds, away_odds) VALUES
  (9, 'Caliente', 'spread', 2.5, 1.91, 1.91);
INSERT INTO odds (match_id, sportsbook, bet_type, total_value, over_odds, under_odds) VALUES
  (9, 'Caliente', 'over_under', 222.0, 1.91, 1.91);

-- NBA: Bucks vs Suns (match 10)
INSERT INTO odds (match_id, sportsbook, bet_type, home_odds, away_odds) VALUES
  (10, 'Caliente', 'moneyline', 1.65, 2.30),
  (10, 'Bet365', 'moneyline', 1.67, 2.25);
INSERT INTO odds (match_id, sportsbook, bet_type, spread_value, home_odds, away_odds) VALUES
  (10, 'Caliente', 'spread', -4.0, 1.91, 1.91);
INSERT INTO odds (match_id, sportsbook, bet_type, total_value, over_odds, under_odds) VALUES
  (10, 'Caliente', 'over_under', 228.5, 1.95, 1.87);

-- MLB: Dodgers vs Yankees (match 11)
INSERT INTO odds (match_id, sportsbook, bet_type, home_odds, away_odds) VALUES
  (11, 'Caliente', 'moneyline', 1.63, 2.40),
  (11, 'Bet365', 'moneyline', 1.65, 2.35),
  (11, 'Betcris', 'moneyline', 1.60, 2.45);
INSERT INTO odds (match_id, sportsbook, bet_type, spread_value, home_odds, away_odds) VALUES
  (11, 'Caliente', 'spread', -1.5, 2.10, 1.77);
INSERT INTO odds (match_id, sportsbook, bet_type, total_value, over_odds, under_odds) VALUES
  (11, 'Caliente', 'over_under', 8.5, 1.87, 1.95);

-- MLB: Astros vs Braves (match 12)
INSERT INTO odds (match_id, sportsbook, bet_type, home_odds, away_odds) VALUES
  (12, 'Caliente', 'moneyline', 2.15, 1.74),
  (12, 'Bet365', 'moneyline', 2.20, 1.71);
INSERT INTO odds (match_id, sportsbook, bet_type, total_value, over_odds, under_odds) VALUES
  (12, 'Caliente', 'over_under', 7.5, 1.91, 1.91);

-- MLB: Padres vs Phillies (match 13)
INSERT INTO odds (match_id, sportsbook, bet_type, home_odds, away_odds) VALUES
  (13, 'Caliente', 'moneyline', 1.83, 2.00),
  (13, 'Bet365', 'moneyline', 1.80, 2.05);
INSERT INTO odds (match_id, sportsbook, bet_type, total_value, over_odds, under_odds) VALUES
  (13, 'Caliente', 'over_under', 8.0, 1.95, 1.87);

-- NHL: Golden Knights vs Panthers (match 14)
INSERT INTO odds (match_id, sportsbook, bet_type, home_odds, away_odds) VALUES
  (14, 'Caliente', 'moneyline', 1.71, 2.20),
  (14, 'Bet365', 'moneyline', 1.74, 2.15),
  (14, 'Betcris', 'moneyline', 1.69, 2.25);
INSERT INTO odds (match_id, sportsbook, bet_type, spread_value, home_odds, away_odds) VALUES
  (14, 'Caliente', 'spread', -1.5, 2.35, 1.63);
INSERT INTO odds (match_id, sportsbook, bet_type, total_value, over_odds, under_odds) VALUES
  (14, 'Caliente', 'over_under', 5.5, 1.91, 1.91),
  (14, 'Bet365', 'over_under', 5.5, 1.83, 2.00);

-- NHL: Oilers vs Stars (match 15)
INSERT INTO odds (match_id, sportsbook, bet_type, home_odds, away_odds) VALUES
  (15, 'Caliente', 'moneyline', 1.83, 2.00),
  (15, 'Bet365', 'moneyline', 1.87, 1.95);
INSERT INTO odds (match_id, sportsbook, bet_type, total_value, over_odds, under_odds) VALUES
  (15, 'Caliente', 'over_under', 6.0, 1.87, 1.95);

-- NHL: Rangers vs Avalanche (match 16)
INSERT INTO odds (match_id, sportsbook, bet_type, home_odds, away_odds) VALUES
  (16, 'Caliente', 'moneyline', 2.20, 1.71),
  (16, 'Bet365', 'moneyline', 2.25, 1.69);
INSERT INTO odds (match_id, sportsbook, bet_type, total_value, over_odds, under_odds) VALUES
  (16, 'Caliente', 'over_under', 6.5, 1.91, 1.91);

-- ============================================
-- 5. PUBLIC BETTING DATA
-- ============================================
INSERT INTO public_betting (match_id, bet_type, home_pct_bets, away_pct_bets, draw_pct_bets, home_pct_money, away_pct_money, draw_pct_money) VALUES
  -- América vs Chivas
  (1, 'moneyline', 58, 25, 17, 62, 22, 16),
  (1, 'spread', 55, 45, NULL, 60, 40, NULL),
  (1, 'over_under', 62, 38, NULL, 58, 42, NULL),
  -- Cruz Azul vs Monterrey
  (2, 'moneyline', 45, 32, 23, 48, 30, 22),
  (2, 'spread', 52, 48, NULL, 55, 45, NULL),
  (2, 'over_under', 55, 45, NULL, 52, 48, NULL),
  -- Tigres vs Pumas
  (3, 'moneyline', 65, 15, 20, 70, 12, 18),
  (3, 'spread', 60, 40, NULL, 65, 35, NULL),
  (3, 'over_under', 50, 50, NULL, 48, 52, NULL),
  -- Santos vs León
  (4, 'moneyline', 42, 35, 23, 40, 38, 22),
  -- Toluca vs Atlas
  (5, 'moneyline', 55, 22, 23, 58, 20, 22),
  -- Pachuca vs Puebla
  (6, 'moneyline', 68, 12, 20, 72, 10, 18),
  -- Lakers vs Warriors
  (7, 'moneyline', 62, 38, NULL, 55, 45, NULL),
  (7, 'spread', 58, 42, NULL, 52, 48, NULL),
  (7, 'over_under', 65, 35, NULL, 60, 40, NULL),
  -- Celtics vs Heat
  (8, 'moneyline', 72, 28, NULL, 68, 32, NULL),
  (8, 'spread', 65, 35, NULL, 62, 38, NULL),
  (8, 'over_under', 55, 45, NULL, 50, 50, NULL),
  -- Mavericks vs Nuggets
  (9, 'moneyline', 45, 55, NULL, 42, 58, NULL),
  (9, 'spread', 48, 52, NULL, 45, 55, NULL),
  (9, 'over_under', 58, 42, NULL, 55, 45, NULL),
  -- Bucks vs Suns
  (10, 'moneyline', 60, 40, NULL, 58, 42, NULL),
  -- Dodgers vs Yankees
  (11, 'moneyline', 58, 42, NULL, 55, 45, NULL),
  (11, 'spread', 52, 48, NULL, 50, 50, NULL),
  (11, 'over_under', 60, 40, NULL, 58, 42, NULL),
  -- Astros vs Braves
  (12, 'moneyline', 40, 60, NULL, 38, 62, NULL),
  -- Padres vs Phillies
  (13, 'moneyline', 52, 48, NULL, 50, 50, NULL),
  -- Golden Knights vs Panthers
  (14, 'moneyline', 55, 45, NULL, 52, 48, NULL),
  (14, 'spread', 48, 52, NULL, 45, 55, NULL),
  (14, 'over_under', 58, 42, NULL, 55, 45, NULL),
  -- Oilers vs Stars
  (15, 'moneyline', 50, 50, NULL, 48, 52, NULL),
  -- Rangers vs Avalanche
  (16, 'moneyline', 38, 62, NULL, 35, 65, NULL);

-- ============================================
-- 6. MORE PLAYERS
-- ============================================
-- Cruz Azul
INSERT INTO players (team_id, name, position, number, status) VALUES
  (3, 'Uriel Antuna', 'Delantero', 7, 'active'),
  (3, 'Carlos Rodríguez', 'Mediocampista', 8, 'active'),
  (3, 'Luis Abram', 'Defensa', 2, 'active');
-- Monterrey
INSERT INTO players (team_id, name, position, number, status) VALUES
  (4, 'Germán Berterame', 'Delantero', 9, 'active'),
  (4, 'Sergio Canales', 'Mediocampista', 10, 'active'),
  (4, 'Stefan Medina', 'Defensa', 17, 'injured');
-- Tigres
INSERT INTO players (team_id, name, position, number, status) VALUES
  (5, 'André-Pierre Gignac', 'Delantero', 10, 'active'),
  (5, 'Juan Brunetta', 'Mediocampista', 11, 'active');
-- Pumas
INSERT INTO players (team_id, name, position, number, status) VALUES
  (6, 'Guillermo Martínez', 'Delantero', 9, 'active'),
  (6, 'César Huerta', 'Mediocampista', 17, 'active');
-- Celtics
INSERT INTO players (team_id, name, position, number, status) VALUES
  (15, 'Jayson Tatum', 'SF', 0, 'active'),
  (15, 'Jaylen Brown', 'SG', 7, 'active'),
  (15, 'Derrick White', 'PG', 9, 'active');
-- Heat
INSERT INTO players (team_id, name, position, number, status) VALUES
  (16, 'Jimmy Butler', 'SF', 22, 'active'),
  (16, 'Bam Adebayo', 'C', 13, 'active'),
  (16, 'Tyler Herro', 'SG', 14, 'active');
-- Mavericks
INSERT INTO players (team_id, name, position, number, status) VALUES
  (17, 'Luka Doncic', 'PG', 77, 'active'),
  (17, 'Kyrie Irving', 'SG', 11, 'active');
-- Nuggets
INSERT INTO players (team_id, name, position, number, status) VALUES
  (18, 'Nikola Jokic', 'C', 15, 'active'),
  (18, 'Jamal Murray', 'PG', 27, 'active');
-- Dodgers
INSERT INTO players (team_id, name, position, number, status) VALUES
  (21, 'Shohei Ohtani', 'DH', 17, 'active'),
  (21, 'Mookie Betts', 'SS', 50, 'active'),
  (21, 'Freddie Freeman', '1B', 5, 'active');
-- Yankees
INSERT INTO players (team_id, name, position, number, status) VALUES
  (22, 'Aaron Judge', 'RF', 99, 'active'),
  (22, 'Juan Soto', 'LF', 22, 'active');
-- Golden Knights
INSERT INTO players (team_id, name, position, number, status) VALUES
  (27, 'Jack Eichel', 'C', 9, 'active'),
  (27, 'Mark Stone', 'RW', 61, 'injured');
-- Panthers
INSERT INTO players (team_id, name, position, number, status) VALUES
  (28, 'Aleksander Barkov', 'C', 16, 'active'),
  (28, 'Matthew Tkachuk', 'LW', 19, 'active');

-- ============================================
-- 7. MORE INJURIES
-- ============================================
DELETE FROM injuries;
INSERT INTO injuries (player_id, team_id, injury_type, status, expected_return) VALUES
  -- Liga MX
  (3, 1, 'Esguince de tobillo', 'out', '2026-04-15'),
  (15, 4, 'Lesión muscular', 'doubtful', '2026-04-06'),
  -- NBA
  (7, 13, 'Molestia en rodilla', 'probable', '2026-04-03'),
  -- NHL
  (37, 27, 'Upper body', 'questionable', '2026-04-05');

-- ============================================
-- 8. MORE PLAYER PROPS (decimal odds)
-- ============================================
DELETE FROM player_props;

-- NBA: Lakers vs Warriors (match 7)
INSERT INTO player_props (match_id, player_id, prop_type, line_value, over_odds, under_odds, sportsbook, hit_rate, last_5_avg, last_10_avg) VALUES
  (7, 6, 'points', 25.5, 1.87, 1.95, 'Caliente', 62.5, 27.4, 26.8),
  (7, 6, 'assists', 7.5, 1.91, 1.91, 'Caliente', 55.0, 8.2, 7.6),
  (7, 6, 'rebounds', 7.5, 2.00, 1.83, 'Caliente', 48.0, 7.1, 7.8),
  (7, 7, 'points', 24.5, 1.91, 1.91, 'Bet365', 58.0, 25.6, 24.2),
  (7, 7, 'rebounds', 11.5, 1.87, 1.95, 'Caliente', 65.0, 12.3, 11.8),
  (7, 8, 'points', 28.5, 1.95, 1.87, 'Caliente', 52.0, 29.2, 28.1),
  (7, 8, 'three_pointers', 4.5, 2.10, 1.77, 'Bet365', 45.0, 4.8, 4.3),
  (7, 9, 'points', 20.5, 1.91, 1.91, 'Betcris', 50.0, 21.4, 20.8);

-- NBA: Celtics vs Heat (match 8)
INSERT INTO player_props (match_id, player_id, prop_type, line_value, over_odds, under_odds, sportsbook, hit_rate, last_5_avg, last_10_avg) VALUES
  (8, 22, 'points', 27.5, 1.87, 1.95, 'Caliente', 60.0, 28.6, 27.2),
  (8, 22, 'assists', 5.5, 1.95, 1.87, 'Bet365', 52.0, 5.8, 5.4),
  (8, 23, 'points', 22.5, 1.91, 1.91, 'Caliente', 55.0, 23.4, 22.8),
  (8, 25, 'points', 22.5, 1.87, 1.95, 'Caliente', 58.0, 23.2, 22.6),
  (8, 26, 'points', 19.5, 1.91, 1.91, 'Bet365', 48.0, 20.2, 19.8),
  (8, 26, 'rebounds', 10.5, 1.83, 2.00, 'Caliente', 62.0, 11.1, 10.6);

-- NBA: Mavericks vs Nuggets (match 9)
INSERT INTO player_props (match_id, player_id, prop_type, line_value, over_odds, under_odds, sportsbook, hit_rate, last_5_avg, last_10_avg) VALUES
  (9, 28, 'points', 30.5, 1.91, 1.91, 'Caliente', 55.0, 31.4, 30.2),
  (9, 28, 'assists', 8.5, 1.87, 1.95, 'Bet365', 52.0, 9.0, 8.4),
  (9, 29, 'points', 24.5, 1.95, 1.87, 'Caliente', 50.0, 25.2, 24.6),
  (9, 30, 'points', 26.5, 1.83, 2.00, 'Caliente', 65.0, 27.8, 26.2),
  (9, 31, 'points', 21.5, 1.91, 1.91, 'Bet365', 52.0, 22.4, 21.8);

-- MLB: Dodgers vs Yankees (match 11)
INSERT INTO player_props (match_id, player_id, prop_type, line_value, over_odds, under_odds, sportsbook, hit_rate, last_5_avg, last_10_avg) VALUES
  (11, 32, 'hits', 1.5, 1.67, 2.20, 'Caliente', 70.0, 2.2, 1.8),
  (11, 32, 'total_bases', 2.5, 1.91, 1.91, 'Bet365', 55.0, 3.0, 2.6),
  (11, 33, 'hits', 1.5, 1.77, 2.10, 'Caliente', 62.0, 1.8, 1.6),
  (11, 35, 'hits', 1.5, 1.71, 2.15, 'Caliente', 65.0, 1.9, 1.7),
  (11, 36, 'total_bases', 2.5, 2.00, 1.83, 'Bet365', 48.0, 2.4, 2.6);

-- Liga MX: América vs Chivas (match 1)
INSERT INTO player_props (match_id, player_id, prop_type, line_value, over_odds, under_odds, sportsbook, hit_rate, last_5_avg, last_10_avg) VALUES
  (1, 1, 'goals', 0.5, 2.50, 1.53, 'Caliente', 40.0, 0.6, 0.5),
  (1, 2, 'assists', 0.5, 2.20, 1.67, 'Caliente', 35.0, 0.4, 0.3),
  (1, 4, 'goals', 0.5, 3.00, 1.40, 'Caliente', 30.0, 0.3, 0.3);

-- ============================================
-- 9. TEAM RECENT GAMES (last 10 per team for major matchups)
-- ============================================

-- Lakers recent games
INSERT INTO team_games (team_id, opponent_id, game_date, is_home, team_score, opponent_score, result, league_id) VALUES
  (13, 15, '2026-03-30', true,  112, 108, 'W', 2),
  (13, 20, '2026-03-28', false, 105, 110, 'L', 2),
  (13, 17, '2026-03-26', true,  118, 115, 'W', 2),
  (13, 19, '2026-03-24', false, 102, 108, 'L', 2),
  (13, 18, '2026-03-22', true,  121, 118, 'W', 2),
  (13, 16, '2026-03-20', true,  115, 103, 'W', 2),
  (13, 14, '2026-03-18', false, 108, 112, 'L', 2),
  (13, 15, '2026-03-16', false, 98,  105, 'L', 2),
  (13, 20, '2026-03-14', true,  125, 118, 'W', 2),
  (13, 17, '2026-03-12', true,  110, 106, 'W', 2);

-- Warriors recent games
INSERT INTO team_games (team_id, opponent_id, game_date, is_home, team_score, opponent_score, result, league_id) VALUES
  (14, 18, '2026-03-30', false, 105, 112, 'L', 2),
  (14, 16, '2026-03-28', true,  118, 110, 'W', 2),
  (14, 13, '2026-03-26', true,  112, 108, 'W', 2),
  (14, 20, '2026-03-24', false, 108, 115, 'L', 2),
  (14, 15, '2026-03-22', true,  105, 118, 'L', 2),
  (14, 19, '2026-03-20', false, 112, 105, 'W', 2),
  (14, 17, '2026-03-18', true,  120, 115, 'W', 2),
  (14, 18, '2026-03-16', false, 102, 108, 'L', 2),
  (14, 16, '2026-03-14', true,  115, 108, 'W', 2),
  (14, 13, '2026-03-12', false, 98,  110, 'L', 2);

-- Celtics recent games
INSERT INTO team_games (team_id, opponent_id, game_date, is_home, team_score, opponent_score, result, league_id) VALUES
  (15, 19, '2026-03-30', true,  118, 105, 'W', 2),
  (15, 16, '2026-03-28', true,  112, 102, 'W', 2),
  (15, 13, '2026-03-26', false, 108, 105, 'W', 2),
  (15, 20, '2026-03-24', true,  115, 108, 'W', 2),
  (15, 17, '2026-03-22', false, 102, 108, 'L', 2),
  (15, 14, '2026-03-20', true,  120, 105, 'W', 2),
  (15, 18, '2026-03-18', false, 108, 112, 'L', 2),
  (15, 19, '2026-03-16', true,  118, 110, 'W', 2),
  (15, 16, '2026-03-14', false, 112, 105, 'W', 2),
  (15, 20, '2026-03-12', true,  125, 118, 'W', 2);

-- Heat recent games
INSERT INTO team_games (team_id, opponent_id, game_date, is_home, team_score, opponent_score, result, league_id) VALUES
  (16, 17, '2026-03-30', false, 108, 115, 'L', 2),
  (16, 15, '2026-03-28', false, 102, 112, 'L', 2),
  (16, 14, '2026-03-26', true,  110, 105, 'W', 2),
  (16, 19, '2026-03-24', true,  115, 108, 'W', 2),
  (16, 18, '2026-03-22', false, 105, 112, 'L', 2),
  (16, 20, '2026-03-20', true,  118, 115, 'W', 2),
  (16, 13, '2026-03-18', false, 103, 115, 'L', 2),
  (16, 14, '2026-03-16', true,  112, 108, 'W', 2),
  (16, 17, '2026-03-14', true,  108, 105, 'W', 2),
  (16, 15, '2026-03-12', false, 98,  118, 'L', 2);

-- América recent games
INSERT INTO team_games (team_id, opponent_id, game_date, is_home, team_score, opponent_score, result, league_id) VALUES
  (1, 3, '2026-03-29', true,  2, 1, 'W', 1),
  (1, 5, '2026-03-26', false, 1, 1, 'D', 1),
  (1, 9, '2026-03-22', true,  3, 0, 'W', 1),
  (1, 4, '2026-03-19', false, 2, 2, 'D', 1),
  (1, 8, '2026-03-15', true,  1, 0, 'W', 1),
  (1, 11, '2026-03-12', false, 0, 1, 'L', 1),
  (1, 6, '2026-03-08', true,  2, 1, 'W', 1),
  (1, 10, '2026-03-05', false, 3, 1, 'W', 1),
  (1, 12, '2026-03-01', true,  2, 0, 'W', 1),
  (1, 7, '2026-02-26', false, 1, 2, 'L', 1);

-- Chivas recent games
INSERT INTO team_games (team_id, opponent_id, game_date, is_home, team_score, opponent_score, result, league_id) VALUES
  (2, 5, '2026-03-29', false, 0, 2, 'L', 1),
  (2, 3, '2026-03-26', true,  1, 1, 'D', 1),
  (2, 8, '2026-03-22', false, 2, 1, 'W', 1),
  (2, 9, '2026-03-19', true,  1, 0, 'W', 1),
  (2, 11, '2026-03-15', false, 0, 0, 'D', 1),
  (2, 6, '2026-03-12', true,  2, 1, 'W', 1),
  (2, 4, '2026-03-08', false, 1, 3, 'L', 1),
  (2, 10, '2026-03-05', true,  2, 0, 'W', 1),
  (2, 7, '2026-03-01', false, 1, 1, 'D', 1),
  (2, 12, '2026-02-26', true,  3, 1, 'W', 1);

-- Golden Knights recent games
INSERT INTO team_games (team_id, opponent_id, game_date, is_home, team_score, opponent_score, result, league_id) VALUES
  (27, 29, '2026-03-30', true,  4, 2, 'W', 4),
  (27, 32, '2026-03-28', false, 3, 4, 'L', 4),
  (27, 30, '2026-03-26', true,  5, 3, 'W', 4),
  (27, 31, '2026-03-24', true,  2, 1, 'W', 4),
  (27, 28, '2026-03-22', false, 1, 3, 'L', 4),
  (27, 29, '2026-03-20', false, 4, 3, 'W', 4),
  (27, 32, '2026-03-18', true,  3, 2, 'W', 4),
  (27, 30, '2026-03-16', false, 2, 4, 'L', 4),
  (27, 31, '2026-03-14', true,  5, 1, 'W', 4),
  (27, 28, '2026-03-12', true,  3, 2, 'W', 4);

-- Panthers recent games
INSERT INTO team_games (team_id, opponent_id, game_date, is_home, team_score, opponent_score, result, league_id) VALUES
  (28, 31, '2026-03-30', true,  4, 1, 'W', 4),
  (28, 30, '2026-03-28', false, 3, 2, 'W', 4),
  (28, 29, '2026-03-26', true,  5, 4, 'W', 4),
  (28, 32, '2026-03-24', false, 2, 3, 'L', 4),
  (28, 27, '2026-03-22', true,  3, 1, 'W', 4),
  (28, 31, '2026-03-20', false, 4, 2, 'W', 4),
  (28, 30, '2026-03-18', true,  2, 1, 'W', 4),
  (28, 29, '2026-03-16', false, 1, 3, 'L', 4),
  (28, 32, '2026-03-14', true,  4, 3, 'W', 4),
  (28, 27, '2026-03-12', false, 2, 3, 'L', 4);

-- Dodgers recent games
INSERT INTO team_games (team_id, opponent_id, game_date, is_home, team_score, opponent_score, result, league_id) VALUES
  (21, 25, '2026-03-31', true,  6, 4, 'W', 3),
  (21, 25, '2026-03-30', true,  8, 3, 'W', 3),
  (21, 26, '2026-03-29', false, 5, 2, 'W', 3),
  (21, 26, '2026-03-28', false, 3, 5, 'L', 3),
  (21, 24, '2026-03-27', true,  7, 6, 'W', 3),
  (21, 24, '2026-03-26', true,  4, 5, 'L', 3),
  (21, 23, '2026-03-25', false, 6, 3, 'W', 3);

-- Yankees recent games
INSERT INTO team_games (team_id, opponent_id, game_date, is_home, team_score, opponent_score, result, league_id) VALUES
  (22, 23, '2026-03-31', false, 4, 5, 'L', 3),
  (22, 23, '2026-03-30', false, 7, 3, 'W', 3),
  (22, 24, '2026-03-29', true,  5, 4, 'W', 3),
  (22, 24, '2026-03-28', true,  3, 6, 'L', 3),
  (22, 26, '2026-03-27', false, 8, 2, 'W', 3),
  (22, 26, '2026-03-26', false, 4, 7, 'L', 3),
  (22, 25, '2026-03-25', true,  6, 5, 'W', 3);

-- ============================================
-- 10. MORE H2H RECORDS
-- ============================================

-- Cruz Azul vs Monterrey H2H
INSERT INTO h2h_records (team_a_id, team_b_id, match_date, score_a, score_b, league_id) VALUES
  (3, 4, '2026-01-10', 1, 0, 1),
  (4, 3, '2025-08-15', 2, 2, 1),
  (3, 4, '2025-03-20', 0, 1, 1),
  (4, 3, '2024-10-05', 3, 1, 1),
  (3, 4, '2024-04-18', 2, 0, 1);

-- Tigres vs Pumas H2H
INSERT INTO h2h_records (team_a_id, team_b_id, match_date, score_a, score_b, league_id) VALUES
  (5, 6, '2026-01-20', 3, 1, 1),
  (6, 5, '2025-09-10', 0, 2, 1),
  (5, 6, '2025-04-05', 1, 0, 1),
  (6, 5, '2024-11-15', 1, 1, 1),
  (5, 6, '2024-06-02', 4, 2, 1);

-- Celtics vs Heat H2H
INSERT INTO h2h_records (team_a_id, team_b_id, match_date, score_a, score_b, league_id) VALUES
  (15, 16, '2026-02-15', 118, 105, 2),
  (16, 15, '2025-12-20', 108, 112, 2),
  (15, 16, '2025-10-28', 125, 115, 2),
  (16, 15, '2025-04-10', 110, 108, 2),
  (15, 16, '2024-12-05', 120, 102, 2);

-- Mavericks vs Nuggets H2H
INSERT INTO h2h_records (team_a_id, team_b_id, match_date, score_a, score_b, league_id) VALUES
  (17, 18, '2026-02-08', 115, 120, 2),
  (18, 17, '2025-12-15', 118, 112, 2),
  (17, 18, '2025-10-25', 108, 105, 2),
  (18, 17, '2025-03-30', 125, 118, 2),
  (17, 18, '2024-11-18', 102, 110, 2);

-- Golden Knights vs Panthers H2H
INSERT INTO h2h_records (team_a_id, team_b_id, match_date, score_a, score_b, league_id) VALUES
  (27, 28, '2026-01-25', 3, 4, 4),
  (28, 27, '2025-11-10', 5, 2, 4),
  (27, 28, '2025-03-15', 4, 3, 4),
  (28, 27, '2024-10-20', 2, 1, 4);

-- Dodgers vs Yankees H2H
INSERT INTO h2h_records (team_a_id, team_b_id, match_date, score_a, score_b, league_id) VALUES
  (21, 22, '2025-10-28', 7, 5, 3),
  (22, 21, '2025-10-27', 4, 3, 3),
  (21, 22, '2025-10-26', 2, 6, 3),
  (22, 21, '2025-06-15', 5, 8, 3),
  (21, 22, '2025-06-14', 6, 4, 3);

-- ============================================
-- 11. LINEUPS FOR MAIN MATCHES
-- ============================================

-- Lakers lineup for match 7
INSERT INTO lineups (match_id, team_id, player_id, is_starter, position_order, minutes_projected, status) VALUES
  (7, 13, 6, true, 1, 36.0, 'confirmed'),   -- LeBron
  (7, 13, 7, true, 2, 34.0, 'confirmed');    -- AD

-- Warriors lineup for match 7
INSERT INTO lineups (match_id, team_id, player_id, is_starter, position_order, minutes_projected, status) VALUES
  (7, 14, 8, true, 1, 35.0, 'confirmed'),    -- Curry
  (7, 14, 9, true, 2, 33.0, 'confirmed');    -- Klay

-- Celtics lineup for match 8
INSERT INTO lineups (match_id, team_id, player_id, is_starter, position_order, minutes_projected, status) VALUES
  (8, 15, 22, true, 1, 37.0, 'confirmed'),   -- Tatum
  (8, 15, 23, true, 2, 35.0, 'confirmed'),   -- Brown
  (8, 15, 24, true, 3, 32.0, 'confirmed');   -- White

-- Heat lineup for match 8
INSERT INTO lineups (match_id, team_id, player_id, is_starter, position_order, minutes_projected, status) VALUES
  (8, 16, 25, true, 1, 36.0, 'confirmed'),   -- Butler
  (8, 16, 26, true, 2, 34.0, 'confirmed'),   -- Bam
  (8, 16, 27, true, 3, 33.0, 'confirmed');   -- Herro

-- América lineup for match 1
INSERT INTO lineups (match_id, team_id, player_id, is_starter, position_order, minutes_projected, status) VALUES
  (1, 1, 1, true, 1, 90.0, 'confirmed'),    -- Henry Martín
  (1, 1, 2, true, 2, 90.0, 'confirmed');    -- Zendejas

-- Chivas lineup for match 1
INSERT INTO lineups (match_id, team_id, player_id, is_starter, position_order, minutes_projected, status) VALUES
  (1, 2, 4, true, 1, 90.0, 'confirmed'),    -- Chicharito
  (1, 2, 5, true, 2, 90.0, 'confirmed');    -- Beltrán

-- Migration V2 complete
