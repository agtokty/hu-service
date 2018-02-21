var db = require('./../routes/db/queries');
var request = require('sync-request');
var geodist = require('geodist')

const CIRCLE_RADIUS_IN_METER = 250;
const OSRM_SERVICE_URL = "http://router.project-osrm.org";

var ALL_POINTS = [];
var DISTANCES = [];

var CURRENT_QUERY_CURSER = 0;
var CURRENT_QUERY_CURSER = {
    point: 0,
    distance: 0
};
var CURRENT_QUERY_INTERVAL_TIME = 5000;
var CURRENT_QUERY_INTERVAL_ID = 0;
var QUERY_RESULTS = {

}

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


//FindRoute("route", 32.6844, 39.8656, 32.7423, 39.8705, true, true, "geojson", false, false);


db.getAllStations(function (error, stations) {

    ALL_POINTS = stations;

    try {

        if (!ALL_POINTS || !ALL_POINTS.length)
            return console.log("ERROR 1");

        var total = 0;
        for (let i = 0; i < ALL_POINTS.length; i++) {

            var source = ALL_POINTS[i];

            var result = getNearPoints(ALL_POINTS, source, CIRCLE_RADIUS_IN_METER);
            console.log(i + " (" + source.adi + ") point : " + source.px + ";" + source.py + " near : " + result.length)

            ALL_POINTS[i].distances = result;
            // DISTANCES[source.adi] = result;

            total += result.length;
        }

        console.log("TOTAL : " + total);

        // CURRENT_QUERY_INTERVAL_ID = setInterval(queryALL_ROUTES, CURRENT_QUERY_INTERVAL_TIME);
        CURRENT_QUERY_INTERVAL_ID = setInterval(queryALL_ROUTES2, 1000);

    } catch (err) {
        console.log(err);
    }

})


var queryALL_ROUTES2 = function () {

    if (CURRENT_QUERY_CURSER.point < ALL_POINTS.length) {

        var source = ALL_POINTS[CURRENT_QUERY_CURSER.point];

        //TODO - uncomment here to use only points that have weight!
        // if(!source.weight || source.weight == 0){
        //     CURRENT_QUERY_CURSER.point++;
        //     CURRENT_QUERY_CURSER.distance = 0;
        //     continue;
        // }

        if (source && source.distances && source.distances.length) {

            if (CURRENT_QUERY_CURSER.distance < source.distances.length) {

                const distance = source.distances[CURRENT_QUERY_CURSER.distance];

                var route = FindRoute("route", source.py, source.px, distance.destionation.py, distance.destionation.px, false, true, "geojson", false, false);
                if (route && route.code) {
                    QUERY_RESULTS[route.code] = QUERY_RESULTS[route.code] ? (QUERY_RESULTS[route.code] + 1) : 1;

                    var str = "??";
                    if (route.routes && route.routes.length > 0)
                        str = source.adi + " -> " + distance.destionation.adi + " : duration : " + (route.routes[0].duration || "?") + ", distance : " + (route.routes[0].distance || "?")

                    console.log(CURRENT_QUERY_CURSER.point + " - " + CURRENT_QUERY_CURSER.distance + " ---> " + str);
                }

                CURRENT_QUERY_CURSER.distance++;
            } else {

                CURRENT_QUERY_CURSER.point++;
                CURRENT_QUERY_CURSER.distance = 0;

            }
        } else {
            CURRENT_QUERY_CURSER.point++;
        }

    } else {
        console.log("All queries are done!");
        clearInterval(CURRENT_QUERY_INTERVAL_ID);
    }
}

var queryALL_ROUTES = function () {

    if (CURRENT_QUERY_CURSER < ALL_POINTS.length) {

        var source = ALL_POINTS[CURRENT_QUERY_CURSER];
        if (source && source.distances && source.distances.length) {

            for (let index = 0; index < source.distances.length; index++) {
                const distance = source.distances[index];

                // var route = FindRoute("route", 32.6844, 39.8656, 32.7423, 39.8705, true, true, "geojson", false, false);
                var route = FindRoute("route", source.py, source.px, distance.destionation.py, distance.destionation.px, true, true, "geojson", false, false);

                if (route && route.code) {
                    QUERY_RESULTS[route.code] = QUERY_RESULTS[route.code] ? (QUERY_RESULTS[route.code] + 1) : 0;
                }
            }
        }

        CURRENT_QUERY_CURSER++;

    } else {
        console.log("All queries are done!");
        clearInterval(CURRENT_QUERY_INTERVAL_ID);
    }
}

var getNearPoints = function (points, source, min_distance) {

    var RESULT = [];

    if (!source.px && !source.py)
        return RESULT;

    for (let j = 0; j < points.length; j++) {

        var dest = points[j];

        if (source.px == dest.px && source.py == dest.py)
            continue;

        var dist = geodist({ lat: source.px, lon: source.py }, { lat: dest.px, lon: dest.py }, { unit: 'meters' })

        if (dist <= min_distance) {
            RESULT.push({
                destionation: dest,
                distance: dist
            });
        }

    }

    return RESULT
}



