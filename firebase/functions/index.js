const functions = require('firebase-functions');
const admin = require('firebase-admin');
const express = require('express');
const cors = require('cors');

const baseUrl = "https://us-central1-ctkr-1958f.cloudfunctions.net/api";

admin.initializeApp(functions.config().firebase);

const db = admin.database();
const logsRef = db.ref('ctrk/logs');
const pixelsRef = db.ref('ctrk/pixels');

let app = express();
app.use(cors());

app.get('/pixel/:pixelId', (req, res) => {
    const pixelId = req.params.pixelId;
    logsRef.push({
        pixelId: pixelId,
        clientIp: req.get('x-appengine-user-ip') || '',
        clientCountry: req.get('x-appengine-country') || '',
        clientRegion: req.get('x-appengine-region') || '',
        clientCity: req.get('x-appengine-city') || '',
        clientCityLatLong: req.get('x-appengine-CityLatLong') || '',
        referrer: req.get('Referrer') || '',
        userAgent: req.get('User-Agent') || '',
        headers: req.headers,
        createAt: Date.now()
    });
    pixelsRef.child(pixelId).child('count').transaction(function (current_value) {
        return (current_value || 0) + 1;
    });
    let buf = new Buffer(35);
    buf.write("R0lGODlhAQABAIAAAP///wAAACwAAAAAAQABAAACAkQBADs=", "base64");
    res.send(buf, {'Content-Type': 'image/gif'}, 200);
});

app.get('/stat/:pixelId', (req, res) => {
    const pixelId = req.params.pixelId;
    pixelsRef.child(pixelId).on('value', function(snapshot) {
        res.json({
            pixelId: pixelId,
            data: snapshot
        });
    });
});

app.post('/', (req, res) => {
    const obj = JSON.parse(req.body);
    const pixelId = pixelsRef.push({
        title: obj.title,
        adOwner: obj.owner,
        createAt: Date.now()
    }).key;
    res.json({
        pixelId: pixelId,
        imageUrl: baseUrl + "/pixel/" + pixelId
    });
});
exports.api = functions.https.onRequest(app);