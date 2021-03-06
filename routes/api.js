var express = require('express');
var router = express.Router();
var util = require('../util');
var randomNumberPopulater = require('../tools/randomNumberPopulater');
var clearData = require('../tools/clearData');
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

router.get('/station/active', function (req, res) {

    db.getAllStations(function (err, data) {
        if (err) {
            res.sendStatus(500);
        } else {
            res.send(data);
        }
    }, " where is_active = true")
});

router.get('/station/master', function (req, res) {

    db.getAllStations(function (err, data) {
        if (err) {
            res.sendStatus(500);
        } else {
            res.send(data);
        }
    }, " where is_master = true")
});

router.get('/station/all', function (req, res) {

    db.getAllStations(function (err, data) {
        if (err) {
            res.sendStatus(500);
        } else {
            res.send(data);
        }
    })
});

router.get('/route/all', function (req, res) {

    db.getAllRoutes(function (err, data) {
        if (err) {
            res.sendStatus(500);
        } else {
            res.send(data);
        }
    })
});

router.post('/route', function (req, res) {
    //TODO - validate data

    var postData = req.body;

    postData.description = postData.description || "";
    postData.name = postData.name || "";
    postData.start = postData.start || "";
    postData.total_passenger = postData.total_passenger || 0;
    postData.expected_passenger = postData.expected_passenger || 0;
    postData.color = postData.color || "#000000";
    postData.is_active = (postData.is_active == true || postData.is_active == false) ? postData.is_active : false;
    postData.created_by = req.session.user || "api_request";

    if (!postData.geojson)
        return res.status(400).send({ error: "geojson can not be empty" });

    db.insertRoute(postData, function (err, data) {
        if (err) {
            return res.sendStatus(500);
        } else {
            return res.sendStatus(201);
        }
    });

});

router.post('/location', function (req, res) {
    //TODO - validate data

    var postData = req.body;
    postData.code = util.getHash(req.session.user);

    db.getSingleLocation(postData.code, function (err, data) {

        if (!data) {
            //create new record
            postData.note = postData.note || "";
            postData.station_name = postData.station_name || "";

            db.createLocation(postData, function (err, data) {
                if (err) {
                    res.status(500).send(err);
                } else {
                    res.sendStatus(201);

                    db.updateStationWegiht(postData.station_name, true, function (err) {
                        if (err) {
                            console.log(err);
                        }
                    })

                }
            });
        } else {
            //Update record
            var updateData = data;

            var old_station_name = data.station_name;

            updateData.note = postData.note || updateData.note;
            updateData.lat = postData.lat || updateData.lat;
            updateData.lon = postData.lon || updateData.lon;
            updateData.station_name = postData.station_name || updateData.station_name;

            db.updateLocation(updateData, function (err, data) {
                if (err) {
                    res.status(500).send(err);
                } else {
                    res.sendStatus(200)

                    db.updateStationWegiht(updateData.station_name, true, function (err) {
                        if (err) {
                            console.log(err);
                        }
                    })

                    if (old_station_name)
                        db.updateStationWegiht(old_station_name, false, function (err) {
                            if (err) {
                                console.log(err);
                            }
                        })

                }
            })
        }

    });

});

router.post('/tools/clear', function (req, res) {
    var postData = req.body;

    clearData.clear(postData.radius).then((message) => {
        res.status(200).send({ message: message, error: null });
    }).catch((err) => {
        res.status(500).send({ message: "", error: err });
    })
})

router.post('/tools/generate_weight', function (req, res) {
    var postData = req.body;
    postData.code = util.getHash(req.session.user);

    db.resetAllStations()
        .then((data) => {

            if (postData.use_masters == true) {
                db.getAllStations(function (err, master_points) {
                    if (err) return res.status(500).send({ message: "can not get master points", error: err });

                    var resultIds = [];
                    for (let index = 0; index < master_points.length; index++) {
                        const element = master_points[index];
                        resultIds.push(element.id)
                    }

                    var resultData = randomNumberPopulater.createRandomNumbers(resultIds.length, postData.weight, 5, []);
                    var updates = [];

                    for (var i = 0; i < resultIds.length; i++) {
                        updates.push({
                            id: resultIds[i],
                            weight: Number(resultData[i])
                        })
                    }

                    db.updateGeneratedWeights(updates, function (err, data) {
                        console.log(err)
                        console.log(data)
                    })

                    res.status(200).send({ data: postData, result: {} });

                }, " where is_master = true")
            } else {
                db.getStationMinMaxId(function (err, data) {
                    if (err) return res.status(500).send({ message: "can not get min max id", error: err });

                    var resultIds = randomNumberPopulater.createNRondomNumber(data[0].min, data[0].max, postData.count, true);
                    var resultData = randomNumberPopulater.createRandomNumbers(postData.count, postData.weight, 5, []);

                    var updates = [];

                    for (var i = 0; i < resultIds.length; i++) {
                        updates.push({
                            id: resultIds[i],
                            weight: Number(resultData[i])
                        })
                    }

                    db.updateGeneratedWeights(updates, function (err, data) {
                        console.log(err)
                        console.log(data)
                    })

                    res.status(200).send({ data: postData, result: {} });

                })
            }


        })
        .catch((err) => {
            return res.status(500).send({ message: "can not reset all stations", error: err });
        })
});


module.exports = router;