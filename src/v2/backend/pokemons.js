/**
 * @fileoverview
 * Routes and middleware for managing Pokémon data and images.
 *
 * @authors Vinc/Mig/Max
 */

const express = require("express");
const bodyParser = require('body-parser');
const flash = require('connect-flash');

const crypto = require("crypto");
const salt = process.env.SALT || 'salt the cat in the hat';

const cors = require('cors');
const corsOptions = {
    origin: ['http://localhost:80', 'TODO : heroku'],
    optionsSuccessStatus: 200
}

const utils = require("./utils.js");
const mid = require('./middlewares');
const createPdf = require('./pdfSystem/createPdf.js');
const {
    joiIdSchema,
    joiNewPokemonSchema, joiUpdatePokemonSchema,
    joiUpdateUserSchema
} = require('./joiSchemas');

const {Database} = require("../database/database");
const database = new Database();

const router = express.Router();

const MIME_JSON = 'application/json';
const MIME_PDF = 'application/pdf';
const MIME_PNG = 'image/png';

const passport = require('passport');
const LocalStrategy = require(`passport-local`);
const CookieSession = require(`cookie-session`);

passport
    .use('logged', new LocalStrategy(async (username, password, cb) => {
        const user = await database.queryUserByUsername(username);
        if (!user) return cb(null, false, {message: 'Incorrect username or password.'});

        crypto.pbkdf2(password, salt, 310000, 32, 'sha256',
            (err, hashedPassword) => {
            if (err) return cb(err);

            if (!crypto.timingSafeEqual(user.pwd_hash, hashedPassword)) {
                return cb(null, false, {message: 'Incorrect username or password.'});
            }
            return cb(null, user);
        });
    }))
    .use('registered', new LocalStrategy({passReqToCallback: true}, async (req, username, password, cb) => {
        const email = req.body.email;

        const userByUsername = await database.queryUserByUsername(username);
        if (userByUsername) return cb(null, false, {message: 'A user already exists with this username.'});
        const userByEmail = await database.queryUserByEmail(email);
        if (userByEmail) return cb(null, false, {message: 'A user already exists with this email.'});

        if (password !== req.body.confirmPassword)
            return cb(null, false, {message: 'Your password and confirmation password do not match.'});

        crypto.pbkdf2(password, salt, 310000, 32, 'sha256',
            (err, hashedPassword) => {
            if (err) return cb(err);

            const user = {
                username: username,
                email: email,
                pwd_hash: hashedPassword,
                role: 'USER',
            };
            database.addUser(user);
            return cb(null, user);
        });
    }));

passport.serializeUser((user, cb) => {
    cb(null, { ...user, pwd_hash: undefined });
});
passport.deserializeUser((user, cb) => {
    cb(null, user);
});

router
    .use(cors(corsOptions))
    .use(bodyParser.json())
    .use(bodyParser.urlencoded())
    .use(express.static(__dirname + '/../frontend'))
    .use(CookieSession({
        name: 'session',
        keys: [
            '03c5c0e66cae0648870cdb4b261dcd7bcc446dcde10f7594900aca49df3b073e',
            'c1adb5768c7224b7055c02faec8fdf2e2cbc69b82f1a6e2a9a6dd96fa7bef164'
        ],
        maxAge: 24 * 60 * 60 * 1000 // 24 hours
    }))
    .use(flash())
    .use(passport.authenticate('session'))

    /** Handle user authentication. */
    .post('/logged', passport.authenticate('logged', {
            successRedirect: '/v2/',
            failureRedirect: '/v2/a14n/signIn.html',
            failureFlash: true
        })
    )

    /** Handle user registration. */
    .post('/registered', passport.authenticate('registered', {
            successRedirect: '/v2/a14n/signIn.html',
            failureRedirect: '/v2/a14n/signUp.html',
            failureFlash: true,
            session: false // Keep to false (User must sign in after sign up.)
        })
    )

    /** Handle user log out. */
    .post('/logout', function(req, res, next){
        req.logout();
        return res.redirect(205, '/v2/a14n/signIn.html');
    })

    /** Get the first error message from the flash session. */
    .get('/flash/error', (req,res)=>{
        let error;
        if (req.session.flash.error) error = req.session.flash.error[0]
        res.send(error);
    })

    /** Delete the errors messages from the flash session. */
    .delete('/flash/error', (req,res)=>{
        if (req.session.flash.error) delete req.session.flash.error;
        res.sendStatus(200);
    })

    .use(mid.authenticate)

    /** Get details of the actual user. */
    .get('/user', (req, res)=>{
        const baseUrl = req.fullBaseUrl;
        const user = req.user;

        user.details = `${baseUrl}`;

        res.send(user);
    })

    /** Update the actual user data. */
    .put('/user', mid.acceptsMime(MIME_JSON), mid.isMime(MIME_JSON), async (req, res)=>{
        const userId = req.user.id;
        const { error: joiIdError, value: validId } = joiIdSchema.validate(userId);
        if (joiIdError)
            return res.status(400).send(`Invalid id parameter: ${joiIdError.message}`);

        if (await database.queryUserByID(parseInt(validId))){
            const { error: joiUpdatedUserError, value: validUpdatedUser } = joiUpdateUserSchema.validate(req.body);
            if (joiUpdatedUserError)
                return res.status(400).send(`Invalid updated user: ${joiUpdatedUserError.message}`);

            if (validUpdatedUser.email) {
                // Keep to await
                // noinspection ES6RedundantAwait
                const existingUser = await database.queryUserByEmail(validUpdatedUser.email);

                if (existingUser && existingUser.id !== parseInt(validId))
                    return res.status(409).send("A user already exists with this email.");
            }
            if (validUpdatedUser.pwd_hash) {
                validUpdatedUser.pwd_hash = await new Promise((resolve, reject) => {
                    crypto.pbkdf2(validUpdatedUser.pwd_hash, salt, 310000, 32, 'sha256', (err, hashedPassword) => {
                        if (err) {
                            reject(err);
                        } else {
                            resolve(hashedPassword);
                        }
                    });
                });
            }

            if (!database.updateUser(validId, validUpdatedUser))
                return res.status(400).send("There is an error in the update of the user.");
        }
        else {
            return res.status(400).send("");
        }

        // Keep to await
        // noinspection ES6RedundantAwait
        res.json(await database.queryUserByID(parseInt(userId))).status(200);
    })

    /** Get a list of Pokémon. */
    .get('/pokemons', mid.acceptsMime(MIME_JSON), mid.parsePage(database), async (req, res) => {
        const baseUrl = req.fullBaseUrl;

        const {
            perPage,
            page,
            type,
            pageCount,
            totalPokemons
        } = req.pageInfo;

        // Keep to await
        // noinspection ES6RedundantAwait
        let pokemons = await database.queryForAll(req.pageInfo, 'id, name_en, sprite', type, 'id');
        for (let pokemon of pokemons) {
            pokemon.details = `${baseUrl}/${pokemon.id}`
            pokemon.sprite = `${baseUrl}/${pokemon.id}/sprite`
        }

        const url = `${baseUrl}?per_page=${perPage}&type=${type}`;
        const nextPage = page >= pageCount ? undefined : `${url}&page=${page + 1}`;
        const prevPage = page <= 1 ? undefined : `${url}&page=${page - 1}`;
        const curPage = `${url}&page=${page}`;
        const pdfPage = `${baseUrl}.pdf?per_page=${perPage}&page=${page}&type=${type}`;
        const lastPage = `${url}&page=${pageCount}`;
        const firstPage = `${url}&page=1`;

        const result = {
            page,
            perPage,
            type,
            pokemons,
            totalPokemons,
            nextPage,
            prevPage,
            lastPage,
            firstPage,
            curPage,
            pdfPage,
            pageCount,
        }

        res.json(result);
    })

    /** Generate a PDF document containing Pokémon data. */
    .get('/pokemons.pdf', mid.acceptsMime(MIME_PDF), mid.parsePage(database), async (req, res) => {
        const {type} = req.pageInfo;

        // Keep to await
        // noinspection ES6RedundantAwait
        let pokemons = await database.queryForAll(req.pageInfo,'*', type, 'id');
        createPdf(pokemons, type, res);

        res.setHeader('Content-Disposition', `attachment; filename="pokemons.pdf"`);
    })

    /** Get a Pokémon's image by ID. */
    .get('/pokemons/:id/image', mid.acceptsMime(MIME_PNG), async (req,res)=>{
        const { error: joiIdError, value: validIdInUrl } = joiIdSchema.validate(req.params.id);
        if (joiIdError) return res.status(400).send(`Invalid id parameter: ${joiIdError.message}`);

        const pokemon = await database.queryById(validIdInUrl);
        if (!pokemon) return res.status(404).send("No Pokémon exists with this id.");

        // Keep to await
        // noinspection ES6RedundantAwait
        let data = await database.queryById(validIdInUrl, 'image');
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
        const { error: joiIdError, value: validIdInUrl } = joiIdSchema.validate(req.params.id);
        if (joiIdError) return res.status(400).send(`Invalid id parameter: ${joiIdError.message}`);

        const pokemon = await database.queryById(validIdInUrl);
        if (!pokemon) return res.status(404).send("No Pokémon exists with this id.");

        // Keep to await
        // noinspection ES6RedundantAwait
        let data = await database.queryById(validIdInUrl, 'sprite');
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
    .get('/pokemons/types', mid.acceptsMime(MIME_JSON), async (req, res) => {
        // Keep to await
        // noinspection ES6RedundantAwait
        const types = await database.queryAllTypes();

        if (!types) return res.status(404).send("Types not founds.");

        res.json(types);
    })

    /** Get details of a Pokémon by ID. */
    .get('/pokemons/:id', mid.acceptsMime(MIME_JSON), async (req, res) => {
        const { error: joiIdError, value: validIdInUrl } = joiIdSchema.validate(req.params.id);
        if (joiIdError) return res.status(400).send(`Invalid id parameter: ${joiIdError.message}`);

        const baseUrl = req.fullBaseUrl;

        // Keep to await
        // noinspection ES6RedundantAwait
        const pokemon = await database.queryById(validIdInUrl);
        if (!pokemon) return res.status(404).send("No Pokémon exists with this id.");

        pokemon.image = `${baseUrl}/image`;
        pokemon.sprite = `${baseUrl}/sprite`;
        pokemon.details = `${baseUrl}`;

        res.json(pokemon);
    })

    .use(mid.authorized('ADMIN'))

    /** Add a new Pokémon. */
    .post('/pokemons', mid.acceptsMime(MIME_JSON), mid.isMime(MIME_JSON), async (req, res) => {
        const { error: joiNewPokemonError, value: validNewPokemon } = joiNewPokemonSchema.validate(req.body);
        if (joiNewPokemonError) return res.status(400).send(`Invalid Pokémon: ${joiNewPokemonError.message}`);

        const errorUniqueness = await utils.verifyUniqueness(validNewPokemon, database);
        if (errorUniqueness) return res.status(409).send(errorUniqueness);

        // Keep to await
        // noinspection ES6RedundantAwait
        let nextId = await database.getActualId() + 1;

        if(!validNewPokemon.image) validNewPokemon.image = utils.getImageName(nextId);
        if(!validNewPokemon.sprite) validNewPokemon.sprite = utils.getSpriteName(nextId);

        if (!database.addPokemon(validNewPokemon))
            return res.status(400).send("There is an error in the insertion of the Pokémon.");

        // Keep to await
        // noinspection ES6RedundantAwait
        res.json(await database.queryById(validNewPokemon.id)).status(200);
    })

    /** Update a Pokémon's data or add new if doesn't exist. */
    .put('/pokemons/:id', mid.acceptsMime(MIME_JSON), mid.isMime(MIME_JSON), async (req, res) => {
        const { error: joiIdInUrlError, value: validIdInUrl } = joiIdSchema.validate(req.params.id);
        if (joiIdInUrlError)
            return res.status(400).send(`Invalid id parameter: ${joiIdInUrlError.message}`);

        if (await database.queryById(parseInt(validIdInUrl))){
            const { error: joiUpdatedPokemonError, value: validUpdatedPokemon } = joiUpdatePokemonSchema.validate(req.body);
            if (joiUpdatedPokemonError)
                return res.status(400).send(`Invalid updated Pokémon: ${joiUpdatedPokemonError.message}`);

            if (validUpdatedPokemon.name.en) {
                // Keep to await
                // noinspection ES6RedundantAwait
                const existingPokemon = await database.queryByName(validUpdatedPokemon.name.en, "en");

                if (existingPokemon && existingPokemon.id !== parseInt(validIdInUrl))
                    return res.status(409).send("A Pokémon already exists with this English name.");
            }

            if (validUpdatedPokemon.name.fr) {
                // Keep to await
                // noinspection ES6RedundantAwait
                const existingPokemon = await database.queryByName(validUpdatedPokemon.name.fr, "fr");

                if (existingPokemon && existingPokemon.id !== parseInt(validIdInUrl))
                    return res.status(409).send("A Pokémon already exists with this French name.");
            }

            validUpdatedPokemon.image = utils.getImageName(validIdInUrl);
            validUpdatedPokemon.sprite = utils.getSpriteName(validIdInUrl);

            if (!database.updatePokemon(validIdInUrl, validUpdatedPokemon))
                return res.status(400).send("There is an error in the update of the Pokémon.");
        }
        else {
            const { error: joiPutPokemonError, value: validNewPokemon } = joiNewPokemonSchema.validate(req.body);
            if (joiPutPokemonError)
                return res.status(400).send(`Invalid new Pokémon: ${joiPutPokemonError.message}`);

            const errorUniqueness = await utils.verifyUniqueness(validNewPokemon, database);
            if (errorUniqueness) return res.status(409).send(errorUniqueness).end();

            validNewPokemon.image = utils.getImageName(validIdInUrl);
            validNewPokemon.sprite = utils.getSpriteName(validIdInUrl);

            if (!database.addPokemon(validNewPokemon))
                return res.status(400).send("There is an error in the insertion of the Pokémon.");
        }

        // Keep to await
        // noinspection ES6RedundantAwait
        res.json(await database.queryById(parseInt(validIdInUrl))).status(200);
    })

    /** Delete a Pokémon by ID. */
    .delete('/pokemons/:id', async (req, res) => {
        const { error: joiIdError, value: validIdInUrl } = joiIdSchema.validate(req.params.id);
        if (joiIdError) return res.status(400).send(`Invalid id parameter: ${joiIdError.message}`);

        // Keep to await
        // noinspection ES6RedundantAwait
        if (!await database.queryById(validIdInUrl))
            return res.status(404).send("No Pokémon exists with this id.");

        if (!database.removePokemon(validIdInUrl))
            return res.status(400).send("There is an error in the deletion of the Pokémon.");

        res.send("The Pokemon has been successfully deleted").status(200);
    })

    .use(mid.errorManager);

module.exports.router = router;
