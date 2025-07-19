/*global chrome*/


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

chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true }).catch((error) => console.error(error));