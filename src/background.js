/*global chrome*/
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
function getAxe(message, sendResponse) {
    return __awaiter(this, void 0, void 0, function () {
        var error_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 2, , 3]);
                    return [4 /*yield*/, chrome.scripting.executeScript({
                            target: {
                                tabId: message.activeId
                            },
                            files: ["js/axe.js"]
                        })];
                case 1:
                    _a.sent();
                    sendResponse({
                        status: "ok"
                    });
                    return [3 /*break*/, 3];
                case 2:
                    error_1 = _a.sent();
                    console.error("Error executing script:", error_1);
                    sendResponse({
                        status: "error",
                        message: error_1.message
                    });
                    return [3 /*break*/, 3];
                case 3: return [2 /*return*/, true];
            }
        });
    });
}
/* async function highlightFields(element_list){

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
chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true }).catch((error) => console.error(error)) */ 
