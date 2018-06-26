var db = require('./../routes/db/queries');
var geodist = require('geodist');
var util = require('./util');

//Bus capacity
const CAPACITY = 40;

//Max distance between stations for each route
const MAX_DISTANCE = 1000

var STATIONS = [];
var STATIONS_OBJECT = {};


db.getAllStations(stationsCallback, " where region = 1");

function stationsCallback(err, stations) {

    if (err)
        return console.log("ERROR 1");

    STATIONS = stations;

    STATIONS_OBJECT = convertObjectByProperty(stations, "adi");

    for (const key in STATIONS_OBJECT) {
        if (STATIONS_OBJECT.hasOwnProperty(key)) {
            const point = STATIONS_OBJECT[key];

        }
    }

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