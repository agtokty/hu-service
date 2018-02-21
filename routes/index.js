var express = require('express');
var router = express.Router();
var util = require('../util');

var db = require('./db/queries');

router.get('/', function (req, res) {
    var pugOptions = req.pugOptions;
    pugOptions.pageTitle = "";
    pugOptions.saved = false;

    var code = util.getHash(req.session.user);

    db.getSingleLocation(code, function (err, data) {
        if (data) {
            pugOptions.savedData = {
                lat: data.lat,
                lon: data.lon,
                note: data.note
            };
            pugOptions.saved = true;
        }
        res.render('pages/map/map_index', pugOptions);
    })

    // res.render('pages/map/map_index', pugOptions);
});

router.post('/', function (req, res) {

    var data = req.body;

    db.createLocation(data, function (err) {
        if (err) {
            res.sendStatus(500);
        } else {
            res.sendStatus(200);
        }
    })

});

module.exports = router;