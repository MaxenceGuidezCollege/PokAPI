
const header = document.getElementsByTagName('header')[0];
const pwdContainer = document.querySelector('#pwd-container');
let isEditMode;
const logOutBtn = document.getElementsByClassName('logout')[0];

window.addEventListener('scroll', function() {
    if (!isEditMode) header.classList.remove('open');
});
document.addEventListener('click', function(event) {
    const isClickedInsideElement = header.contains(event.target);
    if (!isClickedInsideElement && !isEditMode) header.classList.remove('open');
});
logOutBtn.addEventListener('click', async function() {
    const url = `http://${host}/${version}/logout`;
    try {
        const response = await safeFetch(url, {method: 'POST'});
        if (!response.ok)  alert(`Log out failed with status ${response.status} : ${await response.text()}`);
    } catch (error) {
        console.error("Error while log out:", error);
    }
});

function initPwdView() {
    isEditMode = false;
    pwdContainer.innerHTML = ``;

    const strong = document.createElement('strong');
    strong.innerText = `Password :`;

    const randomStars = Math.floor(Math.random() * (10 - 4 + 1)) + 4;
    const para = document.createElement('p');
    para.innerText ='*'.repeat(randomStars);
    para.id = `user-pwd`;

    const imgContainer = createHTMLElement('a', ['edit-pwd']);
    imgContainer.innerHTML = `<img src="images/icons/icon_edit.png" alt="Icon edit">`;
    imgContainer.addEventListener('click', switchToEditPwdView);

    pwdContainer.append(strong, para, imgContainer);
}

function switchToEditPwdView() {
    isEditMode = true;
    pwdContainer.innerHTML = ``;

    const strong = document.createElement('strong');
    strong.innerText = `Password :`;

    const input = createHTMLElement('input', ['input-pwd']);
    input.type = `text`;

    const imgsContainer = createHTMLElement('div', ['btns-pwd']);

    const confirmImgContainer = createHTMLElement('a', ['confirm-pwd']);
    confirmImgContainer.innerHTML = `<img src="images/icons/icon_check.png" alt="Confirm edit">`;
    confirmImgContainer.addEventListener('click', confirmNewPwd);

    const cancelImgContainer = createHTMLElement('a', ['cancel-pwd']);
    cancelImgContainer.innerHTML = `<img src="images/icons/icon_cross.png" alt="Cancel edit">`;
    cancelImgContainer.addEventListener('click', initPwdView);

    imgsContainer.append(confirmImgContainer, cancelImgContainer);
    pwdContainer.append(strong, input, imgsContainer);
}

async function confirmNewPwd() {
    const newPwd = document.getElementsByClassName('input-pwd')[0].value;

    const url = `http://${host}/${version}/user`;
    const body = {
        "pwd_hash": newPwd
    };

    try {
        const response = await safeFetch(url, {
            method: "PUT",
            body: JSON.stringify(body),
            headers: {'Content-Type': 'application/json'}
        });
        if (response.ok) {
            alert(`Updating password succeeded !`);
        } else {
            console.error(`Modify request failed with status ${response.status} : ${await response.text()}`);
        }
    } catch (error) {
        console.error("Error while modify data:", error);
    }

    initPwdView();
}

async function safeFetch(...args) {
    try {
        const response = await fetch(...args);
        if (response.status === 401 || response.status === 205) document.location = '/v2/a14n/signIn.html';
        return response;
    } catch (e) {
        throw e;
    }
}

function createHTMLElement(tag, classes) {
    const element = document.createElement(tag);
    element.classList.add(...classes);

    return element;
}

function createHTMLForm(id, action, method, onSubmitAttribute, classes) {
    const form = createHTMLElement('form', classes);
    form.id = id;
    form.action = action;
    form.method = method;
    form.enctype = "application/x-www-form-urlencoded";
    form.setAttribute('onsubmit', onSubmitAttribute);

    return form;
}

function createHTMLImage(sprOrImg = 'IMG', pokemon) {

    let imageClass;
    let imageSrc;

    if (sprOrImg === 'IMG') {
        imageClass = 'img-pokemon';
        if (pokemon) imageSrc = pokemon.image;
    }
    else if (sprOrImg === 'SPR') {
        imageClass = 'sprite-pokemon';
        if (pokemon) imageSrc = pokemon.sprite;
    }
    else return;

    const image = createHTMLElement('img', [imageClass]);
    if (pokemon) {
        image.src = imageSrc;
        image.alt = pokemon.name.en + 'Image';
    }

    return image;
}