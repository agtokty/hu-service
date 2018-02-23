var express = require('express');
var router = express.Router();
var util = require('../util');
var db = require('./db/queries');

router.get('/', function (req, res) {
    var pugOptions = req.pugOptions;
    pugOptions.pageTitle = "Durak ağırlık üretme sayfası";
    pugOptions.saved = false;

    res.render('pages/map/tools_weight_generate', pugOptions);
});

module.exports = router;