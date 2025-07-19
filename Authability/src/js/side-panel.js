import {highLightElement} from "./highlight.js";

function storeElementsinPanel(elements_to_click) {
    console.log("Highlighting all buttons");
    
    // remove previous
    let oldList = document.getElementById('element_to_click');
    if (oldList) {
        oldList.remove();
    }

    const panel = document.createElement('div');
    panel.id = 'side-panel';
    panel.style.position = 'fixed';
    panel.style.bottom = '80px';
    panel.style.right = '20px';
    panel.style.width = '250px';
    panel.style.background = '#fff';
    panel.style.border = '1px solid #ccc';
    panel.style.zIndex = 9999;
    panel.style.padding = '10px';
    panel.style.maxHeight = '400px';
    panel.style.overflowY = 'auto';
    panel.style.boxShadow = '0 2px 8px rgba(0,0,0,0.15)';

    elements_to_click.forEach((el, idx) => {
        
        // Create a list item for each element
        const item = document.createElement('div');
        item.id = `elements`;
        item.textContent = el.value || el.aria_label || `Element ${idx + 1}`;
        item.style.cursor = 'pointer';
        item.style.marginBottom = '6px';

        item.addEventListener('mouseover', () => {
            item.style.backgroundColor = '#e0f7fa'; // Light blue, change as needed
        });
        item.addEventListener('mouseout', () => {
            item.style.backgroundColor = ''; // Reset to default
        });

/*         item.addEventListener('click', () => {
            // Send a message to the content script to scroll to the element
            chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
                chrome.tabs.sendMessage(tabs[0].id, {
                    action: "scrollToElement",
                    elementIndex: idx // or use a unique identifier if available
                });
            });
        }); */

        panel.appendChild(item);
    });

    document.body.appendChild(panel);
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
//document.getElementById("hightlight_button").addEventListener("click", highlightAllButtons);
document.getElementById("fetch_element").addEventListener("click", async () => {
    const buttons = await fetchButtons();
    storeElementsinPanel(buttons.webpageButtons);
    console.log(buttons.webpageButtons);
});