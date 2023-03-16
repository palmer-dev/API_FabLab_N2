// VARIABLES
const URL_API = "https://lab-rey.fr";

fetch(`${URL_API}/user-stations`)
    .then((data) => data.json())
    .then((data) => {
        updateLastInfos(data);
    });
