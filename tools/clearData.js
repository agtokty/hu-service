var db = require('./../routes/db/queries');
var geodist = require('geodist');
var util = require('./util');

/**
 * Bu kodun amacı, birbirine çok yakın olan durakların birleştirilmesidir.
 * Kullanılan parametreler;
 *  - varış noktasına olan rota uzaklıkları
 *  - yakınlık olarak kabul edilecek olan mesafe (metre değeri olarak -r parametresi)
 */

//usage :  node .\tools\clearData.js -r 1000

//meter
var RADIUS = 500;

RADIUS = util.getParam(process.argv, "-r", 500);

var STATIONS = [];
var STATIONS_OBJECT = {};


// tüm istasyonların is_master değeri false yapılır
db.query('update station set is_master = FALSE', function (err, res) {

    if (err) {
        return console.log("can not reset station table!");
    }

    db.getAllStations(function (err, stations) {

        if (err)
            return console.log("ERROR 1");

        STATIONS = stations;

        STATIONS_OBJECT = convertObjectByProperty(stations, "adi");

        for (const key in STATIONS_OBJECT) {
            if (STATIONS_OBJECT.hasOwnProperty(key)) {
                const point = STATIONS_OBJECT[key];
                if (point.is_used === undefined || point.is_used === false) {
                    selectMasterStation(point);
                }
            }
        }

        var RESULT = [];

        var count = 0;
        for (const key in STATIONS_OBJECT) {
            if (STATIONS_OBJECT.hasOwnProperty(key)) {
                const point = STATIONS_OBJECT[key];

                if (point.is_master == true) {
                    //console.log(count++ + " " + point.adi);
                    RESULT.push(point);
                }
            }
        }


        db.updateMasterInfo(RESULT, function (err, res) {

            if (err)
                return console.log("err : " + err);

            console.log("TOTAL MASTER STATION : " + RESULT.length);
            console.log("res : " + res);

        })

    });

})

function convertObjectByProperty(data, propery) {
    var result = {};

    for (let index = 0; index < data.length; index++) {
        const element = STATIONS[index];
        if (element && typeof (element[propery]) !== 'undefined') {
            result[element[propery]] = element;
        }
    }

    return result;
}

function convertObjectToArray(data) {
    var result = [];
    for (const key in data) {
        if (data.hasOwnProperty(key)) {
            result.push(data[key])
        }
    }

    return result;
}

function selectMasterStation(node) {

    var neighbors = [];

    // verilen noktanın RADIUS uzaklığındaki komşuları bulunur
    for (const key in STATIONS_OBJECT) {
        if (STATIONS_OBJECT.hasOwnProperty(key)) {
            const point = STATIONS_OBJECT[key];

            if (point.adi == node.adi)
                continue;

            var dist = geodist({ lat: point.px, lon: point.py }, { lat: node.px, lon: node.py }, { unit: 'meters' })
            if (dist <= RADIUS) {
                neighbors.push(point);
            }
        }
    }


    STATIONS_OBJECT[node.adi].is_used = true;

    if (neighbors.length == 0) {
        //bu noktanın komşusu yoksa kendi başına master olur
        STATIONS_OBJECT[node.adi].is_master = true;
    } else {
        //komşuları ile birlikte bu nokta dahil olmak üzere merkeze en yakın nokta master olarak kabul edilir.
        neighbors.push(node);

        var nearest_point = neighbors[0];

        for (let index = 0; index < neighbors.length; index++) {
            const element = neighbors[index];

            if (element["sp_distance"] && element["sp_distance"] < nearest_point["sp_distance"]) {
                nearest_point = element;
            }

            STATIONS_OBJECT[element.adi].is_master = false;
            STATIONS_OBJECT[element.adi].is_used = true;
        }

        STATIONS_OBJECT[nearest_point.adi].is_master = true;
    }

    //console.log(neighbors);
}



