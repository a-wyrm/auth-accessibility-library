/*global chrome*/
//import {highLightElement} from "./js helpers/highlight.js";


async function getAxe(message, sendResponse) {
    try {
        await chrome.scripting.executeScript({
            target: {
                tabId: message.activeId
            },
            files: ["js/axe.js"]
        });
        sendResponse({
            status: "ok"
        });
    } 
    catch 
    (error: any) {
        console.error("Error executing script:", error);
        sendResponse({
            status: "error",
            message: error.message
        });
    }
    return true;
}

async function highlightFields(element_list){

    const tempHighlights = document.querySelectorAll("body .tsc-rectangle-temp-ha, body .tsc-dimensions-temp-ha, body .tsc-circle-temp-ha");
    tempHighlights.forEach((el) => el.remove());
  
    const targetElement = document.querySelector(element_list.selector);
    if (!targetElement) {
      return;
    }
  
    //const [highlightElement, textElement] = highLightElement(targetElement);
  
    targetElement.scrollIntoView({
      behavior: "smooth",
      block: "center",
    });
  
    if (element_list.showText) {
      //textElement.textContent = element_list.showText;
    } 
    else {
      //textElement.textContent = "^";
    }
  
    //document.body.appendChild(highlightElement);
    //document.body.appendChild(textElement);

    // get properties of highlighted elements
    //fetchElements(tempHighlights, []);
}

chrome.runtime.onMessage.addListener(function(message, sendResponse) {
    switch (message.command) {
        case "highlight":
            highlightFields(message.elements);
            break;
        case "run axe":
            getAxe(message.tabId, sendResponse);
            break;
        case "refresh URL":
            //a(window.location.href);
            break;
        case "fetch button":
            const button_html = "button:not([role]), [role='button']";
            const button_attrib = ["role", "aria-label", "aria-labelledby", "tabindex", "title", "aria-hidden", "aria-expanded"];
            //var returned_elements = fetchElements(button_html, button_attrib)
            //console.log(returned_elements)
            break;
        case "fetch link":
            const link_html = "a:not([role]),[role='link']";
            const link_attrib = ["role", "aria-label", "tabindex", "title", "aria-hidden"];
            //fetchElements(link_html, link_attrib);
            break;
        case "fetch image":
            const imgs = "img, [role='img']";
            const img_attributes = ["alt", "title", "aria-label", "aria-labelledby", "role", "aria-hidden"];
            //fetchElements(imgs, img_attributes)
            break;
    }
});

chrome.tabs.onUpdated.addListener(async (tabId: number, changeInfo: chrome.tabs.TabChangeInfo, tab: chrome.tabs.Tab) => {
    chrome.storage.local.set({
        activeId: tabId
    });
});
chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true }).catch((error) => console.error(error))