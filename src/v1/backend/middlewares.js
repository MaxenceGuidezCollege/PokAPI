
/**
 * @fileoverview
 * Utility module containing middleware functions for handling requests and responses.
 *
 * @authors Vinc/Mig/Max
 */

const utils = require("./utils.js");

/**
 * Middleware that parses and validates pagination parameters for requests.
 * @param {Object} database - The database instance for querying total records.
 * @returns {Function} - Express middleware function.
 */
const parsePage = (database) => {
    return async (req, res, next) => {
        const per_page = Number.parseInt(req.query.per_page ?? 50);
        const page = Number.parseInt(req.query.page ?? 1);
        const type = req.query.type ?? "ALL";

        if(!utils.isInt(per_page)) return res.status(400).send("The specified number of elements per page is not an integer.").end();
        if(!utils.isInt(page)) return res.status(400).send("The specified page is not an integer.").end();
        if(per_page <= 0) return res.status(400).send("The number of elements per page should be greater than 0.").end();
        if(page <= 0) return res.status(400).send("The page should be greater than 0.").end();
        if(utils.isInt(type)) return res.status(400).send("The type is not an string.").end();

        const first = (page - 1) * per_page;
        let totalPokemons;
        if (type === "ALL") {
            totalPokemons = await database.countAll();
        }
        else {
            totalPokemons = await database.countAll(type);
        }

        if (first >= totalPokemons) return res.status(422).send("The actual page is out of bound.").end();

        const page_count = Math.ceil(totalPokemons / per_page);

        let isInDB = false;
        if ( type !== "ALL"){
            const allTypes = await database.queryAllTypes();

            for (let typeInDB of allTypes.types) {
                if (type === typeInDB) isInDB = true;
            }
        }
        else {
            isInDB = true;
        }

        if (!isInDB) return res.status(400).send("No Pokémon exists with this type.").end();

        req.pageInfo = {
            per_page,
            page,
            type,
            page_count,
            total_pokemons: totalPokemons
        };

        next();
    };
};

/**
 * Middleware that checks if the request's content type matches specified MIME types.
 * @returns {Function} - Express middleware function.
 */
function isMime() {
    const args = Array.from(arguments);
    return (req, res, next) => {
        if (!req.is(...args)) {
            return res.status(415).send("The request type is not valid.").end();
        } else {
            next();
        }
    }
}

/**
 * Middleware that checks if the response's content type matches specified MIME types.
 * @returns {Function} - Express middleware function.
 */
function acceptsMime() {
    const args = Array.from(arguments);
    return (req, res, next) => {
        if (!req.accepts(...args)) {
            return res.status(406).send("The response type is not acceptable.").end();
        } else {
            next();
        }
    }
}

/**
 * Middleware that sets the 'Access-Control-Allow-Origin' header to allow cross-origin requests.
 * @param {Object} req - Express request object.
 * @param {Object} res - Express response object.
 * @param {Function} next - Express next middleware function.
 */
const cors = (req, res, next) => {
    res.header('access-control-allow-origin', '*');
    next();
};

module.exports = {
    parsePage,
    isMime,
    acceptsMime,
    cors
}
