var db = require('./../routes/db/queries');
var geodist = require('geodist');
var util = require('./util');

//Bus capacity
const CAPACITY = 40;

//Max distance between stations for each route
const MAX_DISTANCE = 1000

var REGION_ID = 1;
var STATIONS = [];
var STATIONS_USED = [];
var STATIONS_OBJECT = {};

var ROTALAR = {}
var LISTE = []

db.getAllStations(stationsCallback, " where region = " + REGION_ID);

function stationsCallback(err, stations) {

    if (err)
        return console.log("ERROR 1");

    STATIONS = stations;

    var currentTotal = 0;

    var route_id = 1;
    while (STATIONS.length == STATIONS_USED.length) {

        var startPoint = EnUzakDurak();
        startPoint.route = route_id;

        STATIONS_USED.push(startPoint);

        var stationObject = convertObjectByProperty(startPoint,"adi")

        var cevreDuraklar = CevreDuraklar(startPoint);

        if (cevreDuraklar.length > 0) {
            if (KapasiteKontrol(cevreDuraklar, currentTotal)) {
                //Hedefe en uzak olanları kapasiteyi dolduracak şekilde kullan

                currentTotal = 0;
                continue;
            } else {
                //Hepsini bu rota için kullan

                //cevreDuraklar arasından Merkeze en yakın olanı startpoint olarak kabul et ve devam et
            }

        } else {

        }

        route_id++;
    }

}


function KapasiteKontrol(stations, currentTotal) {
    var total = currentTotal;
    for (let i = 0; i < stations.length; i++) {
        const element = stations[i];
        total = total + (element["weight"] || 0)
    }

    return total > CAPACITY;
}

function CevreDuraklar(station) {
    //verilen noktaya en yakın noktayı döner - 1000 km
    //yol olarak uzaklık kullanılmalı
}

function EnUzakDurak() {
    //en uzak noktayı bulur ve döner
}


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