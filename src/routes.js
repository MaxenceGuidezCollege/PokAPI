
/**
 * @fileoverview
 * Main server file for Pokémon management application.
 * This file configures the Express server, defines the main routes, and starts the server.
 *
 * @author Vinc/Mig/Max
 */

const express = require("express");
const app = express();

Object.defineProperty(app.request, 'fullBaseUrl', {
    configurable: true,
    enumerable: true,
    get () {
        const base = new URL(`${this.protocol}://${this.get('host')}`);
        const url = new URL(this.baseUrl + this.path, base);
        return url.toString().replace(/\/$/, '');
    }
})

const {router: routerV1} = require("./v1/backend/pokemons.js");
const {router: routerV2} = require("./v2/backend/pokemons.js");
const port = process.env.PORT || 3000;
const isTesting = (/true/i).test(process.env.TESTING) || false;

app
    .use('/v1', routerV1)
    .use('/v2', routerV2);

if (!isTesting) {
    app.listen(port, () => {
        console.log(`Server listening at http://localhost:${port} \nGet last version on http://localhost:${port}/v2/`);
    });
}

module.exports = app;
