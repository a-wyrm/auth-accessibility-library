console.log("Auth Accessibility Extension content script loaded.");


function apply_style(element, styles) {
    for (var property in styles) {
      if (Object.hasOwnProperty.call(styles, property)) {
        element.style[property] = styles[property];
      }
    }
    return element;
}

/**
 * Creates the highlight elements (rectangle, circle, and dimensions text) for a given bounding rectangle.
 *
 * @param {rectangle} element_rectangle - The bounding rectangle of the element to highlight.
 * @param {boolean} size_limit - Indicates if the highlighted element has sufficient width and height (>= 24px).
 * @returns {jQuery[]} An array containing the rectangle, dimensions text jQuery elements.
*/

function createHighlight(element_rectangle, size_limit) {
  
      var highlight_rec = document.createElement('div');
      highlight_rec.className = 'tsc-rectangle-temp-ha';
      
      highlight_rec = apply_style(highlight_rec, {
        position: 'absolute',
        left: `${element_rectangle.left - 2}px`,
        top: `${element_rectangle.top - 2}px`,
        width: `${element_rectangle.width + 4}px`,
        height: `${element_rectangle.height + 4}px`,
        outline: '2px dashed black',
        border: '2px dashed rgb(130, 1, 250)',
        zIndex: '9999',
      });
    
    
      var get_text_dimension = document.createElement('div');
      get_text_dimension.className = 'tsc-dimensions-temp-ha';
      get_text_dimension.textContent = `${size_limit ? 'Pass' : 'Review'} - ${parseInt(element_rectangle.width)}px X ${parseInt(element_rectangle.height)}px`;
      get_text_dimension = apply_style(get_text_dimension, {
        position: 'absolute',
        left: `${element_rectangle.left}px`,
        top: `${element_rectangle.bottom}px`,
        backgroundColor: '#D3FA01',
        color: 'black',
        padding: '2px',
        fontWeight: 'bold',
        zIndex: '9999', 
      });
    
      return [highlight_rec, get_text_dimension];
};
  
  
/**
 * Highlights a given DOM element by adding temporary overlay elements.
 *
 * @param {Element} element - The DOM element to highlight.
 * @returns {jQuery[]} An array containing the created highlight elements (rectangle, circle, and dimensions text).
 */
function highLightElement(element) {
    console.log("Target Element: ", element);

    document.body.style.setProperty("position", "relative", "important");

    if (element === null) {
        console.log("Element not found, skipping highlight.");
        return [null, null];
    }

    var elementRect = element.getBoundingClientRect();
    var bodyRect = document.body.getBoundingClientRect();

    const rectangle = {
        left: Math.max(elementRect.left - bodyRect.left, 0),
        top: Math.max(elementRect.top - bodyRect.top, 0),
        right: Math.max(elementRect.left - bodyRect.left, 0) + elementRect.width,
        bottom: Math.max(elementRect.top - bodyRect.top, 0) + elementRect.height,
        height: elementRect.height,
        width: elementRect.width,
    };

    const size_checker = elementRect.width >= 24 && elementRect.height >= 24;
    const [highlight_rec, get_text_dimension] = createHighlight(rectangle, size_checker);

    // Append the highlight elements to the DOM
    document.body.appendChild(highlight_rec);
    document.body.appendChild(get_text_dimension);

    return [highlight_rec, get_text_dimension];
}

async function highlightFields(button_Objects){

    console.log("Highlighting fields...");
    const tempHighlights = document.querySelectorAll("body .tsc-rectangle-temp-ha, body .tsc-dimensions-temp-ha, body .tsc-circle-temp-ha");
    tempHighlights.forEach((el) => el.remove());

    button_Objects.forEach(button => {
    
        var targetElement = null;

        if (button.aria_label) {
            try {
                // Escape the aria-label value and attempt to query the element
                const escapedAriaLabel = CSS.escape(button.aria_label);
                const potentialElement = document.querySelector(`[aria-label="${escapedAriaLabel}"]`);
                targetElement = potentialElement;
            } catch (error) {
                console.warn(`Skipping invalid aria-label: ${button.aria_label}`, error);
                // Skip this button if the aria-label is invalid
                return;
            }
        }
        else if (button.id) {
            targetElement = document.querySelector(`#${button.id}`);
        }
        else if (button.text && button.attributes.role) {
            const potentialElements = Array.from(document.querySelectorAll(`[role="${button.attributes.role}"]`));
            const matchingElement = potentialElements.find(el => el.textContent.trim() === button.text);
            if (matchingElement) {
                targetElement = matchingElement;
            }
        }
        else if (!targetElement && button.html) {
            const classMatch = button.html.match(/class="([^"]+)"/); // Extract class attribute
            if (classMatch && classMatch[1]) {
                const classSelector = classMatch[1].split(" ").map((cls) => `.${CSS.escape(cls)}`).join("");
                targetElement = document.querySelector(classSelector);
            }
        }


        const [highlightElement, textElement] = highLightElement(targetElement);
    
        if (button.text) {
        textElement.textContent = button.text;
        } 
        else {
        textElement.textContent = "^";
        }
    })

}


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

    switch (request.action) {
        case "fetchButtons":
            const buttons = fetchButtons();
            highlightFields(buttons);
            return sendResponse({"webpageButtons": buttons})
    }
  });