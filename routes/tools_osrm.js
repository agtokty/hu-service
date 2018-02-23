var express = require('express');
var router = express.Router();
var util = require('../util');
var db = require('./db/queries');

router.get('/', function (req, res) {
    var pugOptions = req.pugOptions;
    pugOptions.pageTitle = "OSRM";
    pugOptions.saved = false;

    res.render('pages/map/tools_osrm', pugOptions);
});

module.exports = router;