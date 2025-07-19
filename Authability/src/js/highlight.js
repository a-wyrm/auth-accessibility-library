


/**
 * Creates the highlight elements (rectangle, circle, and dimensions text) for a given bounding rectangle.
 *
 * @param {rectangle} element_rectangle - The bounding rectangle of the element to highlight.
 * @param {boolean} size_limit - Indicates if the highlighted element has sufficient width and height (>= 24px).
 * @returns {jQuery[]} An array containing the rectangle, dimensions text jQuery elements.
*/


function apply_style(element, styles) {
  for (var property in styles) {
    if (Object.hasOwnProperty.call(styles, property)) {
      element.style[property] = styles[property];
    }
  }
  return element;
}
function createHighlight(element_rectangle, size_limit) {

    var highlight_rec = document.createElement('div');
    highlight_rec.className = 'tsc-rectangle-temp-ha';
    
    highlight_rec = apply_style(highlight_rec, {
      left: `${element_rectangle.left - 2}px`,
      top: `${element_rectangle.top - 2}px`,
      width: `${element_rectangle.width + 4}px`,
      height: `${element_rectangle.height + 4}px`,
      outline: '2px dashed black',
      border: '2px dashed rgb(130, 1, 250)',
    });
  
  
    var get_text_dimension = document.createElement('div');
    get_text_dimension.className = 'tsc-dimensions-temp-ha';
    get_text_dimension.textContent = `${size_limit ? 'Pass' : 'Review'} - ${parseInt(element_rectangle.width)}px X ${parseInt(element_rectangle.height)}px`;
    get_text_dimension = apply_style(get_text_dimension, {
      left: `${element_rectangle.left}px`,
      top: `${element_rectangle.bottom}px`,
      backgroundColor: '#D3FA01',
      color: 'black',
      padding: '2px',
      fontWeight: 'bold',
    });
  
    return [highlight_rec, get_text_dimension];
};


/**
 * Highlights a given DOM element by adding temporary overlay elements.
 *
 * @param {Element} element - The DOM element to highlight.
 * @returns {jQuery[]} An array containing the created highlight elements (rectangle, circle, and dimensions text).
 */

export function highLightElement(element) {

  document.body.style.setProperty("position", "relative", "important");
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
  return createHighlight(rectangle, size_checker);
}