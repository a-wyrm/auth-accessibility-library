import {highLightElement} from "../js/highlight.js";
import {fetchElements} from "../js/get_element.js";

function highlightAllButtons() {
    console.log("Highlighting all buttons");
    var buttons = document.querySelectorAll('button');
    buttons.forEach(button => {
        var highlights = highLightElement(button);
        highlights.forEach(highlight => document.body.appendChild(highlight));
    });
}

function fetchButtons(){
    const button_html = "button:not([role]), [role='button']";
    const button_attrib = ["role", "aria-label", "aria-labelledby", "tabindex", "title", "aria-hidden", "aria-expanded"];

    const button_elements = fetchElements(button_html, button_attrib);
    console.log(button_elements);
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
document.getElementById("fetch_element").addEventListener("click", fetchButtons);