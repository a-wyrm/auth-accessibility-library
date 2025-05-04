import {highLightElement} from "./highlight.js";

function highlightAllButtons() {
    console.log("Highlighting all buttons");
    var buttons = document.querySelectorAll('button');
    buttons.forEach(button => {
        var highlights = highLightElement(button);
        highlights.forEach(highlight => document.body.appendChild(highlight));
    });
}

async function fetchButtons(){
    return new Promise((resolve, reject) => {
        chrome.tabs.query({ active: true, currentWindow: true }, async (tabs) => {
            if (tabs[0] && tabs[0].id) {
                const response = await chrome.tabs.sendMessage(tabs[0].id, { action: "fetchButtons" });
                resolve(response);
            } 
            else {
                resolve(undefined);
            }
        });
    });
}

function refreshPage() {
    window.location.reload();
}

function loadContent() {
    var hash = window.location.hash;
    var container = document.getElementById('view-container');

    if (hash === '#!/automated') {
        container.innerHTML = '<h2>Automated Scan Content</h2><p>This is where the automated scan features will go.</p>';
    } else if (hash === '#!/insights') {
        container.innerHTML = '<h2>Insights Content</h2><p>Here you will find accessibility insights.</p>';
    } else {
        container.innerHTML = '<h2>Tools Content</h2><p>Welcome to the accessibility toolkit!</p>';
    }

    document.querySelectorAll('nav a').forEach(link => {
        link.classList.remove('active');
        if (link.getAttribute('href') === hash || (hash === '' && link.getAttribute('href') === '#!/')) {
            link.classList.add('active');
        }
    });
}

window.onload = loadContent;
window.onhashchange = loadContent;


document.getElementById("refresh_button").addEventListener("click", refreshPage);
document.getElementById("hightlight_button").addEventListener("click", highlightAllButtons);
document.getElementById("fetch_element").addEventListener("click", async () => {
    const buttons = await fetchButtons();
    console.log(buttons.webpageButtons);
});