var db = require('./../routes/db/queries');
var request = require('sync-request');
var geodist = require('geodist')

const CENTER = {
    x: 39.8712639,
    y: 32.7330810
}

const CIRCLE_RADIUS_IN_METER = 250;
const OSRM_SERVICE_URL = "http://router.project-osrm.org";

var ALL_POINTS = [];

var CURRENT_QUERY_CURSER = 0;

var CURRENT_QUERY_INTERVAL_TIME = 300;
var CURRENT_QUERY_INTERVAL_ID = 0;
var QUERY_RESULTS = {}

//FindRoute("route", 32.6844, 39.8656, 32.7423, 39.8705, true, true, "geojson", false, false);
var FindRoute = function (profile, s_dy, s_dx, d_py, d_x, alternatives, steps, geometries, overview, annotations) {

    profile = profile || 'route';
    alternatives = (alternatives != true && alternatives != false) ? false : alternatives;
    steps = (steps != true && steps != false) ? false : steps;
    geometries = geometries || 'geojson';
    overview = overview || 'false';
    annotations = (annotations != true && annotations != false) ? false : annotations;

    ///route/v1/{profile}/{coordinates}?alternatives={true|false|number}&steps={true|false}
    //&geometries={polyline|polyline6|geojson}&overview={full|simplified|false}&annotations={true|false}

    //route/v1/driving/13.388860,52.517037;13.397634,52.529407;13.428555,52.523219?overview=false


    var coordinates = s_dy + "," + s_dx + ";" + d_py + "," + d_x;

    var path = "/route/v1/" + profile + "/" + coordinates + "?alternatives=" + alternatives + "&steps=" + steps + "&geometries=" + geometries + "&overview=" + overview;

    path = OSRM_SERVICE_URL + path;

    var data = null;

    try {
        var res = request('GET', path);
        var data = JSON.parse(res.getBody('utf8'));
    } catch (err) {
        console.log(err);
    }

    return data;
}

db.getAllStations(function (error, stations) {
    ALL_POINTS = stations;
    try {
        if (!ALL_POINTS || !ALL_POINTS.length)
            return console.log("ERROR 1");

        CURRENT_QUERY_INTERVAL_ID = setInterval(queryALL_ROUTES, CURRENT_QUERY_INTERVAL_TIME);

    } catch (err) {
        console.log(err);
    }
}, " where sp_distance is null")

var queryALL_ROUTES = function () {

    if (CURRENT_QUERY_CURSER < ALL_POINTS.length) {

        var source = ALL_POINTS[CURRENT_QUERY_CURSER];

        // var result = FindRoute("route", 32.6844, 39.8656, 32.7423, 39.8705, true, true, "geojson", false, false);
        var result = FindRoute("route", source.py, source.px, CENTER.y, CENTER.x, true, true, "geojson", false, false);

        if (result && result.code) {

            if (result.routes && result.routes.length > 0) {

                var route = result.routes[0];
                QUERY_RESULTS[source.adi] = {
                    adi: source.adi,
                    sp_distance: route.distance,
                    sp_duration: route.duration,
                    sp_weight: route.weight
                };

                db.updateStationSP(QUERY_RESULTS[source.adi], function (error, result) {
                    if (error) {
                        console.log("Can not update shortest path to center");
                    } else {
                        console.log(source.adi + " updated!");
                    }
                })

            } else {
                console.log("HATA : " + source.adi)
            }

        }

        CURRENT_QUERY_CURSER++;

    } else {
        console.log("All queries are done!");
        clearInterval(CURRENT_QUERY_INTERVAL_ID);
    }
}
