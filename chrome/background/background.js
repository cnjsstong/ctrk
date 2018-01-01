chrome.contextMenus.removeAll();
chrome.contextMenus.create({
    title: "View Report...",
    contexts: ["browser_action"],
    onclick: function() {
        chrome.tabs.create({'url': chrome.extension.getURL('dashboard/dashboard.html')});
    }
});