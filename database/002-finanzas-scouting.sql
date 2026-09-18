-- MySQL 8. Ejecutar en Hostinger (phpMyAdmin) sobre la base ya existente.
-- No volver a correr 001-schema.sql ni db:migrate sobre la misma base.

CREATE TABLE finance_categories (
 id varchar(36) PRIMARY KEY, name varchar(100) NOT NULL UNIQUE,
 kind varchar(20) NOT NULL,
 CONSTRAINT finance_category_kind CHECK (kind IN ('ingreso','egreso','ambos'))
);
CREATE TABLE finance_movements (
 id varchar(36) PRIMARY KEY, kind varchar(20) NOT NULL,
 category_id varchar(36) NOT NULL,
 amount decimal(12,2) NOT NULL, date date NOT NULL,
 concept varchar(100) NOT NULL, detail varchar(500) NOT NULL,
 CONSTRAINT finance_movement_kind CHECK (kind IN ('ingreso','egreso')),
 CONSTRAINT finance_amount CHECK (amount > 0),
 CONSTRAINT finance_movements_category_fk FOREIGN KEY (category_id) REFERENCES finance_categories(id) ON DELETE RESTRICT
);
CREATE INDEX finance_movements_date_idx ON finance_movements(date);
CREATE INDEX finance_movements_category_idx ON finance_movements(category_id);

CREATE TABLE scout_players (
 id varchar(36) PRIMARY KEY, name varchar(100) NOT NULL,
 nickname varchar(40) NOT NULL, game varchar(50) NOT NULL, role varchar(40) NOT NULL,
 age integer NULL, country varchar(60) NULL, status varchar(30) NOT NULL, contact varchar(200) NULL,
 CONSTRAINT scout_status CHECK (status IN ('Seguimiento','Contactado','Prueba','Fichado','Descartado'))
);
CREATE TABLE scout_traits (
 id varchar(36) PRIMARY KEY,
 player_id varchar(36) NOT NULL,
 name varchar(60) NOT NULL, rating integer NOT NULL, note varchar(200) NULL,
 CONSTRAINT scout_rating CHECK (rating >= 1 AND rating <= 10),
 CONSTRAINT scout_traits_player_fk FOREIGN KEY (player_id) REFERENCES scout_players(id) ON DELETE CASCADE
);
CREATE INDEX scout_traits_player_idx ON scout_traits(player_id);
CREATE TABLE scout_observations (
 id varchar(36) PRIMARY KEY,
 player_id varchar(36) NOT NULL,
 date date NOT NULL, author varchar(60) NOT NULL,
 title varchar(100) NOT NULL, content varchar(2000) NOT NULL,
 CONSTRAINT scout_observations_player_fk FOREIGN KEY (player_id) REFERENCES scout_players(id) ON DELETE CASCADE
);
CREATE INDEX scout_observations_player_idx ON scout_observations(player_id);
