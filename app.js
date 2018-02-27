var exp = require('express');
var session = require('express-session');
// var credentials = require('./credentials.js');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
// var admin = require("firebase-admin");

var appConfig = require('./appConfig');



function getParam(argv, paramName) {
    if (argv.indexOf(paramName) != -1)
        return argv[argv.indexOf(paramName) + 1];
    else
        return null;
}

var defaultEnv = "dev";
var PORT = 80

var envParam = getParam(process.argv, "--env");
if (envParam) {
    if (envParam == "dev" || envParam == "test")
        defaultEnv = envParam;
}

var portParam = getParam(process.argv, "--port");
if (portParam) {
    if (!isNaN(portParam))
        PORT = portParam;
} else if (appConfig.port && !isNaN(appConfig.port)) {
    PORT = appConfig.port;
}


// admin.initializeApp({
//     credential: admin.credential.cert(credentials[defaultEnv].ServiceAccountKey),
//     databaseURL: credentials[defaultEnv].databaseURL
// });

var app = exp();
app.use(bodyParser.json());
//app.use(bodyParser.urlencoded({ extended: false }));

app.set('view engine', 'pug');
app.set('views', './layouts');
app.use(cookieParser("credentials.cookieSecret"));
app.use(session({
    secret: '2C44-4D44-WppQ38S',
    resave: true,
    saveUninitialized: true
}));

var publicFileExtensions = [".png", ".jpg"];

app.use(exp.static('public'));
app.use(function (req, res, next) {
    var send404 = false;
    for (var i = 0; i < publicFileExtensions.length; i++) {
        var ext = publicFileExtensions[i];
        if (req.originalUrl.endsWith(ext)) {
            send404 = true;
            break;
        }
    }
    if (send404)
        res.sendStatus(404);
    else
        next();
})

var secure = require('./routes/secure');
var index = require('./routes/index');
var rotalar = require('./routes/rotalar');
var tools = require('./routes/tools');
var api = require('./routes/api');

var pugOptions = {
    _UserDisplayName: "",
    rtl: ''
};

// Authentication and Authorization Middleware
app.use(function(req, res, next) {
    if (req.originalUrl.startsWith('/secure/login')) {
        return next();
    } else {
        if (req.session && req.session.user)
            return next();
        else {
            var url = req.url;
            if (url == "/")
                return res.redirect('/secure/login');
            else
                return res.redirect('/secure/login?returnUrl=' + url);
        }
    }
});

app.use(function (req, res, next) {
    //TODO - remove
    // req.session.user = req.session.user || "guest";

    req.baseDir = __dirname;
    pugOptions._UserDisplayName = req.session.user;
    req.pugOptions = pugOptions;
    req.pugOptions.activeMenu = req.url;
    req.pugOptions.errorMessage = null;
    next();
});

app.use('/secure', secure);
app.use('/', index);
app.use('/routes', rotalar);
app.use('/tools', tools);
app.use('/api', api);

app.listen(process.env.PORT || PORT, function () {
    console.log("HacettepeServisSaatleri started at : " + PORT)
});