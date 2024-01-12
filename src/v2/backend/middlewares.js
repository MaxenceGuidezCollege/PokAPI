
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
const parsePage = database => {
    return async (req, res, next) => {
        const perPage = Number.parseInt(req.query.per_page ?? 50);
        const page = Number.parseInt(req.query.page ?? 1);
        const type = req.query.type ?? "ALL";

        if(!utils.isInt(perPage)) return res.status(400).send("The specified number of elements per page is not an integer.").end();
        if(!utils.isInt(page)) return res.status(400).send("The specified page is not an integer.").end();
        if(perPage <= 0) return res.status(400).send("The number of elements per page should be greater than 0.").end();
        if(perPage > 100) return res.status(400).send("The number of elements per page should be lower than 100.").end();
        if(page <= 0) return res.status(400).send("The page should be greater than 0.").end();
        if(utils.isInt(type)) return res.status(400).send("The type is not an string.").end();

        const first = (page - 1) * perPage;
        let totalPokemons;
        if (type === "ALL") {
            totalPokemons = await database.countAll();
        }
        else {
            totalPokemons = await database.countAll(type);
        }

        if (first >= totalPokemons) return res.status(422).send("The actual page is out of bound.").end();

        const pageCount = Math.ceil(totalPokemons / perPage);

        let isTypesInDB = false;
        if ( type !== "ALL"){
            const allTypes = await database.queryAllTypes();

            for (let typeInDB of allTypes.types) {
                if (type === typeInDB) isTypesInDB = true;
            }
        }
        else {
            isTypesInDB = true;
        }

        if (!isTypesInDB) return res.status(400).send("No Pokémon exists with this type.").end();

        req.pageInfo = {
            perPage,
            page,
            type,
            pageCount,
            totalPokemons
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
    if (!args.includes('*/*')) args.push('*/*');

    return (req, res, next) => {
        if (!req.accepts(...args)) {
            return res.status(406).send("The response type is not acceptable.").end();
        } else {
            next();
        }
    }
}

/**
 * Express middleware for handling errors and sending a 500 Internal Server Error response.
 *
 * @param {Error} err - The error object to be handled.
 * @param {import('express').Request} req - The Express request object.
 * @param {import('express').Response} res - The Express response object.
 * @param {import('express').NextFunction} next - The next function to pass control to the next middleware.
 */
const errorManager = (err, req, res, next) => {
    res.status(500).send(err.message);
};

const authenticate = (req, res, next) => {
    if(req.isAuthenticated()){
        next();
    }
    else {
        return res.redirect(401, '/v2/a14n/signIn.html');
    }
}

const authorized = role => {
    return (req, res, next) => {
        if (req.user.role === role){
            next();
        }
        else {
            res.sendStatus(403);
        }
    }
}

module.exports = {
    parsePage,
    isMime,
    acceptsMime,
    errorManager,
    authenticate,
    authorized
}
