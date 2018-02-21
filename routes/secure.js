var express = require('express');
var router = express.Router();

var bodyParser = require('body-parser');
var urlencodedParser = bodyParser.urlencoded({
    extended: false
});

var util = require('./../util');

router.get('/login/', function (req, res) {
    if (req.session && req.session.user) {
        return res.redirect('/');
    } else {
        var returnUrl = req.query.returnUrl;
        if (returnUrl)
            req.pugOptions.returnUrl = returnUrl;
        res.render('pages/login-simple', req.pugOptions);
    }
});

router.post('/login/', urlencodedParser, function (req, res) {
    if (req.session && req.session.user) {
        return res.send();
    } else {

        if (req.body.password === req.body.username) {
            req.session.user = req.body.username;

            // var returnUrl = req.body.returnUrl;
            // if (returnUrl)
            //     return res.redirect(returnUrl);
            // else
            return res.redirect('/');
        } else {
            console.log("Parola yanlış!");
            res.render('pages/login-simple', {
                error: "Kullanıcı adı ya da parola hatalı!"
            });
        }
    }
});


router.get('/logout/', function (req, res) {
    if (req.session && req.session.user) {
        req.session.destroy();
    }

    return res.redirect('/secure/login');
});


module.exports = router;