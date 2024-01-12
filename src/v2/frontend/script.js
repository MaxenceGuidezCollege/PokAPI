
/**
 * @fileoverview
 * This file contains JavaScript code for managing the frontend of the API and the Pokémon data and related containers.
 *
 * @author Vinc/Mig/Max
 */
const host = 'localhost:666';
const version = 'v2';
let isAdmin;

const userEmail = document.querySelector('#user-email');

const pokemonsList = document.querySelector('#pokemons-list');
const form = document.querySelector('#add-container');
const selectTypes = document.querySelector('#types');
const perPage = document.querySelector('#per-page');
const pdf = document.querySelector('#download-pdf');
const page = document.querySelector('#page');
const first = document.querySelector('#first');
const prev = document.querySelector('#prev');
const next = document.querySelector('#next');
const last = document.querySelector('#last');

let nextPage;
let prevPage;
let firstPage;
let lastPage;
let actualUrl;
let actualPokemons;
let selectedPokemon;

const typeColors = {
    "Grass": "#7AC74C",
    "Poison": "#A33EA1",
    "Fire": "#EE8130",
    "Water": "#6390F0",
    "Bug": "#A6B91A",
    "Dark": "#705746",
    "Dragon": "#6F35FC",
    "Electric": "#F7D02C",
    "Fairy": "#D685AD",
    "Fighting": "#C22E28",
    "Flying": "#A98FF3",
    "Ghost": "#735797",
    "Ground": "#E2BF65",
    "Ice": "#96D9D6",
    "Psychic": "#F95587",
    "Rock": "#B6A136",
    "Steel": "#B7B7CE",
};

/**
 * Create a closed container for a Pokémon.
 *
 * This function generates an HTML form element representing a Pokémon container,
 * which is initially closed. The container contains information about the Pokémon
 * and allows interactions like modifying and deleting the Pokémon.
 *
 * @param {Object} pokemon - The Pokémon object containing data.
 */
function closeContainer(pokemon){
    const container = createHTMLForm(
        pokemon.id,
        `http://${host}/${version}/pokemons/` + pokemon.id,
        "POST",
        "modifyPokemon(this); return false;",
        ['container', 'close']);

    const header = createHTMLElement('div', ['header']);
    if (isAdmin){
        header.innerHTML = `
            <h1>${pokemon.name.en}</h1>
            <a class="trash" onclick="deletePokemon(${pokemon.id})">
                <img src="images/icons/icon_trash.png" alt="Trash icon">
            </a>
        `;
    } else {
        header.innerHTML = `
            <h1>${pokemon.name.en}</h1>
        `;
    }

    const footer = createHTMLElement('div', ['footer']);
    footer.innerHTML = `<h3>ID: ${pokemon.id}</h3>`;

    const sprite = createHTMLElement('img', ['close']);
    sprite.src = pokemon.sprite;
    sprite.alt = `${pokemon.name.en} Image`;
    sprite.addEventListener('click', async function (){
        await closeAllContainers();
        setPokemon(pokemon.id, "OPEN");
    });

    container.append(header, footer, sprite);

    pokemonsList.appendChild(container);
}

/**
 * Create an opened container for a Pokémon.
 *
 * This function locates an existing closed Pokémon container by its ID, clears its contents,
 * and updates it to display detailed information about the Pokémon in an open state.
 *
 * @param {Object} pokemon - The Pokémon object containing data.
 */
function openContainer(pokemon){
    var formElements = document.body.getElementsByTagName('form');

    for (var i = 0; i < formElements.length; i++) {
        // Do not use ===
        // noinspection EqualityComparisonWithCoercionJS
        if (formElements[i].id == pokemon.id) {
            var container = formElements[i];
        }
    }

    container.innerHTML = "";
    container.classList.remove("close");
    container.classList.remove("modify");
    container.classList.add("open");

    const header = createHTMLElement('div', ['header']);
    if (isAdmin){
        header.innerHTML = `
            <h1>${pokemon.name.en}</h1>
            <span>Fr : ${pokemon.name.fr}</span>
            <a class="trash" onclick="deletePokemon(${pokemon.id})">
                <img src="images/icons/icon_trash.png" alt="Trash icon">
            </a>
        `;
    } else {
        header.innerHTML = `
            <h1>${pokemon.name.en}</h1>
            <span>Fr : ${pokemon.name.fr}</span>
        `;
    }

    const image = createHTMLElement('img', ['open']);
    image.src = pokemon.image;
    image.alt = `${pokemon.name.en} Image`;

    const typesElement = createHTMLElement('div', ['types']);
    for (let i = 0; i < pokemon.type.length; i++) {
        const typeDiv = document.createElement('div');
        typeDiv.textContent = pokemon.type[i];
        typeDiv.style.backgroundColor = typeColors[pokemon.type[i]] || 'gray';
        typesElement.appendChild(typeDiv);
    }

    const statsTable = createHTMLElement('table', ['stats']);
    for (const stat in pokemon.stats) {
        const statLine = document.createElement('tr');
        const statHeader = document.createElement('td');
        const statValue = document.createElement('td');

        statHeader.innerHTML = `<strong>${stat}:</strong>`;
        statValue.innerHTML = `<p>${pokemon.stats[stat]}</p>`;
        statLine.append(statHeader, statValue);

        statsTable.appendChild(statLine);
    }

    const footer = createHTMLElement('div', ['footer']);

    if (isAdmin){
        footer.innerHTML = `
        <h3>ID: ${pokemon.id}</h3>
        <a class="settings" onclick="setPokemon(${pokemon.id}, 'MODIFY');">
            <img src="images/icons/icon_settings.png" alt="Settings icon">
        </a>
    `;
    } else {
        footer.innerHTML = `
            <h3>ID: ${pokemon.id}</h3>
        `;
    }

    container.append(header, image, typesElement, statsTable, footer);

    window.scrollTo({
        top: container.offsetTop - 20,
        behavior: "smooth"
    });
    selectedPokemon = pokemon;
}

/**
 * Create a container for modifying a Pokémon.
 *
 * This function locates an existing Pokémon container by its ID, clears its contents,
 * and updates it to allow modifications of the Pokémon's data, including name, images, types, and stats.
 *
 * @param {Object} pokemon - The Pokémon object containing data to modify.
 * @async
 */
async function modifyContainer(pokemon){
    var formElements = document.body.getElementsByTagName('form');

    for (var i = 0; i < formElements.length; i++) {
        // Do not use ===
        // noinspection EqualityComparisonWithCoercionJS
        if (formElements[i].id == pokemon.id) {
            var container = formElements[i];
        }
    }

    container.innerHTML = "";
    container.classList.remove("close");
    container.classList.remove("open");
    container.classList.add("modify");

    const header = createHTMLElement('div', ['header']);
    header.innerHTML = `
        <input type="text" value="${pokemon.name.en}" id="input_name_en" name="input_name_en" required>
        <input type="text" value="${pokemon.name.fr}" id="input_name_fr" name="input_name_fr" required>
    `;

    const imagesContainer = createHTMLElement('div', ['img-container']);

    const imageContainer = createHTMLImage('IMG', pokemon);
    const spriteContainer = createHTMLImage('SPR', pokemon);

    imagesContainer.append(imageContainer, spriteContainer);

    const typesCheckboxContainer = createHTMLElement('div', ['types', 'modify']);

    const allTypes = await getAllUniqueTypes();
    for (const type of allTypes) {

        const typeContainer = document.createElement('div');
        const typeCheckbox = createHTMLElement('input', ['checkbox']);
        typeCheckbox.type = 'checkbox';
        typeCheckbox.id = type;
        typeCheckbox.name = 'types';
        typeCheckbox.value = type;

        if (pokemon.type.includes(type)) {
            typeCheckbox.checked = true;
        }

        const typeLabel = document.createElement('label');
        typeLabel.htmlFor = type;
        typeLabel.innerText = type;

        typeContainer.style.backgroundColor = typeColors[type] || 'gray';

        typeContainer.append(typeCheckbox, typeLabel);
        typesCheckboxContainer.appendChild(typeContainer);
    }

    const statsTable = createHTMLElement('table', ['stats']);
    for (const stat in pokemon.stats) {
        const statLine = document.createElement('tr');
        const statHeader = document.createElement('td');
        const statValue = document.createElement('td');

        statHeader.innerHTML = `<strong>${stat}:</strong>`;

        const statValueInput = document.createElement('input');
        statValueInput.type = 'number';
        statValueInput.min = '0';
        statValueInput.id = 'input_' + stat;
        statValueInput.name = 'input_' + stat;
        statValueInput.value = pokemon.stats[stat];
        statValueInput.required = true;
        statValue.appendChild(statValueInput);

        statLine.append(statHeader, statValue);

        statsTable.appendChild(statLine);
    }

    const footer = createHTMLElement('div', ['footer']);
    footer.innerHTML = `
        <h3>ID: ${pokemon.id}</h3>
        <div class="buttons">
            <button type="submit" class="confirm">
                <img src="images/icons/icon_check.png" alt="Confirm icon">
            </button>
            <a class="cancel" onclick="setPokemon(${pokemon.id}, 'OPEN');">
                <img src="images/icons/icon_cross.png" alt="Cancel icon">
            </a>
        </div>
    `;

    container.append(header, imagesContainer, typesCheckboxContainer, statsTable, footer);

    container.scrollIntoView();
    selectedPokemon = pokemon;
}

/**
 * Create a closed container for adding a new Pokémon.
 *
 * This function creates a closed container with an add icon, which can be clicked to open an add Pokémon form.
 *
 * @returns {HTMLFormElement} The newly created closed container element for adding Pokémon.
 */
function createAddContainer(){
    const addContainer = createHTMLForm(
        "add-container",
        `http://${host}/${version}/pokemons`,
        "POST",
        "addPokemon(this); return false;",
        ['container', 'close']);

    const header = createHTMLElement('div', ['header']);

    const img = createHTMLElement('img', ['close']);
    img.src = "./images/icons/icon_add.png";
    img.alt = "Add icon";
    img.addEventListener('click', async function (){
        await closeAllContainers();
        await openAddContainer();
    });

    const footer = createHTMLElement('div', ['footer']);

    addContainer.append(header, footer, img);

    return addContainer;
}

/**
 * Open a container for adding a new Pokémon.
 *
 * This function opens a container for adding a new Pokémon. The container allows users to input the
 * Pokémon's name, types, and stats, and then submit the data for creation.
 *
 * @returns {Promise<void>} A promise that resolves when the container is opened.
 * @async
 */
async function openAddContainer(){
    let container = document.querySelector('#add-container');

    container.innerHTML = "";
    container.classList.remove("close");
    container.classList.remove("open");
    container.classList.add("modify");

    const header = createHTMLElement('div', ['header']);
    header.innerHTML = `
        <input type="text" value="" id="input_name_en" name="input_name_en" required>
        <input type="text" value="" id="input_name_fr" name="input_name_fr" required>
    `;

    const typesCheckboxContainer = createHTMLElement('p', ['types', 'modify']);
    const allTypes = await getAllUniqueTypes();
    for (const type of allTypes) {
        const linkInputLabel = type;

        const typeContainer = document.createElement('div');
        const typeCheckbox = createHTMLElement('input', ['checkbox']);
        typeCheckbox.type = 'checkbox';
        typeCheckbox.id = linkInputLabel;
        typeCheckbox.name = 'types';
        typeCheckbox.value = type;
        if (type === "Normal") typeCheckbox.checked = true;

        const typeLabel = document.createElement('label');
        typeLabel.htmlFor = linkInputLabel;
        typeLabel.innerText = type;

        typeContainer.style.backgroundColor = typeColors[type] || 'gray';

        typeContainer.append(typeCheckbox, typeLabel);
        typesCheckboxContainer.appendChild(typeContainer);
    }

    const statsTable = createHTMLElement('table', ['stats']);

    const fields = ["hp", "attack", "attack_sp", "defense", "defense_sp", "speed"]; // TODO : Stop hardcoding

    for (const field in fields) {
        const statLine = document.createElement('tr');
        const statHeader = document.createElement('td');
        const statValue = document.createElement('td');

        statHeader.innerHTML = `<strong>${fields[field]}:</strong>`;

        const statValueInput = document.createElement('input');
        statValueInput.type = 'number';
        statValueInput.min = '0';
        statValueInput.value = '1';
        const idName = 'input_' + fields[field];
        statValueInput.id = idName;
        statValueInput.name = idName;
        statValueInput.required = true;
        statValue.appendChild(statValueInput);

        statLine.append(statHeader, statValue);
        statsTable.appendChild(statLine);
    }

    const footer = createHTMLElement('div', ['footer']);
    footer.innerHTML = `
        <button type="submit" class="confirm">
            <img src="images/icons/icon_check.png" alt="Confirm icon">
        </button>
        <a class="cancel" onclick="closeAllContainers();">
            <img src="images/icons/icon_cross.png" alt="Cancel icon">
        </a>
    `;

    container.append(header, typesCheckboxContainer, statsTable, footer);

    container.scrollIntoView();
}

/**
 * Close all containers in the page.
 *
 * This function iterates through the list of actualPokemons and closes each corresponding container.
 *
 * @returns {Promise<void>} A promise that resolves when all containers are closed.
 * @async
 */
async function closeAllContainers(){
    resetPokemonsList();

    for (const pokemon of actualPokemons) {
        closeContainer(pokemon);
    }
}

/**
 * Get all unique Pokémon types from the database.
 *
 * This function fetches the list of unique Pokémon types from the server and returns them.
 *
 * @returns {Promise<string[]>} A promise that resolves with an array of unique Pokémon types.
 * @async
 */
async function getAllUniqueTypes() {
    const url = `http://${host}/${version}/pokemons/types`;

    try {
        const response = await safeFetch(url, {method: "GET"});
        if (response.ok) {
            const contentType = response.headers.get("content-type");
            if (contentType.includes('application/json')) {
                const typesJSON = await response.json();

                return typesJSON.types;
            } else {
                console.error(`Content-type is not json: ${contentType}`);
            }
        } else {
            console.error(`Fetch request failed with status ${response.status}`);
        }
    } catch (error) {
        console.error("Error while fetching data:", error);
    }
}

/**
 * Fetch data and fill elements (buttons, page, etc...) and create closed containers of data.
 *
 * @param {string} url - The URL to fetch data from
 * @returns {void}
 * @async
 */
async function fetchPokemons(url) {
    try {
        const response = await safeFetch(url, {method: "GET"});
        if (response.ok) {
            const contentType = response.headers.get("content-type");
            if (contentType.includes('application/json')) {
                const data = await response.json();
                prevPage = data.prevPage;
                nextPage = data.nextPage;
                firstPage = data.firstPage;
                lastPage = data.lastPage;
                page.innerText = `${data.page} / ${data.pageCount}`;
                pdf.href = data.pdfPage;
                actualPokemons = data.pokemons;
                actualUrl = data.curPage;

                disableEnableButtons();

                for (let i = 0; i < data.pokemons.length; i++) {
                    closeContainer(data.pokemons[i]);
                }
            } else {
                console.error(`Content-type is not json: ${contentType}`);
            }
        } else {
            console.error(`Fetch request failed with status ${response.status}`);
        }
    } catch (error) {
        console.error("Error while fetching data:", error);
    }
}

/**
 * Disable or enable navigation buttons based on the availability of previous and next pages.
 *
 * @returns {void}
 */
function disableEnableButtons(){
    first.disabled = false;
    prev.disabled = false;
    next.disabled = false;
    last.disabled = false;

    if (!prevPage) prev.disabled = true;
    if (!nextPage) next.disabled = true;

    if (prev.disabled) first.disabled = true;
    if (next.disabled) last.disabled = true;
}

/**
 * Send a request to delete a Pokémon from the database.
 *
 * @param {number} id - The ID of the Pokémon to be deleted.
 * @returns {void}
 * @asynd
 */
async function deletePokemon(id){
    var userConfirmed = window.confirm(`Do you want to delete the pokemon with the id ${id} ?`);

    if (userConfirmed) {
        let url;
        for (const pokemon of actualPokemons) {
            if (pokemon.id === id) url = pokemon.details;
        }

        try {
            const response = await safeFetch(url, {method: "DELETE"});
            if (response.ok) {
                alert(`Delete request succeeded !`);
                await update(actualUrl);
            } else {
                console.error(`Delete request failed with status ${response.status}`);
            }
        } catch (error) {
            console.error("Error while deleting data:", error);
        }
    }
}

/**
 * Send a request to add a new Pokémon to the database.
 *
 * @param {HTMLFormElement} form - The form containing Pokémon information to be added.
 * @returns {void}
 * @async
 */
async function addPokemon(form){

    const types = [];

    for (let i = 0; i < form.types.length; i++) {
        if (form.types[i].checked == true){
            types.push(form.types[i].id);
        }
    }

    if (types.length === 0) {
        alert("One Pokemon types must be checked.");
        return;
    }

    const body = {
        "name": {
            "en": form.input_name_en.value,
            "fr": form.input_name_fr.value
        },
        "type": types,
        "stats": {
            "hp": form.input_hp.value,
            "attack": form.input_attack.value,
            "attack_sp": form.input_attack_sp.value,
            "defense": form.input_defense.value,
            "defense_sp": form.input_defense_sp.value,
            "speed": form.input_speed.value
        }
    };

    try {
        const response = await safeFetch(form.action, {
            method: form.method,
            body: JSON.stringify(body),
            headers: {'Content-Type': 'application/json'}
        });
        if (response.ok) {
            await update();
            alert(`Adding request succeeded !`)
        } else {
            alert(`Adding request failed with status ${response.status} : ${await response.text()}`);
        }
    } catch (error) {
        console.error("Error while adding data:", error);
    }
}

/**
 * Send a request to modify a Pokémon in the database.
 *
 * @param {HTMLFormElement} form - The form containing the updated Pokémon information.
 * @returns {void}
 * @async
 */
async function modifyPokemon(form){

    const types = [];

    for (let i = 0; i < form.types.length; i++) {
        if (form.types[i].checked == true){
            types.push(form.types[i].id);
        }
    }

    const body = {
        "name": {
            "en": form.input_name_en.value,
            "fr": form.input_name_fr.value
        },
        "type": types,
        "stats": {
            "hp": form.input_hp.value,
            "attack": form.input_attack.value,
            "attack_sp": form.input_attack_sp.value,
            "defense": form.input_defense.value,
            "defense_sp": form.input_defense_sp.value,
            "speed": form.input_speed.value
        }
    };

    try {
        const response = await safeFetch(form.action, {
            method: 'PUT',
            body: JSON.stringify(body),
            headers: {'Content-Type': 'application/json'}
        });
        if (response.ok) {
            alert(`Modify request succeeded !`);
            await update(actualUrl);
            await setPokemon(selectedPokemon.id, "OPEN");
        } else {
            alert(`Modify request failed with status ${response.status} : ${await response.text()}`);
        }
    } catch (error) {
        console.error("Error while modify data:", error);
    }
}

/**
 * Create a container based on the specified method for the Pokémon with the given ID.
 *
 * @param {number} id - The ID of the Pokémon to be displayed.
 * @param {string} method - The method for displaying the Pokémon container (OPEN, CLOSE, MODIFY).
 * @returns {void}
 * @async
 */
async function setPokemon(id, method) {
    const url = `http://${host}/${version}/pokemons/` + id;

    try {
        const response = await safeFetch(url, {method: "GET"});
        if (response.ok) {
            const contentType = response.headers.get("content-type");
            if (contentType.includes('application/json')) {
                const pokemon = await response.json();

                switch (method){
                    case "OPEN":
                        openContainer(pokemon);
                        break;
                    case "CLOSE":
                        closeContainer(pokemon)
                        break;
                    case "MODIFY":
                        modifyContainer(pokemon)
                        break;
                    default:
                        console.error(`Params "method" is not in OPEN, CLOSE, MODIFY.`);
                        break;
                }
            } else {
                console.error(`Content-type is not json: ${contentType}`);
            }
        } else {
            console.error(`Fetch request failed with status ${response.status}`);
        }
    } catch (error) {
        console.error("Error while fetching data:", error);
    }
}

/**
 * Empty the main div and add a closed container to add a new Pokemon.
 *
 * @returns {void}
 */
function resetPokemonsList(){
    pokemonsList.innerHTML = null;
    if (isAdmin){
        pokemonsList.appendChild(createAddContainer());
    }
}

/**
 * Empty the select of Pokémon types and add all available types from the database.
 *
 * @param {string} selected - The selected type to highlight (default is 'ALL').
 * @returns {void}
 * @async
 */
async function updateSelectTypes(selected = 'ALL'){
    selectTypes.innerHTML = '';
    const url = `http://${host}/${version}/pokemons/types`;

    try {
        const response = await safeFetch(url, {method: 'GET'});
        if (response.ok) {
            const data = await response.json();

            let allOption = document.createElement('option');
            allOption.innerText = "ALL";
            if (selected === 'ALL') allOption.selected = true;
            selectTypes.appendChild(allOption);

            for (let i = 0; i < data.types.length; i++) {
                let typeOption = document.createElement('option');
                if (selected === data.types[i]) typeOption.selected = true;
                typeOption.innerText = data.types[i];
                selectTypes.appendChild(typeOption);
            }

        } else {
            alert(`Fetch request failed with status ${response.status} : ${await response.text()}`);
        }
    } catch (error) {
        console.error("Error while fetching data:", error);
    }
}

/**
 * Get the selected type from the dropdown and update the page accordingly.
 *
 * @returns {void}
 * @async
 */
async function onChangeTypes(){
    const type = selectTypes.options[selectTypes.selectedIndex].value;

    const url = `http://${host}/${version}/pokemons?type=` + type;

    await update(url);
}

/**
 * Reset the main div and display data requested in the given URL or based on the current selection.
 *
 * @param {string|URL} url - The URL to fetch data from or "base" to reset to the default page.
 * @returns {void}
 * @async
 */
async function update(url) {
    resetPokemonsList();

    if (url && typeof url !== 'string') {
        const urlObject = new URL(url);
        const params = Object.fromEntries(urlObject.searchParams.entries());
        const typeParam = params.type;

        await updateSelectTypes(typeParam);
    }

    const perPageValue = perPage.value;
    const type = selectTypes.options[selectTypes.selectedIndex].value;

    let _url;
    if (url === "base"){
        updateSelectTypes();
        perPage.value = 50;
        _url = `http://${host}/${version}/pokemons?page=1&per_page=50$type=ALL`;
    }
    else {
        _url = url ?? `http://${host}/${version}/pokemons?per_page=${perPageValue}&type=${type}`;
    }

    await fetchPokemons(_url);
}

async function initUserAccount() {
    const url = `http://${host}/${version}/user`;
    try {
        const response = await safeFetch(url, {method: "GET"});
        if (response.ok) {
            const user = await response.json();
            if (user.role === 'ADMIN') {
                isAdmin = true;
            } else {
                isAdmin = false;
            }

            userEmail.innerText = user.email;
            initPwdView();
        } else {
            console.error(`Fetch request failed with status ${response.status}`);
        }
    } catch (error) {
        console.error("Error while fetching data:", error);
    }
}

/**
 * Asynchronous IIFE that initializes the page by updating the select types and fetching the default data.
 *
 * @returns {void}
 * @async
 */
;(async () => {
    try {
        await initUserAccount();
        await updateSelectTypes();
        await update('base');
    } catch (e) {
        console.error(e);
    }
})();

