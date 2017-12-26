console.log("in cg.js ");
const baseUrl = "https://us-central1-ctkr-1958f.cloudfunctions.net/api";
const re = new RegExp(baseUrl + '/pixel/(.*)\"');


const postBody = document.querySelector("#PostingBody");
const viewBody = document.querySelector("#postingbody");
const postZipcode = document.querySelector("#postal_code");


chrome.extension.onMessage.addListener(function (msg, sender, sendResponse) {
    console.log(msg, sender, sendResponse);
    if (!msg || !msg.action) {
        sendResponse({success: false});
    }
    switch (msg.action) {
        case 'VIEW_GET_ID':
            sendResponse({
                success: true,
                pixelId: getPixelId(viewBody && viewBody.innerHTML)
            });
            break;
        case 'POST_GET_ID':
            sendResponse({
                success: true,
                pixelId: getPixelId(postBody && postBody.value),
                zipcode: postZipcode.value
            });
            break;
        case 'POST_INSERT':
            postBody.value += '\n<img src="' + msg.imageUrl + '">';
            sendResponse({success: true});
            break;
    }
});


function getPixelId(text) {
    if (!text) return;
    if (text.indexOf(baseUrl) == -1) return;
    const res = re.exec(text);
    if (res.length < 2) return;
    return res[1];
}
