
document.addEventListener("DOMContentLoaded", handleFlashError);

async function handleFlashError(){
    const url = `http://localhost:666/v2/flash/error`;
    try {
        const response = await fetch(url, {method: "GET"});
        if (response.ok) {
            const error = await response.text();
            if (error) alert(error);

            try {
                const response = await fetch(url, {method: "DELETE"});
                if (!response.ok) console.error(`Delete error request failed with status ${response.status}`);
            } catch (error) {
                console.error("Error while fetching errors:", error);
            }
        } else {
            console.error(`Fetch error request failed with status ${response.status}`);
        }
    } catch (error) {
        console.error("Error while fetching errors:", error);
    }
}

function togglePasswordVisibility() {
    let passwordField = document.getElementById("password");
    let showPasswordToggle = document.getElementById("show-password");

    if (passwordField.type === "password") {
        passwordField.type = "text";
        showPasswordToggle.style.backgroundImage = "url('../images/icons/icon_eyeOpen.svg')";
    } else {
        passwordField.type = "password";
        showPasswordToggle.style.backgroundImage = "url('../images/icons/icon_eyeClose.svg')";
    }
}