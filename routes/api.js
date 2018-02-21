var express = require('express');
var router = express.Router();
var util = require('../util');
var db = require('./db/queries');


router.get('/location', function (req, res) {

    db.getAllLocations(function (err, data) {
        if (err) {
            res.sendStatus(500);
        } else {
            res.send(data);
        }
    })
});

router.get('/station', function (req, res) {

    db.getAllStations(function (err, data) {
        if (err) {
            res.sendStatus(500);
        } else {
            res.send(data);
        }
    })
});

router.post('/location', function (req, res) {
    //TODO - validate data

    var postData = req.body;
    postData.code = util.getHash(req.session.user);

    db.getSingleLocation(postData.code, function (err, data) {

        if (!data) {
            //create new record
            postData.note = postData.note || "";
            db.createLocation(postData, function (err, data) {
                if (err) {
                    res.sendStatus(500);
                } else {
                    res.sendStatus(201);
                }
            });
        } else {
            //Update record
            var updateData = data;
            updateData.note = postData.note || updateData.note;
            updateData.lat = postData.lat || updateData.lat;
            updateData.lon = postData.lon || updateData.lon;

            db.updateLocation(updateData, function (err, data) {
                if (err) {
                    res.sendStatus(500);
                } else {
                    res.sendStatus(200)
                }
            })
        }

    });

});

module.exports = router;