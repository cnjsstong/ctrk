const baseUrl = "https://us-central1-ctkr-1958f.cloudfunctions.net/api";

const panelCreate = document.querySelector("#panel-create");
const panelStat = document.querySelector("#panel-stat");
const panelEmpty = document.querySelector("#panel-empty");

const statId = document.querySelector("#stat-id");
const statTitle = document.querySelector("#stat-title");
const statOwner = document.querySelector("#stat-owner");
const statCount = document.querySelector("#stat-count");

const inputTitle = document.querySelector("#title");
const inputOwner = document.querySelector("#owner");

class BrowserTab {
    constructor(chromeTabObject) {
        this.chromeTabObject = chromeTabObject;
    }

    static getActiveTab() {
        return new Promise(function (resolve, reject) {
            chrome.tabs.query({active: true, currentWindow: true}, function (tabs) {
                let tab = tabs[0];
                if (tab) {
                    resolve(new BrowserTab(tab));
                } else {
                    reject();
                }
            });
        });
    }

    getUrl() {
        return this.chromeTabObject && this.chromeTabObject.url ? this.chromeTabObject.url : '';
    }

    sendMessage(message) {
        return new Promise(function (resolve, reject) {
            chrome.tabs.sendMessage(this.chromeTabObject.id, message, function (response) {
                if (response && response.success) {
                    resolve(response);
                } else {
                    reject(response);
                }
            });
        });
    }
}

class Page {
    constructor(browserTab) {
        this.browserTab = browserTab;
    }

    getActivePage() {
        return BrowserTab.getActiveTab().then((browserTab) => {
            return new Page(browserTab);
        });
    }

    sendMessage(message) {
        return this.browserTab.sendMessage(message);
    }

    insertPixel(imageUrl) {
        return this.sendMessage({
            action: "POST_INSERT",
            imageUrl: imageUrl
        });
    }

    isPosting() {
        return this.browserTab.getUrl().indexOf('post.craigslist.org') !== -1;
    }

    getPixelId() {
        if (this.browserTab.isPosting()) {
            return this.sendMessage({
                action: "POST_GET_ID"
            }).then(function (res) {
                return {
                    isPosting: true,
                    pixelId: res.pixelId,
                    zipcode: res.zipcode
                }
            });
        } else {
            return this.sendMessage({
                action: "VIEW_GET_ID"
            }).then(function (res) {
                return {
                    isPosting: false,
                    pixelId: res.pixelId
                }
            });
        }
    }
}

class API {
    constructor(baseUrl) {
        this.baseUrl = baseUrl;
    }

    createPixel(zipcode, owner) {
        return fetch(baseUrl + '/', {
            method: "POST",
            body: JSON.stringify({
                title: zipcode,
                owner: owner
            })
        }).then(function (res) {
            return res.json();
        });
    }

    getPixelStat(pixelId) {
        return fetch(baseUrl + '/stat/' + pixelId, {
            method: "GET"
        }).then(function (res) {
            return res.json();
        })
    }
}

const api = new API(baseUrl);

let clicked = false;

document.querySelector("#submit").addEventListener("click", function (event) {
    if (clicked) return;
    clicked = true;
    onSubmit();
});


function refresh(res) {
    const pixelId = res.pixelId;
    if (pixelId) {
        panelCreate.className = 'hidden panel';
        panelStat.className = 'shown panel';
        panelEmpty.className = 'hidden panel';
        showStat(pixelId);
    } else if (res.isPosting) {
        panelCreate.className = 'shown panel';
        panelStat.className = 'hidden panel';
        panelEmpty.className = 'hidden panel';
        inputTitle.value = res.zipcode;
    } else {
        panelCreate.className = 'hidden panel';
        panelStat.className = 'hidden panel';
        panelEmpty.className = 'shown panel';
    }
}

function showStat(pixelId) {
    return getPixelStat(pixelId).then(function (res) {
        statId.innerHTML = res.pixelId;
        statTitle.innerHTML = res.data.title;
        statOwner.innerHTML = res.data.adOwner;
        statCount.innerHTML = res.data.count || 0;
    });
}

function onSubmit() {
    createPixel(inputTitle.value, inputOwner.value).then(function (res) {
        return insertPixelImage(res.imageUrl).then(function () {
            return refresh({
                pixelId: res.pixelId,
                isPosting: true
            });
        });
    });
}


function createPixel(title, owner) {
    return fetch(baseUrl + '/', {
        method: "POST",
        body: JSON.stringify({
            title: title,
            owner: owner
        })
    }).then(function (res) {
        return res.json();
    });
}

function getChromeTab() {
    return new Promise(function (resolve, reject) {
        chrome.tabs.query({active: true, currentWindow: true}, function (tabs) {
            let tab = tabs[0];
            resolve(tab);
        });
    });
}

function sendMessageToTab(tab, message) {
    return new Promise(function (resolve, reject) {
        chrome.tabs.sendMessage(tab.id, message, function (response) {
            if (response && response.success) {
                resolve(response);
            } else {
                reject(response);
            }
        });
    });
}

function sendMessageToContentScript(message) {
    return getChromeTab().then(function (tab) {
        return sendMessageToTab(tab, message);
    });
}

function insertPixelImage(imageUrl) {
    return sendMessageToContentScript({
        action: "POST_INSERT",
        imageUrl: imageUrl
    });
}

function getPixelId() {
    return getChromeTab().then(function (tab) {
        const isPosting = tab.url.indexOf('post.craigslist.org') != -1;
        if (isPosting) {
            return sendMessageToTab(tab, {
                action: "POST_GET_ID"
            }).then(function (res) {
                return {
                    isPosting: true,
                    pixelId: res.pixelId,
                    zipcode: res.zipcode
                }
            });
        } else {
            return sendMessageToTab(tab, {
                action: "VIEW_GET_ID"
            }).then(function (res) {
                return {
                    isPosting: false,
                    pixelId: res.pixelId
                }
            });
        }
    });
}

function getPixelStat(pixelId) {
    return fetch(baseUrl + '/stat/' + pixelId, {
        method: "GET"
    }).then(function (res) {
        return res.json();
    })
}

const app = new Vue({
    el: '#el',
    data: {
        mode: 'welcome'
    },
    created: function () {
        getPixelId().then(function (res) {
            refresh(res);
        });
    }
});