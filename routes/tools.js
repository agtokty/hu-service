var express = require('express');
var router = express.Router();
var util = require('../util');
var db = require('./db/queries');

router.get('/osrm', function (req, res) {
    var pugOptions = req.pugOptions;
    pugOptions.pageTitle = "OSRM";
    pugOptions.saved = false;

    res.render('pages/map/tools_osrm', pugOptions);
});

router.get('/generate-weight', function (req, res) {
    var pugOptions = req.pugOptions;
    pugOptions.pageTitle = "Ragele durak ağırlığı üretme sayfası";
    pugOptions.saved = false;

    res.render('pages/map/tools_weight_generate', pugOptions);
});

router.get('/create-route', function (req, res) {
    var pugOptions = req.pugOptions;
    pugOptions.pageTitle = "Rota Oluştur";

    res.render('pages/map/tools_create_route', pugOptions);
});



module.exports = router;