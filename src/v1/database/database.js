
/**
 * @fileoverview
 * Database module to manage Pokémon data using PostgreSQL.
 *
 * @author Vinc/Mig/Max
 */

const { Pool } = require('pg');

const pokemons = require('../data/pokemons.json');
const utils = require("../backend/utils.js");
const schema = process.env.SCHEMA || "maxence_guidez";

module.exports.Database = class {
    constructor() {
        let options = {
            ssl: {
                rejectUnauthorized: false
            }
        };

        this._pool = new Pool(options);
    }

    /**
     * Initializes the database with data from the 'pokemons.json' file.
     * @async
     */
    async initDatabaseData() {
        const client = await this._pool.connect();
        try {
            for (let pokemon of pokemons) {
                await this.addPokemon(pokemon);
                console.log(pokemon);
            }
            console.log("Data inserted successfully");
        } catch (err) {
            console.error("Error while initializing database: ", err);
        } finally {
            client.release();
        }
    }

    /**
     * Removes all data from the database.
     * @async
     */
    async emptyDatabase() {
        const client = await this._pool.connect();
        try {
            const queryText = `DELETE FROM ${schema}.pokemons WHERE 1=1`;
            await client.query(queryText);
            console.log("Data deleted successfully");
        } catch (err) {
            console.error("Error while deleting database: ", err);
        } finally {
            client.release();
        }
    }

    /**
     * Tests the database connection by performing a simple query.
     * @async
     * @returns {Array} - An array containing the actual date.
     */
    async testConnection() {
        const client = await this._pool.connect();
        try {
            const res = await client.query('SELECT NOW()');
            return res.rows;
        } catch (err) {
            console.log("Error testing: ", err);
        } finally {
            client.release();
        }
    }

    /**
     * Tests the database by selecting all records from the 'pokemons' table.
     * @async
     * @returns {Array} - An array containing the selected records.
     */
    async testSelect() {
        const client = await this._pool.connect();
        try {
            const res = await client.query(`SELECT * FROM ${schema}.pokemons`);
            return res.rows;
        } catch (err) {
            console.log("Error testing: ", err);
        } finally {
            client.release();
        }
    }

    /**
     * Retrieves a subset of Pokémon records based on pagination parameters.
     * @async
     * @param {Object} pageInfo - Information about the page and pagination.
     * @param {string} [fields='*'] - The columns to select from the table.
     * @param {string} [where='ALL'] where - The column to filter the results by.
     * @param {string} [orderBy='id'] - The column to order the results by.
     * @returns {Array} - An array containing Pokémon records.
     */
    async queryForAll({page, per_page}, fields = '*', where = 'ALL', orderBy = 'id') {
        const client = await this._pool.connect();
        try {
            const first = (page - 1) * per_page;

            let sql;
            let rows;
            if (where === "ALL") {
                sql = `SELECT ${fields} FROM ${schema}.pokemons ORDER BY ${orderBy} offset $1 limit $2`;
                rows = await client.query(sql, [first, per_page]);
            }
            else {
                sql = `SELECT ${fields} FROM ${schema}.pokemons WHERE $1 = ANY(type) ORDER BY ${orderBy} offset $2 limit $3`;
                rows = await client.query(sql, [where, first, per_page]);
            }
            rows = rows.rows;

            for (let i = 0; i < rows.length; i++) {
                rows[i] = utils.formatPokemonData(rows[i]);
            }
            return rows;
        } catch (err) {
            console.error("Error getting all:", err);
        } finally {
            client.release();
        }
    }

    /**
     * Retrieves a Pokémon record by its ID.
     * @async
     * @param {number} id - The ID of the Pokémon to retrieve.
     * @param {string} [fields='*'] - The columns to select from the table.
     * @returns {Object} - The Pokémon record.
     */
    async queryById(id, fields = '*') {
        const client = await this._pool.connect();
        try {
            const sql = `SELECT ${fields} FROM ${schema}.pokemons WHERE id = $1`;
            const {rows} = await client.query(sql, [id]);
            return utils.formatPokemonData(rows[0]);
        } catch (err) {
            console.error("Error getting by ID: ", err);
        } finally {
            client.release();
        }
    }

    /**
     * Retrieves a Pokémon record by its English or French name.
     * @async
     * @param {string} name - The name of the Pokémon.
     * @param {string} [language='en'] - The language for the name (either 'en' or 'fr').
     * @returns {Object} - The Pokémon record.
     */
    async queryByName(name, language = 'en') {
        const client = await this._pool.connect();
        try {
            const columnName = language === 'fr' ? 'name_fr' : 'name_en';

            const sql = `SELECT * FROM ${schema}.pokemons WHERE LOWER(${columnName}) = $1`;

            const {rows} = await client.query(sql, [name.toLowerCase()]);
            return rows[0];
        } catch (err) {
            console.error("Error getting by name: ", err);
        } finally {
            client.release();
        }
    }

    /**
     * Adds a new Pokémon record to the database.
     * @async
     * @param {Object} newPokemon - The new Pokémon data to be inserted.
     * @returns {boolean} - A boolean indicating whether the operation was successful.
     */
    async addPokemon(newPokemon) {
        const client = await this._pool.connect();
        try {
            if (newPokemon.image){
                newPokemon.image = await utils.getImage("../data/images/", newPokemon.image);
            }
            if (newPokemon.sprite ){
                newPokemon.sprite = await utils.getImage("../data/sprites/", newPokemon.sprite);
            }

            // TODO : IN PROGRESS
            // if(!newPokemon.image)
            //     newPokemon.image = utils.getImage("./images/icons/", "icon_question.png");
            // else
            //     newPokemon.image = await utils.getImage("../data/images/", newPokemon.image);
            //
            // if(!newPokemon.sprite)
            //     newPokemon.sprite = utils.getImage("./images/icons/", "icon_question.png");
            // else
            //     newPokemon.sprite = await utils.getImage("../data/sprites/", newPokemon.sprite);

            const queryText = `
                INSERT INTO ${schema}.pokemons (id, name_en, name_fr, type, hp, attack, attack_sp, defense, defense_sp, speed, image, sprite)
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
            `;
            const values = [newPokemon.id, newPokemon.name.en, newPokemon.name.fr, newPokemon.type, newPokemon.stats.hp,
                newPokemon.stats.attack, newPokemon.stats.attack_sp, newPokemon.stats.defense,
                newPokemon.stats.defense_sp, newPokemon.stats.speed, newPokemon.image, newPokemon.sprite];

            await client.query(queryText, values);
            return true;
        } catch (err) {
            console.error("Error adding Pokemon: ", err);
            return false;
        } finally {
            client.release();
        }
    }

    /**
     * Removes a Pokémon record from the database by its ID.
     * @async
     * @param {number} id - The ID of the Pokémon to remove.
     * @returns {boolean} - A boolean indicating whether the operation was successful.
     */
    async removePokemon(id) {
        const client = await this._pool.connect();
        try {
            await client.query(`DELETE FROM ${schema}.pokemons WHERE id = $1`, [id]);
            return true;
        } catch (err) {
            console.error("Error removing Pokemon: ", err);
            return false;
        } finally {
            client.release();
        }
    }

    /**
     * Updates an existing Pokémon record in the database with new data.
     * @async
     * @param {number} id - The ID of the Pokémon to update.
     * @param {Object} newData - The new data to update the Pokémon record with.
     * @returns {boolean} - A boolean indicating whether the operation was successful.
     */
    async updatePokemon(id, newData) {
        const client = await this._pool.connect();
        try {
            let queryText = `
                UPDATE ${schema}.pokemons
                SET
            `;
            const values = [];
            let valueIndex = 1;

            const image = await utils.getImage("../data/images/", newData.image);
            const sprite = await utils.getImage("../data/sprites/", newData.sprite);

            if (newData.id) {
                queryText += `id = $${valueIndex}, `;
                values.push(newData.id);
                valueIndex++;
            }
            if (newData.name) {
                if (newData.name.en){
                    queryText += `name_en = $${valueIndex}, `;
                    values.push(newData.name.en);
                    valueIndex++;
                }
                if (newData.name.fr){
                    queryText += `name_fr = $${valueIndex}, `;
                    values.push(newData.name.fr);
                    valueIndex++;
                }
            }
            if (newData.type) {
                queryText += `type = $${valueIndex}, `;
                values.push(newData.type);
                valueIndex++;
            }
            if (newData.stats) {
                if (newData.stats.hp) {
                    queryText += `hp = $${valueIndex}, `;
                    values.push(newData.stats.hp);
                    valueIndex++;
                }
                if (newData.stats.attack) {
                    queryText += `attack = $${valueIndex}, `;
                    values.push(newData.stats.attack);
                    valueIndex++;
                }
                if (newData.stats.attack_sp) {
                    queryText += `attack_sp = $${valueIndex}, `;
                    values.push(newData.stats.attack_sp);
                    valueIndex++;
                }
                if (newData.stats.defense) {
                    queryText += `defense = $${valueIndex}, `;
                    values.push(newData.stats.defense);
                    valueIndex++;
                }
                if (newData.stats.defense_sp) {
                    queryText += `defense_sp = $${valueIndex}, `;
                    values.push(newData.stats.defense_sp);
                    valueIndex++;
                }
                if (newData.stats.speed) {
                    queryText += `speed = $${valueIndex}, `;
                    values.push(newData.stats.speed);
                    valueIndex++;
                }
            }
            if (image){
                queryText += `image = $${valueIndex}, `;
                values.push(image);
                valueIndex++;
            }
            if (sprite){
                queryText += `sprite = $${valueIndex}, `;
                values.push(sprite);
                valueIndex++;
            }

            queryText = queryText.slice(0, -2);
            queryText += ` WHERE id = $${valueIndex};`;

            values.push(id);

            await client.query(queryText, values);
            return true;
        } catch (err) {
            console.error("Error adding Pokemon: ", err);
            return false;
        } finally {
            client.release();
        }
    }

    /**
     * Retrieves the maximum ID from the Pokémon records.
     * @async
     * @returns {number} - The maximum ID.
     */
    async getMaxId() {
        const client = await this._pool.connect();
        try {
            const result = await client.query(`SELECT MAX(id) FROM ${schema}.pokemons`);
            return result.rows[0].max;
        } catch (err) {
            console.error("Error getting max ID: ", err);
        } finally {
            client.release();
        }
    }

    /**
     * Retrieves the total count of Pokémon records in the database.
     * @async
     * @returns {number} - The total count of Pokémon records.
     */
    async countAll(where = 'ALL'){
        const client = await this._pool.connect();
        try {
            let sql;
            let result;
            let rows;
            if (where === "ALL") {
                result = await client.query(`SELECT COUNT(id) FROM ${schema}.pokemons`);
            }
            else {
                sql = `SELECT COUNT(id) FROM ${schema}.pokemons WHERE $1 = ANY(type)`;
                rows = await client.query(sql, [where]);
            }

            if (rows) {
                return rows.rows[0].count;
            }

            return result.rows[0].count;
        } catch (err) {
            console.error("Error getting count: ", err);
        } finally {
            client.release();
        }
    }

    /**
     * Retrieves all distinct Pokémon types from the database.
     * @async
     * @returns {Object} - An object containing an array of distinct Pokémon types.
     * @property {string[]} types - An array of distinct Pokémon types.
     */
    async queryAllTypes(){
        const client = await this._pool.connect();
        try {
            const result = await client
                .query(`SELECT DISTINCT unnest(type) AS type FROM ${schema}.pokemons ORDER BY type ASC;`);

            const types = result.rows.map(row => row.type);

            return { types };
        } catch (err) {
            console.error("Error getting types: ", err);
        } finally {
            client.release();
        }
    }


}
