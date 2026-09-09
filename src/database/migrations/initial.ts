import { MigrationInterface, QueryRunner } from "typeorm";
export class Initial1788900000000 implements MigrationInterface {
  async up(q: QueryRunner) {
    await q.query(`CREATE TABLE organization (
 id integer PRIMARY KEY, name varchar(100) NOT NULL, brand varchar(100) NOT NULL,
 season integer NOT NULL, tagline varchar(200) NOT NULL, footer varchar(200) NOT NULL
);
CREATE TABLE users (
 id uuid PRIMARY KEY, email varchar(254) NOT NULL UNIQUE, name varchar(100) NOT NULL,
 role varchar(30) NOT NULL DEFAULT 'manager', password_hash text NOT NULL,
 CONSTRAINT user_role CHECK (role IN ('manager','viewer'))
);
CREATE TABLE sessions (
 id uuid PRIMARY KEY, token_hash varchar(64) NOT NULL UNIQUE,
 user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
 expires_at timestamp NOT NULL
);
CREATE INDEX sessions_expiry_idx ON sessions(expires_at);
CREATE TABLE teams (
 id varchar(50) PRIMARY KEY, name varchar(100) NOT NULL UNIQUE,
 short varchar(10) NOT NULL, sub varchar(100) NOT NULL, win integer NOT NULL DEFAULT 0,
 CONSTRAINT team_win CHECK (win >= 0 AND win <= 100)
);
CREATE TABLE areas (
 id uuid PRIMARY KEY, name varchar(100) NOT NULL UNIQUE,
 team_id varchar(50) UNIQUE REFERENCES teams(id) ON DELETE RESTRICT
);
CREATE TABLE players (
 id uuid PRIMARY KEY, team_id varchar(50) NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
 name varchar(40) NOT NULL, role varchar(40) NOT NULL, position integer NOT NULL
);
CREATE INDEX players_team_idx ON players(team_id);
CREATE TABLE events (
 id uuid PRIMARY KEY, name varchar(100) NOT NULL,
 area_id uuid NOT NULL REFERENCES areas(id) ON DELETE RESTRICT,
 date date NOT NULL, time time NOT NULL, type varchar(30) NOT NULL,
 CONSTRAINT event_type CHECK (type IN ('Entrenamiento','Competencia','Reunión'))
);
CREATE INDEX events_agenda_idx ON events(date,time);
CREATE INDEX events_area_idx ON events(area_id);
CREATE TABLE tasks (
 id uuid PRIMARY KEY, name varchar(100) NOT NULL,
 area_id uuid NOT NULL REFERENCES areas(id) ON DELETE RESTRICT,
 who varchar(60) NOT NULL, due date NOT NULL,
 priority boolean NOT NULL DEFAULT false, done boolean NOT NULL DEFAULT false
);
CREATE INDEX tasks_status_due_idx ON tasks(done,due);
CREATE INDEX tasks_area_idx ON tasks(area_id);
`);
  }
  async down(q: QueryRunner) {
    await q.query(
      "DROP TABLE tasks, events, players, areas, teams, sessions, users, organization",
    );
  }
}
