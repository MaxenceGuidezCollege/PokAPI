
/**
 * @fileoverview
 * Routes and middleware for managing Pokémon data and images.
 *
 * @authors Vinc/Mig/Max
 */

const express = require("express");
const bodyParser = require('body-parser');



const utils = require("./utils.js");
const mid = require('./middlewares');
const createPdf = require('./pdf_system/create_pdf.js');

const {Database} = require("../database/database");
const database = new Database();

const router = express.Router();

const MIME_JSON = 'application/json';
const MIME_PDF = 'application/pdf';
const MIME_PNG = 'image/png';

//TODO: Create a functions.js file to empty the pokemons.js file

router
    .use(mid.cors)
    .use(bodyParser.json())

    /** Initialize the database and populate it with initial data. */
    .get('/initdb', async (req,res)=>{
        await database.emptyDatabase();
        await database.initDatabaseData();

        res.status(200).end();
    })

    /** Get a list of Pokémon. */
    .get('/pokemons', mid.parsePage(database), async (req, res) => {
        const base_url = utils.getBaseUrl(req);

        const {
            per_page,
            page,
            type,
            page_count,
            total_pokemons
        } = req.pageInfo;

        // Keep to await
        // noinspection ES6RedundantAwait
        let pokemons = await database.queryForAll(req.pageInfo, 'id, name_en, sprite', type, 'id');
        for (let pokemon of pokemons) {
            pokemon.details = `${base_url}/${pokemon.id}`
            pokemon.sprite = `${base_url}/${pokemon.id}/sprite`
        }

        const url = `${base_url}?per_page=${per_page}&type=${type}`;
        const next_page = page >= page_count ? undefined : `${url}&page=${page + 1}`;
        const prev_page = page <= 1 ? undefined : `${url}&page=${page - 1}`;
        const cur_page = `${url}&page=${page}`;
        const pdf_page = `${base_url}.pdf?per_page=${per_page}&page=${page}&type=${type}`;
        const last_page = `${url}&page=${page_count}`;
        const first_page = `${url}&page=1`;

        const result = {
            page,
            per_page,
            type,
            pokemons,
            total_pokemons,
            next_page,
            prev_page,
            last_page,
            first_page,
            cur_page,
            pdf_page,
            page_count,
        }

        res.json(result).end();
    })

    /** Generate a PDF document containing Pokémon data. */
    .get('/pokemons.pdf', mid.acceptsMime(MIME_PDF), mid.parsePage(database), async (req, res) => {
        const {type} = req.pageInfo;

        // Keep to await
        // noinspection ES6RedundantAwait
        let pokemons = await database.queryForAll(req.pageInfo,'*', type, 'id');
        createPdf(pokemons, type, res);
    })

    /** Get a Pokémon's image by ID. */
    .get('/pokemons/:id/image', mid.acceptsMime(MIME_PNG), async (req,res)=>{
        const id = req.params.id;

        if (!utils.isInt(id)) return res.status(400).send("The specified id is not an integer.").end();
        if (id < 0) return res.status(400).send("The specified id can't be a negative number.").end();

        const pokemon = await database.queryById(id);
        if (!pokemon) return res.status(404).send("No Pokémon exists with this id.").end();

        // Keep to await
        // noinspection ES6RedundantAwait
        let data = await database.queryById(id, 'image');
        const blob = new Blob([data.image], { type: MIME_PNG });

        let image;
        if ((await blob.arrayBuffer()).byteLength === 4){
            image = await utils.getImage("../frontend/images/icons/", "icon_question.png");
        }
        else {
            image = await utils.createImageFromBlob(blob);

            if(!image) image = await utils.getImage("../frontend/images/icons/", "icon_question.png");
        }

        res.writeHead(200, {
            'Content-Type': MIME_PNG,
            'Content-Length': image.length,
        }).end(image);
    })

    /** Get a Pokémon's sprite by ID. */
    .get('/pokemons/:id/sprite', mid.acceptsMime(MIME_PNG), async (req,res)=>{
        const id = req.params.id;
        if (!utils.isInt(id)) return res.status(400).send("The specified id is not an integer.").end();
        if (id < 0) return res.status(400).send("The specified id can't be a negative number.").end();

        const pokemon = await database.queryById(id);
        if (!pokemon) return res.status(404).send("No Pokémon exists with this id.").end();

        // Keep to await
        // noinspection ES6RedundantAwait
        let data = await database.queryById(id, 'sprite');
        const blob = new Blob([data.sprite], { type: MIME_PNG });

        let sprite;
        if ((await blob.arrayBuffer()).byteLength === 4){
            sprite = await utils.getImage("../frontend/images/icons/", "icon_question.png");
        }
        else {
            sprite = await utils.createImageFromBlob(blob);

            if(!sprite) sprite = await utils.getImage("../frontend/images/icons/", "icon_question.png");
        }

        res.writeHead(200, {
            'Content-Type': MIME_PNG,
            'Content-Length': sprite.length,
        }).end(sprite);
    })

    /** Get details of all unique types. */
    .get('/pokemons/types', async (req, res) => {
        // Keep to await
        // noinspection ES6RedundantAwait
        const types = await database.queryAllTypes();

        if (!types) return res.status(404).send("Types not founds.").end();

        res.json(types).end();
    })

    /** Get details of a Pokémon by ID. */
    .get('/pokemons/:id', async (req, res) => {
        const id = req.params.id;
        const base_url = utils.getBaseUrl(req);

        if(!utils.isInt(id)) return res.status(400).send("The specified id is not an integer.").end();
        if (id < 0) return res.status(400).send("The specified id can't be a negative number.").end();

        // Keep to await
        // noinspection ES6RedundantAwait
        const pokemon = await database.queryById(id);

        if (!pokemon) return res.status(404).send("No Pokémon exists with this id.").end();

        pokemon.image = `${base_url}/image`;
        pokemon.sprite = `${base_url}/sprite`;

        res.json(pokemon).end();
    })

    /** Add a new Pokémon. */
    .post('/pokemons', mid.isMime(MIME_JSON), async (req, res) => {
        const newPokemon = req.body;

        if (!newPokemon || Object.keys(newPokemon).length === 0 || JSON.stringify(newPokemon) === "{}")
            return res.status(400).send("There is no data.").end();

        if (!utils.verifyInputFields(newPokemon))
            return res.status(400).send("Your data is not valid. Some field(s) are missing.").end();

        const error = await utils.verifyUniqueness(database, newPokemon);
        if (error) return res.status(400).send(error).end();

        if(utils.isArrayEmpty(newPokemon.type))
            return res.status(400).send("Some of the selection of types, are empty.").end();
        if (!utils.isArrayInTypes(newPokemon.type, (await database.queryAllTypes()).types))
            return res.status(400).send("The selection of types, are not in the types possibilities.").end();
        if (!utils.areStatsCompliant(newPokemon.stats))
            return res.status(400).send("The selection of stats, are not compliant.").end();

        // Keep to await
        if(!newPokemon.id) { // noinspection ES6RedundantAwait
            newPokemon.id = await database.getMaxId() + 1;
        }
        else {
            if (newPokemon.id < 0) return res.status(400).send("The specified id can't be a negative number.").end();
        }

        if(!newPokemon.image) newPokemon.image = utils.getImageName(newPokemon.id);
        if(!newPokemon.sprite) newPokemon.sprite = utils.getSpriteName(newPokemon.id);

        if (!database.addPokemon(newPokemon))
            return res.status(400).send("There is an error in the insertion of the Pokémon.").end();

        // Keep to await
        // noinspection ES6RedundantAwait
        res.json(await database.queryById(newPokemon.id)).status(200);
    })

    /** Update a Pokémon's data or add new if doesn't exist. */
    .put('/pokemons/:id', mid.isMime(MIME_JSON), async (req, res) => {
        const id = req.params.id;
        const newData = req.body;

        if(!utils.isInt(id)) return res.status(400).send("The specified id is not an integer.").end();
        if (id < 0) return res.status(400).send("The specified id can't be a negative number.").end();

        if (!newData || Object.keys(newData).length === 0 || JSON.stringify(newData) === "{}")
            return res.status(400).send("There is no data.").end();

        if (await database.queryById(parseInt(id))){
            if(newData.id){
                if(!utils.isInt(newData.id)) return res.status(400).send("The new id is not an integer.").end();
                if (newData.id < 0) return res.status(400).send("The new id can't be a negative number.").end();

                // Keep to await
                // noinspection ES6RedundantAwait
                if(await database.queryById(newData.id))
                    return res.status(400).send("A Pokémon already exists with this id.").end();

                newData.image = utils.getImageName(newData.id);
                newData.sprite = utils.getSpriteName(newData.id);
            }
            else{
                newData.image = utils.getImageName(id);
                newData.sprite = utils.getSpriteName(id);
            }

            if (newData.type) {
                if(utils.isArrayEmpty(newData.type))
                    return res.status(400).send("Some of the selection of types, are empty.").end();
                if (!utils.isArrayInTypes(newData.type, (await database.queryAllTypes()).types))
                    return res.status(400).send("The selection types, are not in the types possibilities.").end();
            }

            if (newData.stats) {
                if (!utils.areStatsCompliant(newData.stats))
                    return res.status(400).send("The selection of stats, are not compliant.").end();
            }

            if (!database.updatePokemon(id, newData))
                return res.status(400).send("There is an error in the update of the Pokémon.").end();
        }
        else {
            if (!utils.verifyInputFields(newData))
                return res.status(400).send("Your data is not valid. Some field(s) are missing.").end();

            // Keep to await
            // noinspection ES6RedundantAwait
            if(await database.queryByName(newData.name.en, "en"))
                return res.status(400).send("A Pokémon already exists with this English name.").end();

            // Keep to await
            // noinspection ES6RedundantAwait
            if(await database.queryByName(newData.name.fr, "fr"))
                return res.status(400).send("A Pokémon already exists with this French name.").end();

            if(newData.id)
                return res
                    .status(400)
                    .send("To add a new Pokemon, the id must be specified in the url, not in the body.").end();

            newData.id = id;

            if (newData.type) {
                if(utils.isArrayEmpty(newData.type))
                    return res.status(400).send("Some of the selection of types, are empty.").end();
                if (!utils.isArrayInTypes(newData.type, (await database.queryAllTypes()).types))
                    return res.status(400).send("The selection types, are not in the types possibilities.").end();
            }

            if (newData.stats) {
                if (!utils.areStatsCompliant(newData.stats))
                    return res.status(400).send("The selection of stats, are not compliant.").end();
            }

            newData.image = utils.getImageName(newData.id);
            newData.sprite = utils.getSpriteName(newData.id);

            if (!database.addPokemon(newData))
                return res.status(400).send("There is an error in the insertion of the Pokémon.").end();
        }
        let idToRequest = id;
        if (newData.id) idToRequest = newData.id;

        // Keep to await
        // noinspection ES6RedundantAwait
        res.json(await database.queryById(parseInt(idToRequest))).status(200); //TODO: Use GET request to a better display.
    })

    /** Delete a Pokémon by ID. */
    .delete('/pokemons/:id', async (req, res) => {
        const id = req.params.id;

        if (!utils.isInt(id)) return res.status(400).send("The specified id is not an integer.").end();
        if (id < 0) return res.status(400).send("The specified id can't be a negative number.").end();

        // Keep to await
        // noinspection ES6RedundantAwait
        if (!await database.queryById(id))
            return res.status(404).send("No Pokémon exists with this id.").end();

        // TODO : Add all images before delete (in the initdb for example) in a temp file to keep a backup.
        // if (utils.removeImage(imagePath)) {
        //     console.log("Image deleted successfully.");
        // } else {
        //     console.error("Failed to delete image.");
        // }
        //
        // if (utils.removeImage(spritePath)) {
        //     console.log("Image deleted successfully.");
        // } else {
        //     console.error("Failed to delete image.");
        // }

        if (!database.removePokemon(id))
            return res.status(400).send("There is an error in the deletion of the Pokémon.").end();

        res.send("The Pokemon has been successfully deleted").status(200);
    });

module.exports.router = router;
