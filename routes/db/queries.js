var promise = require('bluebird');
var CONFIG = require('../../appConfig');

var options = {
    // Initialization Options
    promiseLib: promise
};

var pgp = require('pg-promise')(options);
var database = pgp(CONFIG.database.postgres);

function query(QUERY, cb) {
    database.result(QUERY)
        .then(function (result) {
            cb(null, "OK");
        })
        .catch(function (err) {
            cb(err);
        });
}


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
    database.none('insert into location(code, note, lat, lon, station_name, createdat, updatedat, point)' +
        ' values(${code}, ${note}, ${lat}, ${lon}, ${station_name}, current_timestamp, current_timestamp, ' +
        ' ST_GeomFromText(\'POINT(${lon} ${lat})\') )', data)
        .then(function () {
            cb(null, { result: "ok" })
        })
        .catch(function (err) {
            cb(err);
        });
}

function updateLocation(data, cb) {
    database.none('update location set note=${note}, lat=${lat}, lon=${lon}, station_name=${station_name}, updatedat=current_timestamp , ' +
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

function updateStationSP(data, cb) {
    database.none('update station set sp_distance=${sp_distance}, sp_duration=${sp_duration}, sp_weight=${sp_weight}  ' +
        ' where adi=${adi}', data)
        .then(function () {
            cb(null, { result: "ok" })
        })
        .catch(function (err) {
            cb(err);
        });
}

function updateStationWegiht(station_name, isIncrement, cb) {

    if (isIncrement) {
        var query = 'update station set weight = weight + 1  where adi= \'' + station_name + '\'';
    } else {
        var query = 'update station set weight = weight - 1  where adi= \'' + station_name + '\'';
    }

    database.none(query, {})
        .then(function () {
            cb(null, { result: "ok" })
        })
        .catch(function (err) {
            cb(err);
        });
}


function getAllStations(cb, whereFilter) {
    var query = 'select * from station'
    if (whereFilter)
        query = query + " " + whereFilter;

    database.any(query)
        .then(function (data) {
            cb(null, data);
        })
        .catch(function (err) {
            cb(err)
        });
}


function getAllRoutes(cb) {
    database.any('select * from route')
        .then(function (data) {
            cb(null, data);
        })
        .catch(function (err) {
            cb(err)
        });
}

function insertRoute(data, cb) {
    database.none('insert into route(name, description, start, color, geojson, total_passenger, expected_passenger, is_active, created_by ,created_at)' +
        ' values(${name}, ${description}, ${start},  ${color}, ${geojson}, ${total_passenger}, ' +
        '${expected_passenger}, ${is_active}, ${created_by}, current_timestamp)', data)
        .then(function () {
            if (cb)
                cb(null, { result: "ok" })
        })
        .catch(function (err) {
            if (cb)
                cb(err);
        });
}


function getStationMinMaxId(cb) {
    database.any('select min(id) as min, max(id) as max from station')
        .then(function (data) {
            cb(null, data);
        })
        .catch(function (err) {
            cb(err)
        });
}

function getAllActiveStations(cb) {
    database.any('select * from station where is_active = true')
        .then(function (data) {
            cb(null, data);
        })
        .catch(function (err) {
            cb(err)
        });
}

function resetAllStations(cb) {
    database.none('update station set weight=0, is_active=false ', {})
        .then(function () {
            cb(null, { result: "ok" })
        })
        .catch(function (err) {
            cb(err);
        });
}

function updateGeneratedWeights(updates, cb) {

    // var updates = [{ id: 1, weight: 23 }, { id: 4, weight: 233 }, { id: 5, weight: 523 }];
    database.tx(t => {
        var queries = updates.map(u => {
            return t.none('update station set weight=${weight}, is_active=true where id = $(id)', u);
        });
        return t.batch(queries);
    })
        .then(data => {
            cb(null, "ok")
        })
        .catch(error => {
            cb(error)
        });

}

function updateMasterInfo(updates, cb) {

    // var updates = [{ id: 1, weight: 23 }, { id: 4, weight: 233 }, { id: 5, weight: 523 }];
    database.tx(t => {
        var queries = updates.map(u => {
            return t.none('update station set is_master=${is_master}, is_active=true where id = $(id)', u);
        });
        return t.batch(queries);
    })
        .then(data => {
            cb(null, "ok")
        })
        .catch(error => {
            cb(error)
        });

}


module.exports = {
    query: query,
    getAllLocations: getAllLocations,
    getSingleLocation: getSingleLocation,
    createLocation: createLocation,
    updateLocation: updateLocation,
    removeLocation: removeLocation,
    insertStation: insertStation,
    getAllStations: getAllStations,
    getAllActiveStations: getAllActiveStations,
    resetAllStations: resetAllStations,
    getStationMinMaxId: getStationMinMaxId,
    updateGeneratedWeights: updateGeneratedWeights,
    getAllRoutes: getAllRoutes,
    insertRoute: insertRoute,
    updateStationSP: updateStationSP,
    updateStationWegiht: updateStationWegiht,
    updateMasterInfo: updateMasterInfo
};