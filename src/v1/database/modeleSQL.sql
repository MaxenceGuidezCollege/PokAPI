CREATE TABLE pokemons (
    id 		    INT NOT NULL PRIMARY KEY,
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

