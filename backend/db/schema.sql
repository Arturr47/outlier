-- Outlier Mexicano - Schema de Base de Datos

-- Usuarios
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  name VARCHAR(255),
  stripe_customer_id VARCHAR(255),
  stripe_subscription_id VARCHAR(255),
  status VARCHAR(50) DEFAULT 'trial', -- trial, active, cancelled, expired
  trial_ends_at TIMESTAMP,
  subscription_ends_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Ligas
CREATE TABLE leagues (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  slug VARCHAR(50) UNIQUE NOT NULL, -- liga-mx, nba, mlb, nhl
  country VARCHAR(50),
  sport VARCHAR(50) NOT NULL,
  logo_url VARCHAR(500),
  active BOOLEAN DEFAULT true
);

-- Equipos
CREATE TABLE teams (
  id SERIAL PRIMARY KEY,
  league_id INTEGER REFERENCES leagues(id),
  name VARCHAR(200) NOT NULL,
  short_name VARCHAR(10),
  logo_url VARCHAR(500),
  city VARCHAR(100),
  conference VARCHAR(100),
  division VARCHAR(100)
);

-- Partidos
CREATE TABLE matches (
  id SERIAL PRIMARY KEY,
  league_id INTEGER REFERENCES leagues(id),
  home_team_id INTEGER REFERENCES teams(id),
  away_team_id INTEGER REFERENCES teams(id),
  match_date TIMESTAMP NOT NULL,
  status VARCHAR(50) DEFAULT 'scheduled', -- scheduled, live, finished
  home_score INTEGER,
  away_score INTEGER,
  venue VARCHAR(200),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Momios / Odds
CREATE TABLE odds (
  id SERIAL PRIMARY KEY,
  match_id INTEGER REFERENCES matches(id),
  sportsbook VARCHAR(100) NOT NULL, -- caliente, bet365, betplay, betcris
  bet_type VARCHAR(50) NOT NULL, -- moneyline, spread, over_under
  home_odds DECIMAL(8,2),
  away_odds DECIMAL(8,2),
  draw_odds DECIMAL(8,2),
  spread_value DECIMAL(5,2),
  total_value DECIMAL(5,2),
  over_odds DECIMAL(8,2),
  under_odds DECIMAL(8,2),
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Jugadores
CREATE TABLE players (
  id SERIAL PRIMARY KEY,
  team_id INTEGER REFERENCES teams(id),
  name VARCHAR(200) NOT NULL,
  position VARCHAR(50),
  number INTEGER,
  photo_url VARCHAR(500),
  status VARCHAR(50) DEFAULT 'active' -- active, injured, doubtful, out
);

-- Props de jugadores
CREATE TABLE player_props (
  id SERIAL PRIMARY KEY,
  match_id INTEGER REFERENCES matches(id),
  player_id INTEGER REFERENCES players(id),
  prop_type VARCHAR(100) NOT NULL, -- points, assists, rebounds, goals, hits, saves
  line_value DECIMAL(5,2),
  over_odds DECIMAL(8,2),
  under_odds DECIMAL(8,2),
  sportsbook VARCHAR(100),
  hit_rate DECIMAL(5,2),
  last_5_avg DECIMAL(5,2),
  last_10_avg DECIMAL(5,2),
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- H2H (Head to Head)
CREATE TABLE h2h_records (
  id SERIAL PRIMARY KEY,
  team_a_id INTEGER REFERENCES teams(id),
  team_b_id INTEGER REFERENCES teams(id),
  match_date DATE NOT NULL,
  score_a INTEGER,
  score_b INTEGER,
  league_id INTEGER REFERENCES leagues(id)
);

-- Lesionados
CREATE TABLE injuries (
  id SERIAL PRIMARY KEY,
  player_id INTEGER REFERENCES players(id),
  team_id INTEGER REFERENCES teams(id),
  injury_type VARCHAR(200),
  status VARCHAR(50), -- out, doubtful, questionable, probable
  expected_return DATE,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Picks del usuario
CREATE TABLE user_picks (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id),
  match_id INTEGER REFERENCES matches(id),
  pick_type VARCHAR(50) NOT NULL, -- moneyline, spread, over_under, prop
  pick_value VARCHAR(200) NOT NULL,
  odds DECIMAL(8,2),
  sportsbook VARCHAR(100),
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Datos seed: Ligas
INSERT INTO leagues (name, slug, country, sport) VALUES
  ('Liga MX', 'liga-mx', 'México', 'soccer'),
  ('NBA', 'nba', 'USA', 'basketball'),
  ('MLB', 'mlb', 'USA', 'baseball'),
  ('NHL', 'nhl', 'USA', 'hockey');

-- Datos seed: Equipos Liga MX
INSERT INTO teams (league_id, name, short_name, city, conference) VALUES
  (1, 'Club América', 'AME', 'Ciudad de México', 'Apertura'),
  (1, 'Guadalajara (Chivas)', 'GDL', 'Guadalajara', 'Apertura'),
  (1, 'Cruz Azul', 'CAZ', 'Ciudad de México', 'Apertura'),
  (1, 'Monterrey', 'MTY', 'Monterrey', 'Apertura'),
  (1, 'Tigres UANL', 'TIG', 'Monterrey', 'Apertura'),
  (1, 'Pumas UNAM', 'PUM', 'Ciudad de México', 'Apertura'),
  (1, 'Santos Laguna', 'SAN', 'Torreón', 'Apertura'),
  (1, 'León', 'LEO', 'León', 'Apertura'),
  (1, 'Toluca', 'TOL', 'Toluca', 'Apertura'),
  (1, 'Atlas', 'ATL', 'Guadalajara', 'Apertura'),
  (1, 'Pachuca', 'PAC', 'Pachuca', 'Apertura'),
  (1, 'Puebla', 'PUE', 'Puebla', 'Apertura');

-- Datos seed: Equipos NBA (principales)
INSERT INTO teams (league_id, name, short_name, city, conference, division) VALUES
  (2, 'Los Angeles Lakers', 'LAL', 'Los Angeles', 'Western', 'Pacific'),
  (2, 'Golden State Warriors', 'GSW', 'San Francisco', 'Western', 'Pacific'),
  (2, 'Boston Celtics', 'BOS', 'Boston', 'Eastern', 'Atlantic'),
  (2, 'Miami Heat', 'MIA', 'Miami', 'Eastern', 'Southeast'),
  (2, 'Dallas Mavericks', 'DAL', 'Dallas', 'Western', 'Southwest'),
  (2, 'Denver Nuggets', 'DEN', 'Denver', 'Western', 'Northwest'),
  (2, 'Milwaukee Bucks', 'MIL', 'Milwaukee', 'Eastern', 'Central'),
  (2, 'Phoenix Suns', 'PHX', 'Phoenix', 'Western', 'Pacific');

-- Datos seed: Equipos MLB (principales)
INSERT INTO teams (league_id, name, short_name, city, conference, division) VALUES
  (3, 'Los Angeles Dodgers', 'LAD', 'Los Angeles', 'National', 'West'),
  (3, 'New York Yankees', 'NYY', 'New York', 'American', 'East'),
  (3, 'Houston Astros', 'HOU', 'Houston', 'American', 'West'),
  (3, 'Atlanta Braves', 'ATL', 'Atlanta', 'National', 'East'),
  (3, 'San Diego Padres', 'SD', 'San Diego', 'National', 'West'),
  (3, 'Philadelphia Phillies', 'PHI', 'Philadelphia', 'National', 'East');

-- Datos seed: Equipos NHL (principales)
INSERT INTO teams (league_id, name, short_name, city, conference, division) VALUES
  (4, 'Vegas Golden Knights', 'VGK', 'Las Vegas', 'Western', 'Pacific'),
  (4, 'Florida Panthers', 'FLA', 'Sunrise', 'Eastern', 'Atlantic'),
  (4, 'Edmonton Oilers', 'EDM', 'Edmonton', 'Western', 'Pacific'),
  (4, 'Dallas Stars', 'DAL', 'Dallas', 'Western', 'Central'),
  (4, 'New York Rangers', 'NYR', 'New York', 'Eastern', 'Metropolitan'),
  (4, 'Colorado Avalanche', 'COL', 'Denver', 'Western', 'Central');

-- Índices para rendimiento
CREATE INDEX idx_matches_date ON matches(match_date);
CREATE INDEX idx_matches_league ON matches(league_id);
CREATE INDEX idx_odds_match ON odds(match_id);
CREATE INDEX idx_player_props_match ON player_props(match_id);
CREATE INDEX idx_user_picks_user ON user_picks(user_id);
CREATE INDEX idx_injuries_team ON injuries(team_id);
