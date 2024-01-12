
/**
 * @fileoverview
 * Script for initializing the database.
 *
 * @authors Vinc/Mig/Max
 */

const {Database} = require("../../database/database");
const database = new Database();

;(async () => {
    await database.deleteDatabase();
    await database.initDatabaseStructure();
    await database.initDatabaseData();
})();
