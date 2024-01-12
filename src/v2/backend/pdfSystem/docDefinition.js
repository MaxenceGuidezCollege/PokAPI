
/**
 * This module exports a function that returns configuration options for generating a PDF report.
 *
 * @function
 * @returns {object} - Configuration options for PDF report generation.
 */

module.exports = function() {
    return {
        pageOrientation: 'landscape',
        content: [
            {text: 'Pokémons (${numPokemons})', style: 'header1'},
            {text: 'Filter by Pokemon type : ${typePokemon}', style: 'header2'},
            {
                style: 'tablePokemons',
                table: {
                    headerRows: 1,
                    body: [
                        [
                            {text: '#', style: 'tableHeader'},
                            {text: 'English name', style: 'tableHeader'},
                            {text: 'French name', style: 'tableHeader'},
                            {text: 'Type', style: 'tableHeader'},
                            {text: 'Health points', style: 'tableHeader'},
                            {text: 'Attack points', style: 'tableHeader'},
                            {text: 'Special attack points', style: 'tableHeader'},
                            {text: 'Defense points', style: 'tableHeader'},
                            {text: 'Special defense points', style: 'tableHeader'},
                            {text: 'Speed', style: 'tableHeader'}
                        ]
                    ]
                }
            },
        ],
        styles: {
            header1: {
                fontSize: 18,
                bold: true,
                margin: [0, 0, 0, 10]
            },
            header2: {
                fontSize: 14,
                bold: true,
                margin: [0, 0, 0, 10]
            },
            subheader: {
                fontSize: 16,
                bold: true,
                margin: [0, 10, 0, 5]
            },
            tablePokemons: {
                margin: [0, 5, 0, 15]
            },
            tableHeader: {
                bold: true,
                fontSize: 13,
                color: 'black',
                alignment: 'center'
            }
        }
    };
};
