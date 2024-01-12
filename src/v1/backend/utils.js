
/**
 * @fileoverview
 * Utility module for managing Pokémon data and images.
 *
 * @description
 * This module provides various functions for handling Pokémon data and images.
 * It includes functions for data validation, image file operations, and more.
 *
 * @authors Vinc/Mig/Max
 */

const fs = require("fs");
const path = require("path");
const version = 'v1';

module.exports = {
    isInt,
    getBaseUrl,
    getImageName,
    getSpriteName,
    getImage,
    removeImage,
    createImageFromBlob,
    verifyInputFields,
    verifyUniqueness,
    formatPokemonData,
    isArrayInTypes,
    isArrayEmpty,
    areStatsCompliant
};

/**
 * Check if a value is an integer.
 * @param {any} n - The value to check.
 * @returns {boolean} True if the value is an integer, false otherwise.
 */
function isInt(n) {
    // Do not use ===
    // noinspection EqualityComparisonWithCoercionJS
    return Number.parseInt(n) == n;
}

/**
 * Get the base URL of a request.
 * @param {Object} req - The Express request object.
 * @returns {string} The base URL.
 */
function getBaseUrl(req){
    return `${req.protocol}://${req.get('host')}/${version}${req.path}`;
}

/**
 * Get the image file name for a Pokémon by its ID.
 * @param {number} id - The ID of the Pokémon.
 * @returns {string} The image file name.
 */
function getImageName(id){
    return id.toString().padStart(4, '0') + ".png";
}

/**
 * Get the sprite file name for a Pokémon by its ID.
 * @param {number} id - The ID of the Pokémon.
 * @returns {string} The sprite file name.
 */
function getSpriteName(id){
    return id.toString().padStart(4, '0') + "MS.png";
}

/**
 * Get an image from a file.
 *
 * @param {string} pathToImage - The path to the image file.
 * @param {string} imageName - The name of the image file.
 * @returns {Promise<Buffer | null>} The image as a Buffer if it exists, or null if not found.
 */
async function getImage(pathToImage, imageName) {
    const imagePath = path.join(__dirname, pathToImage, imageName);
    if (fs.existsSync(imagePath)) {
        return await fs.promises.readFile(imagePath);
    }
    return null;
}

/**
 * Remove an image from a file.
 *
 * @param {string} pathToImage - The path to the directory where the image is located.
 * @param {string} imageName - The name of the image file to be removed.
 * @returns {boolean} - True if the image was successfully removed, false otherwise.
 */
function removeImage(pathToImage, imageName) {
    const imagePath = path.join(__dirname, pathToImage, imageName);
    try {
        fs.unlinkSync(imagePath);
        return true;
    } catch (error) {
        return false;
    }
}

/**
 * Create an image from a Blob.
 * @param {Blob | null} blob - The Blob containing the image data.
 * @returns {Promise<Buffer | null>} The image as a Buffer if the Blob is valid, or null if it's null.
 */
async function createImageFromBlob(blob) {
    if (blob) {
        const arrayBuffer = await new Response(blob).arrayBuffer();
        return Buffer.from(arrayBuffer);
    }
    return null;
}

/**
 * Verify if the input fields of a new Pokémon are valid.
 * @param {Object} newPokemon - The new Pokémon data to be verified.
 * @returns {boolean} True if the input fields are valid, false otherwise.
 */
function verifyInputFields(newPokemon){
    if(!newPokemon.name) return false;
    if(!newPokemon.stats) return false;

    if (!newPokemon.name.en ||
        !newPokemon.name.fr ||
        !newPokemon.type ||
        !newPokemon.stats.hp ||
        !newPokemon.stats.attack ||
        !newPokemon.stats.attack_sp ||
        !newPokemon.stats.defense ||
        !newPokemon.stats.defense_sp ||
        !newPokemon.stats.speed
    ) return false;

    return true;
}

/**
 * Verify the uniqueness of a Pokémon's name, English name, French name, and ID.
 * @param {Object} database - The database connection or utility object.
 * @param {Object} pokemon - The Pokémon data to be checked for uniqueness.
 * @returns {string | null} An error message if a Pokémon with the same attributes already exists, or null if it's unique.
 */
async function verifyUniqueness(database, pokemon){
    if(pokemon.name){
        if(pokemon.name.en){
            if(await database.queryByName(pokemon.name.en, "en"))
                return "A Pokémon already exists with this English name.";
        }
        if(pokemon.name.fr){
            if(await database.queryByName(pokemon.name.fr, "fr"))
                return "A Pokémon already exists with this French name.";
        }
    }
    if(pokemon.id){
        if (await database.queryById(pokemon.id))
            return "A Pokémon already exists with this id.";
    }

    return  null;
}

/**
 * Format Pokémon data into a more structured format.
 * @param {Object} data - The Pokémon data to format.
 * @returns {Object} The formatted Pokémon data.
 */
function formatPokemonData(data){

    if(!data) return data;

    return formatedPokemon = {
        id: data.id,
        name: data.name_en || data.name_fr ? {
            en: data.name_en,
            fr: data.name_fr,
        } : undefined,
        type: data.type,
        stats: data.hp || data.attack || data.attack_sp || data.defense || data.defense_sp || data.speed ? {
            hp: data.hp,
            attack: data.attack,
            attack_sp: data.attack_sp,
            defense: data.defense,
            defense_sp: data.defense_sp,
            speed: data.speed,
        } : undefined,
        image: data.image,
        sprite: data.sprite
    };
}


/**
 * Vérifie si tous les éléments du tableau sont présents dans le tableau de types.
 *
 * @param {Array} array - Le tableau d'éléments à vérifier.
 * @param {Array} types - Le tableau de types dans lequel vérifier la présence des éléments.
 * @returns {boolean} - True si tous les éléments sont présents, sinon False.
 */
function isArrayInTypes(array, types) {
    for (const elem of array) {
        if (!types.includes(elem)) {
            return false;
        }
    }
    return true;
}

/**
 * Checks if an array is empty or contains empty strings.
 *
 * @param {Array} array - The array to check.
 * @returns {boolean} True if the array is empty or contains only empty strings, otherwise False.
 */
function isArrayEmpty(array){
    if(array.length === 0)
        return true;
    else
        return !!array.some(item => item === "");
}

/**
 * Checks if a Pokémon's statistics are compliant (positive integers).
 *
 * @param {Object} stats - The Pokémon's statistics.
 * @returns {boolean} True if the statistics are compliant, otherwise False.
 */
function areStatsCompliant(stats) {
    for (const stat in stats) {
        if (!isInt(stats[stat])) return false;
        if (stats[stat] < 0) return false;
    }

    return true;
}
