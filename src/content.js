
console.log("Auth Accessibility Extension content script loaded.");


// get text of element
function getText(element){
    return element.cloneNode(true).textContent.trim();
}

// get attributes of element
function getAttributes(element, table){
    var array = {};

    for (let i = element.attributes.length -1; i >= 0; i-- ){
        var attribute = i;
        if (table.includes(attribute)) {
            array[attribute.name] = attribute.value; 
        }
    }
    return array;
}
/**
 * Fetches information about DOM elements matching a given selector.
 *
 * @param {string} element - The CSS selector to find elements.
 * @param {string[]} [array=[]] - An array of additional attribute names to fetch.
 * @param {number} [max_length=100] - The maximum length of the extracted text. Set to 0 for no limit.
 * @returns {Array<object>} An array of objects, each containing information about a matched element.
*/

function fetchElements(elements, array, max_length = 100){

    console.log("fetech elements activated");

    const returned_array = Array.from(document.querySelectorAll(elements)).map((element)  => {

        const ariaLabel = element.getAttribute("aria-label") || element.innerText.trim();
        const isRequired = element.getAttribute("required");

        return {
            text: getText(element).substring(0, max_length) + (max_length ? " ..." : ""),
            aria_label: ariaLabel,
            focusable: element.hasAttribute("tabindex") || element.tagName === "BUTTON" || element.tagName === "A",
            html: element.outerHTML,
            is_required: isRequired,
            
            attributes: getAttributes(element, [
                ...array,
                "aria-labelledby",
                "aria-describedby",
                "aria-hidden",
                "tabindex",
                "role",
            ])
        };
    })

    return returned_array;
}

function fetchButtons(){
    const button_html = "button:not([role]), [role='button']";
    const button_attrib = ["role", "aria-label", "aria-labelledby", "tabindex", "title", "aria-hidden", "aria-expanded"];

    const button_elements = fetchElements(button_html, button_attrib);
    console.log(button_elements);
    return button_elements;
}


chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    console.log("here");
    if (request.action === "fetchButtons") {
      const buttons = fetchButtons();
      return sendResponse({"webpageButtons": buttons})
    }
  });