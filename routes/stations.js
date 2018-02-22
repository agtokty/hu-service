var express = require('express');
var router = express.Router();
var util = require('../util');
var db = require('./db/queries');

router.get('/', function (req, res) {
    var pugOptions = req.pugOptions;
    pugOptions.pageTitle = "Stations";
    pugOptions.saved = false;

    res.render('pages/map/map_stations', pugOptions);
});

module.exports = router;