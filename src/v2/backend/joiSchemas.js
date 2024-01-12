const Joi = require('joi');
const utils = require('./utils.js');

const joiIdSchema = Joi.number().integer().min(0).required();

const joiNewPokemonSchema = Joi.object({
    id: Joi.number().integer().forbidden(),
    name: Joi.object({
        en: Joi.string().required(),
        fr: Joi.string().required(),
    }).required(),
    type: Joi.array().items(Joi.string().valid(...utils.getPokemonTypes())).min(1).required(),
    stats: Joi.object({
        hp: Joi.number().integer().min(0).required(),
        attack: Joi.number().integer().min(0).required(),
        attack_sp: Joi.number().integer().min(0).required(),
        defense: Joi.number().integer().min(0).required(),
        defense_sp: Joi.number().integer().min(0).required(),
        speed: Joi.number().integer().min(0).required(),
    }).required(),
    image: Joi.string().optional(),
    sprite: Joi.string().optional(),
}).required();

const joiUpdatePokemonSchema = joiNewPokemonSchema.keys({
    name: Joi.object({
        en: Joi.optional(),
        fr: Joi.optional(),
    }).optional(),
    type: Joi.optional(),
    stats: Joi.object({
        hp: Joi.optional(),
        attack: Joi.optional(),
        attack_sp: Joi.optional(),
        defense: Joi.optional(),
        defense_sp: Joi.optional(),
        speed: Joi.optional(),
    }).optional(),
});

const joiUpdateUserSchema = Joi.object({
    username: Joi.string().optional(),
    email: Joi.string().optional(),
    pwd_hash: Joi.string().optional(),
    role: Joi.string().valid('ADMIN', 'USER').optional(),
});

module.exports = {
    joiIdSchema,
    joiNewPokemonSchema,
    joiUpdatePokemonSchema,
    joiUpdateUserSchema
};
