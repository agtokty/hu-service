var promise = require('bluebird');
var CONFIG = require('../../appConfig');

var options = {
    // Initialization Options
    promiseLib: promise
};

var pgp = require('pg-promise')(options);
var database = pgp(CONFIG.database.postgres);

function getAllLocations(cb) {
    database.any('select * from location')
        .then(function (data) {
            cb(null, data);
        })
        .catch(function (err) {
            cb(err)
        });
}

function getSingleLocation(code, cb) {
    database.one('select * from location where code = $1', code)
        .then(function (data) {
            cb(null, data);
        })
        .catch(function (err) {
            cb(err);
        });
}

function createLocation(data, cb) {
    database.none('insert into location(code, note, lat, lon, createdat, updatedat, point)' +
        ' values(${code}, ${note}, ${lat}, ${lon}, current_timestamp, current_timestamp, ' +
        ' ST_GeomFromText(\'POINT(${lon} ${lat})\') )', data)
        .then(function () {
            cb(null, { result: "ok" })
        })
        .catch(function (err) {
            cb(err);
        });
}

function updateLocation(data, cb) {
    database.none('update location set note=${note}, lat=${lat}, lon=${lon}, updatedat=current_timestamp , ' +
        ' point=ST_GeomFromText(\'POINT(${lon} ${lat})\')' +
        ' where id=${id}', data)
        .then(function () {
            cb(null, { result: "ok" })
        })
        .catch(function (err) {
            cb(err);
        });
}

function removeLocation(code, cb) {
    database.result('delete from location where code = $1', code)
        .then(function (result) {
            cb(null, {
                status: 'ok',
                message: `Removed ${result.rowCount} puppy`
            });
        })
        .catch(function (err) {
            cb(err);
        });
}

function insertStation(data, cb) {
    database.none('insert into station(adi, yeri, hatlar, px, py)' +
        ' values(${adi}, ${yeri}, ${hatlar}, ${px}, ${py} )', data)
        .then(function () {
            if (cb)
                cb(null, { result: "ok" })
        })
        .catch(function (err) {
            if (cb)
                cb(err);
        });
}

function getAllStations(cb) {
    database.any('select * from station')
        .then(function (data) {
            cb(null, data);
        })
        .catch(function (err) {
            cb(err)
        });
}

module.exports = {
    getAllLocations: getAllLocations,
    getSingleLocation: getSingleLocation,
    createLocation: createLocation,
    updateLocation: updateLocation,
    removeLocation: removeLocation,
    insertStation: insertStation,
    getAllStations: getAllStations
};