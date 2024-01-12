
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

module.exports = {
    isInt,
    getImageName,
    getSpriteName,
    getImage,
    createImageFromBlob,
    verifyUniqueness,
    formatPokemonData,
    getPokemonTypes,
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
 * Verify the uniqueness of a Pokémon's name, English name, French name.
 * @param {Object} pokemon - The Pokémon data to be checked for uniqueness.
 * @param {Object} database - The database connection or utility object.
 * @returns {string | null} An error message if a Pokémon with the same attributes already exists, or null if it's unique.
 */
async function verifyUniqueness(pokemon, database){
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
 * Get an array of Pokémon types.
 * @returns {string[]} An array containing Pokémon types.
 */
function getPokemonTypes() {
    return ["Normal", "Grass", "Poison", "Fire", "Water", "Bug", "Dark", "Dragon", "Electric", "Fairy", "Fighting",
        "Flying", "Ghost", "Ground", "Ice", "Psychic", "Rock", "Steel"];
}
