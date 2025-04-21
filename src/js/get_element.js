
// get text of element
function getText(element){
    return element.cloneNode(true).textContent.trim();
}

// get attributes of element
function getAttributes(element, table){
    var array = {};

    for (let i = element.attributes; i != 0; i-- ){
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

export function fetchElements(elements, array, max_length = 100){

    console.log("fetech elements activated");

    let returned_array = Array.prototype.slice.call(document.querySelectorAll(elements)).map((element) => {

        const ariaLabel = element.getAttribute("aria-label") || element.innerText.trim();
        const isRequired = element.getAttribute("required");

        return {
            text: getText(element).substring(0, max_length) + (max_length ? " ..." : "")
            
/*             attributes: getAttributes(element, [
                ...array,
                "aria-labelledby",
                "aria-describedby",
                "aria-hidden",
                "tabindex",
                "role",
            ]),
            focusable: element.hasAttribute("tabindex") || element.tagName === "BUTTON" || element.tagName === "A",
            html: element.outerHTML,
            aria_label: ariaLabel,
            is_required: isRequired */
        };
    })

    return returned_array;
}
