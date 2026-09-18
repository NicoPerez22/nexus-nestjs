-- MySQL 8. Reference schema; normally applied by npm run db:migrate.
CREATE TABLE roles (
 id integer PRIMARY KEY, name varchar(30) NOT NULL UNIQUE
);
CREATE TABLE users (
 id varchar(36) PRIMARY KEY, email varchar(254) NOT NULL UNIQUE, name varchar(100) NOT NULL,
 role_id integer NOT NULL REFERENCES roles(id) ON DELETE RESTRICT, password_hash text NOT NULL
);
CREATE TABLE sessions (
 id varchar(36) PRIMARY KEY, token_hash varchar(64) NOT NULL UNIQUE,
 user_id varchar(36) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
 expires_at timestamp NOT NULL
);
CREATE INDEX sessions_expiry_idx ON sessions(expires_at);
CREATE TABLE teams (
 id varchar(50) PRIMARY KEY, name varchar(100) NOT NULL UNIQUE,
 short varchar(10) NOT NULL, sub varchar(100) NOT NULL, win integer NOT NULL DEFAULT 0,
 CONSTRAINT team_win CHECK (win >= 0 AND win <= 100)
);
CREATE TABLE areas (
 id varchar(36) PRIMARY KEY, name varchar(100) NOT NULL UNIQUE,
 team_id varchar(50) UNIQUE REFERENCES teams(id) ON DELETE RESTRICT
);
CREATE TABLE players (
 id varchar(36) PRIMARY KEY, team_id varchar(50) NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
 name varchar(40) NOT NULL, role varchar(40) NOT NULL, position integer NOT NULL
);
CREATE INDEX players_team_idx ON players(team_id);
CREATE TABLE events (
 id varchar(36) PRIMARY KEY, name varchar(100) NOT NULL,
 area_id varchar(36) NOT NULL REFERENCES areas(id) ON DELETE RESTRICT,
 date date NOT NULL, time time NOT NULL, type varchar(30) NOT NULL,
 CONSTRAINT event_type CHECK (type IN ('Entrenamiento','Competencia','Reunión'))
);
CREATE INDEX events_agenda_idx ON events(date,time);
CREATE INDEX events_area_idx ON events(area_id);
CREATE TABLE tasks (
 id varchar(36) PRIMARY KEY, name varchar(100) NOT NULL,
 area_id varchar(36) NOT NULL REFERENCES areas(id) ON DELETE RESTRICT,
 who varchar(60) NOT NULL, due date NOT NULL,
 priority boolean NOT NULL DEFAULT false, done boolean NOT NULL DEFAULT false
);
CREATE INDEX tasks_status_due_idx ON tasks(done,due);
CREATE INDEX tasks_area_idx ON tasks(area_id);
CREATE TABLE organization (
 id integer PRIMARY KEY, name varchar(100) NOT NULL, brand varchar(100) NOT NULL,
 season integer NOT NULL, tagline varchar(200) NOT NULL, footer varchar(200) NOT NULL
);
CREATE TABLE finance_categories (
 id varchar(36) PRIMARY KEY, name varchar(100) NOT NULL UNIQUE,
 kind varchar(20) NOT NULL,
 CONSTRAINT finance_category_kind CHECK (kind IN ('ingreso','egreso','ambos'))
);
CREATE TABLE finance_movements (
 id varchar(36) PRIMARY KEY, kind varchar(20) NOT NULL,
 category_id varchar(36) NOT NULL REFERENCES finance_categories(id) ON DELETE RESTRICT,
 amount numeric(12,2) NOT NULL, date date NOT NULL,
 concept varchar(100) NOT NULL, detail varchar(500) NOT NULL,
 CONSTRAINT finance_movement_kind CHECK (kind IN ('ingreso','egreso')),
 CONSTRAINT finance_amount CHECK (amount > 0)
);
CREATE INDEX finance_movements_date_idx ON finance_movements(date);
CREATE INDEX finance_movements_category_idx ON finance_movements(category_id);
CREATE TABLE scout_players (
 id varchar(36) PRIMARY KEY, name varchar(100) NOT NULL,
 nickname varchar(40) NOT NULL, game varchar(50) NOT NULL, role varchar(40) NOT NULL,
 age integer, country varchar(60), status varchar(30) NOT NULL, contact varchar(200),
 CONSTRAINT scout_status CHECK (status IN ('Seguimiento','Contactado','Prueba','Fichado','Descartado'))
);
CREATE TABLE scout_traits (
 id varchar(36) PRIMARY KEY,
 player_id varchar(36) NOT NULL REFERENCES scout_players(id) ON DELETE CASCADE,
 name varchar(60) NOT NULL, rating integer NOT NULL, note varchar(200),
 CONSTRAINT scout_rating CHECK (rating >= 1 AND rating <= 10)
);
CREATE INDEX scout_traits_player_idx ON scout_traits(player_id);
CREATE TABLE scout_observations (
 id varchar(36) PRIMARY KEY,
 player_id varchar(36) NOT NULL REFERENCES scout_players(id) ON DELETE CASCADE,
 date date NOT NULL, author varchar(60) NOT NULL,
 title varchar(100) NOT NULL, content varchar(2000) NOT NULL
);
CREATE INDEX scout_observations_player_idx ON scout_observations(player_id);
