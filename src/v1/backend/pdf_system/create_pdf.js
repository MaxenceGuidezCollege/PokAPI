
/**
 * This module generates a PDF report using the provided Pokémon data and streams it to the specified output. It also
 * specifies the type of Pokémon by which is filtered.
 *
 * @function
 *
 * @param {object[]} pokemons - An array of Pokémon data.
 * @param {string} typeFilter - An string of the Pokémon type filter.
 * @param {object} stream - The output stream to which the PDF report will be written.
 */

const path = require("path");
const Pdfmake = require("pdfmake");

const getDocDefinition = require("./doc_definition.js");

const fontDescriptors = {
    Roboto: {
        normal: path.join(__dirname, 'fonts', 'Roboto-Regular.ttf'),
        bold: path.join(__dirname, 'fonts/Roboto-Medium.ttf'),
        italics: path.join(__dirname, 'fonts/Roboto-Italic.ttf'),
        boldItalics: path.join(__dirname, 'fonts/Roboto-MediumItalic.ttf')
    }
};

module.exports = (pokemons, typeFilter, stream) => {
    const printer = new Pdfmake(fontDescriptors);

    const dd = getDocDefinition();

    dd.content[0].text = dd.content[0].text
        .replace('${numPokemons}', pokemons.length);

    dd.content[1].text = dd.content[1].text
        .replace('${typePokemon}', typeFilter);

    let content = pokemons.map(pokemon => [
        pokemon.id,
        pokemon.name.en,
        pokemon.name.fr,
        pokemon.type,
        pokemon.stats.hp,
        pokemon.stats.attack,
        pokemon.stats.attack_sp,
        pokemon.stats.defense,
        pokemon.stats.defense_sp,
        pokemon.stats.speed
    ]);

    dd.content[2].table.body.push(...content);
    const pdfDoc = printer.createPdfKitDocument(dd);
    pdfDoc.pipe(stream);
    pdfDoc.end();
};