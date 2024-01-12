CREATE SEQUENCE %SCHEMA%.pok_id_seq MINVALUE 1 START WITH 1 INCREMENT BY 1;
CREATE SEQUENCE %SCHEMA%.user_id_seq MINVALUE 0 START WITH 0 INCREMENT BY 1;

CREATE TABLE %SCHEMA%.pokemons (
    id 		    INT NOT NULL PRIMARY KEY DEFAULT NEXTVAL('%SCHEMA%.pok_id_seq'),
    name_en     VARCHAR(255) NOT NULL,
    name_fr     VARCHAR(255) NOT NULL,
    type        TEXT[],
    hp 		    INT,
    attack 	    INT,
    attack_sp   INT,
    defense 	INT,
    defense_sp 	INT,
    speed 	    INT,
    image 	    BYTEA,
    sprite      BYTEA
);

CREATE TYPE %SCHEMA%.user_type AS ENUM ('ADMIN', 'USER');

CREATE TABLE %SCHEMA%.users (
    id          INT NOT NULL PRIMARY KEY DEFAULT NEXTVAL('%SCHEMA%.user_id_seq'),
    username    VARCHAR(50) NOT NULL,
    email       VARCHAR(255) NOT NULL UNIQUE,
    pwd_hash    BYTEA NOT NULL,
    role        %SCHEMA%.user_type NOT NULL,
    created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
