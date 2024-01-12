/**
 * @fileoverview
 * This file contains JavaScript tests for the PokAPI/v2, covering API requests and Passport authentication.
 * It uses the Mocha testing framework along with Chai for assertions and Supertest for HTTP assertions.
 *
 * Make sure to start the service and execute Initdb.js before running the tests to ensure a clean database state.
 * Additionally, run addUser.js and addAdmin.js to create a basic user and an admin, required for the tests.
 * After running the tests, comment out the lines in routes.js that start the server, as Supertest manages ports automatically.
 * Uncomment these lines after the tests to use the services.
 *
 * @author Vinc/Mig/Max
 */

const {expect} = require('chai');

const request = require('supertest');
const app = require('../../routes.js');
const {joiIdSchema, joiNewPokemonSchema} = require('../backend/joiSchemas');

/** Main tests for the application. */
describe('PokAPI/v2', ()=>{
    let username = 'PokAdmin';
    let password = 'admin';

    /** Subtests to tests the main requests. */
    describe('API', ()=>{
        const agent = request.agent(app);

        before(async () => {
            await agent
                .post('/v2/logged')
                .set('Content-Type', 'application/x-www-form-urlencoded')
                .send(`username=${username}&password=${password}`)
                .redirects(1)
                .expect(200);
        });

        /** Subtests for some of the GET requests. */
        describe('GET /pokemons/id', ()=>{
            it('ID existing pokemon', async () => {
                let id = 3;
                const {error: joiIdError, value: validId} = joiIdSchema.validate(id);
                expect(joiIdError).to.be.undefined;

                await agent
                    .get(`/v2/pokemons/${validId}`)
                    .expect(200);
            });

            it('ID non-existing pokemon', async () => {
                let id = 20000000;
                const {error: joiIdError, value: validId} = joiIdSchema.validate(id);
                expect(joiIdError).to.be.undefined;

                await agent
                    .get(`/v2/pokemons/${validId}`)
                    .expect(404);
            });

            it('ID wrong type', async () => {
                let id = 'ASDASD';
                const {error: joiIdError, value: validId} = joiIdSchema.validate(id);
                expect(joiIdError).to.not.be.null;

                await agent
                    .get(`/v2/pokemons/${validId}`)
                    .expect(400);
            });

            it('ID negative', async () => {
                let id = -20;
                const {error: joiIdError, value: validId} = joiIdSchema.validate(id);
                expect(joiIdError).to.not.be.undefined;

                await agent
                    .get(`/v2/pokemons/${validId}`)
                    .expect(400);
            });
        })

        /** Subtests for some of the POST requests. */
        describe('POST /pokemons', ()=>{
            let newPokemon = {
                name: { en: 'test', fr: 'test' },
                type: ['Electric'],
                stats: {
                    hp: 323,
                    attack: 555,
                    attack_sp: 550,
                    defense: 405,
                    defense_sp: 505,
                    speed: 905
                }
            };
            let pokemonDataAlreadyExisting = {
                name: { en: 'Pikachu', fr: 'Pikachu' },
                type: ['Electric'],
                stats: {
                    hp: 35,
                    attack: 55,
                    attack_sp: 50,
                    defense: 40,
                    defense_sp: 50,
                    speed: 90
                }
            };
            let pokemonDataWrongStat = {
                name: { en: 'Pikachu', fr: 'Pikachu' },
                type: ['Electric'],
                stats: {
                    hp: '2asdfasd',
                    attack: 55,
                    attack_sp: 50,
                    defense: 40,
                    defense_sp: 50,
                    speed: 90
                }
            };

            it('Create a new pokemon with valid data', async ()  => {
                const {error: joiNewPokemonError, value: validNewPokemon} = joiNewPokemonSchema.validate(newPokemon);
                expect(joiNewPokemonError).to.be.undefined;

                await agent
                    .post('/v2/pokemons')
                    .send(validNewPokemon)
                    .expect(200);
            });

            it('Trying with an already existing pokemon', async ()  => {
                //le schema sera valider car le pokemonDataAlreadyExisting est bon mais il ne pourra pas etre ajouter car deja existant
                const {error: joiNewPokemonError, value: validNewPokemon} = joiNewPokemonSchema.validate(pokemonDataAlreadyExisting);
                expect(joiNewPokemonError).to.be.undefined;

                await agent
                    .post('/v2/pokemons')
                    .send(pokemonDataAlreadyExisting)
                    .expect(409);

            });

            it('Can\'t create a new pokemon with non-valid data', async ()  => {
                await agent
                    .post('/v2/pokemons')
                    .send(pokemonDataWrongStat)
                    .expect(400);

            });
        })

        /** Subtests for some of the DELETE requests. */
        describe('DELETE /pokemons/id', ()=>{
            it('Deleting existing ID', async () => {
                //ne fonctionnera que la premiere fois que vous l'executer
                // ensuite il ne trouvera pas le pokemon car vous l'avez deja supprimer
                let id = 33;
                const {error: joiIdError, value: validId} = joiIdSchema.validate(id);
                expect(joiIdError).to.be.undefined;

                await agent
                    .delete(`/v2/pokemons/${validId}`)
                    .expect(200);
            });

            it('Deleting non-existing ID', async () => {
                let id = 11111111;
                const {error: joiIdError, value: validId} = joiIdSchema.validate(id);
                expect(joiIdError).to.be.undefined;

                await agent
                    .delete(`/v2/pokemons/${validId}`)
                    .expect(404);
            });

            it('Deleting wrong type ID', async () => {
                let id = 'toto';
                const {error: joiIdError, value: validId} = joiIdSchema.validate(id);
                expect(joiIdError).to.not.be.undefined;

                await agent
                    .delete(`/v2/pokemons/${validId}`)
                    .expect(400);
            });

            it('Deleting negative ID', async () => {
                let id = -11;
                const {error: joiIdError, value: validId} = joiIdSchema.validate(id);
                expect(joiIdError).to.not.be.undefined;

                await agent
                    .delete(`/v2/pokemons/${validId}`)
                    .expect(400);
            });
        })
    })

    /** Subtests to tests the main requests linked to user authentication and registration. */
    describe('PASSPORT', ()=>{

        /** Subtests for the authentification of a user. */
        describe('POST /logged', ()=>{
            it('Should authenticate a user', async () => {
                await request(app)
                    .post('/v2/logged')
                    .set('Content-Type', 'application/x-www-form-urlencoded')
                    .send(`username=${username}&password=${password}`)
                    .redirects(1)
                    .expect(200);

            });

            it('Do not authenticate a user', async () => {
                const wrongUsername = 'toto';
                const wrongPassword = 'asdasdas'

                await request(app)
                    .post('/v2/logged')
                    .set('Content-Type', 'application/x-www-form-urlencoded')
                    .send(`username=${wrongUsername}&password=${wrongPassword}`)
                    .redirects(1)
                    .expect(200);
            });
        })
    })
})