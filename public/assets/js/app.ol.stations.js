$(function () {

    var defaultZoom = 10;
    var defaultLonLatCenter = [32.7615216, 39.908144];

    var mapHeight = $("body").height() - 70;
    $("#map").height(mapHeight);

    var osmLayer = new ol.layer.Tile({
        source: new ol.source.OSM(),
    });

    var vectorSource4Stations = new ol.source.Vector({
        projection: 'EPSG:4326'
    });

    var vectorLayer = new ol.layer.Vector({
        source: vectorSource4Stations,
        // style: function (feature) {
        //     return styles[feature.get('type')];
        // }
    });

    var styles = {
        route: new ol.style.Style({
            stroke: new ol.style.Stroke({
                width: 6, color: [40, 40, 40, 0.8]
            })
        }),
        driving: new ol.style.Style({
            stroke: new ol.style.Stroke({
                width: 6, color: [200, 40, 40, 0.8]
            })
        }),
        car: new ol.style.Style({
            stroke: new ol.style.Stroke({
                width: 6, color: [200, 200, 40, 0.8]
            })
        }),
        walk: new ol.style.Style({
            stroke: new ol.style.Stroke({
                width: 6, color: [40, 200, 100, 0.8]
            })
        }),
        bike: new ol.style.Style({
            stroke: new ol.style.Stroke({
                width: 6, color: [40, 200, 200, 0.8]
            })
        }),
        foot: new ol.style.Style({
            stroke: new ol.style.Stroke({
                width: 6, color: [200, 200, 100, 0.8]
            })
        })
    };

    var styleFunction = function (feature) {
        return styles[feature.getGeometry().getType()];
    };
    var vectorSource4Routes = new ol.source.Vector({
        projection: 'EPSG:4326'
    });
    var routeVectorLayer = new ol.layer.Vector({
        source: vectorSource4Routes,
        // style: styleFunction
    });

    var googleLayer = new ol.layer.Tile({
        source: new ol.source.OSM({
            url: 'http://mt{0-3}.google.com/vt/lyrs=m&x={x}&y={y}&z={z}',
            attributions: [
                new ol.Attribution({ html: '© Google' }),
                new ol.Attribution({ html: '<a href="https://developers.google.com/maps/terms">Terms of Use.</a>' })
            ]
        })
    })

    var map = new ol.Map({
        target: 'map',
        layers: [
            osmLayer,
            googleLayer,
            vectorLayer,
            routeVectorLayer
        ],
        view: new ol.View({
            center: ol.proj.fromLonLat(defaultLonLatCenter),
            zoom: defaultZoom,
            minZoom: 10,
            maxZoom: 19
            // projection : 'EPSG:4326'
        }),
        controls: [],
    });

    map.on("click", function (event) {
        var coords = ol.proj.transform(event.coordinate, 'EPSG:3857', 'EPSG:4326');
        var v = event.map.getView();
        console.log("zoom " + v.getZoom());
        // console.log(coords);
    });

    $(".map-layers").on("click", "a", function (e) {
        if (e.target && e.target.id) {
            setLayer(e.target.id);
        }
    })

    var setLayer = function (layerName) {
        if (!layerName)
            return;
        if (layerName == "google-layer") {
            googleLayer.setVisible(true);
        } else if (layerName == "osm-layer") {
            googleLayer.setVisible(false);
        }

        $("#" + layerName).addClass("selected-layer");
        $("#" + layerName).siblings().removeClass("selected-layer");

        localStorage.setItem('selected-layer', layerName);
    }

    setLayer(localStorage.getItem('selected-layer'))

    //durakları çek
    $.ajax({
        dataType: "json",
        url: "/api/station",
    }).done(function (data) {
        addStationCircle(data);
    });

    var addStationCircle = function (duraklar) {

        var featuresDuraklar = [];
        var i, geom, feature;

        for (i = 0; i < duraklar.length; i++) {

            geom = new ol.geom.Circle(
                ol.proj.transform([duraklar[i].py, duraklar[i].px], 'EPSG:4326', 'EPSG:3857'),
                25
            );

            feature = new ol.Feature(geom);
            featuresDuraklar.push(feature);
        }

        vectorSource4Stations.addFeatures(featuresDuraklar);
    }

    //Find and draw route
    var SELECT_FOR = {
        START: "start",
        STOP: "stop",
        NON: "non"
    }

    var SELECTED_STATIONS = {
        START: {},
        STOP: {},
        profile: "car",
        alternatives: false,
        steps: true,
        USE: function () {
            if (!this.START || !this.START)
                return console.log("START or/and STOP not defined");

            this.profile = $("#route-type").val() || this.profile;
            FindRoute({
                profile: this.profile,
                alternatives: this.alternatives,
                steps: this.steps,
                start: this.START,
                stop: this.STOP
            }, function (result) {

                if (!result)
                    return alert("Hata!");

                if (result.routes && result.routes.length > 0) {
                    var route1 = result.routes[0];
                    utils.createRoute(route1, vectorSource4Routes, this.profile);
                    utils.createRouteInfo(route1, "#route-result");
                }

                console.log(result);
            }.bind(this))
        }
    }

    var selectFor = SELECT_FOR.START;

    var mapClickListenerKey = null;

    var mapClickListener = function (event) {
        var coords = ol.proj.transform(event.coordinate, 'EPSG:3857', 'EPSG:4326');
        console.log(coords);

        var tempCoords = [Number(coords[0]).toFixed(6), Number(coords[1]).toFixed(6)].join();

        if (selectFor == SELECT_FOR.START) {

            SELECTED_STATIONS.START = coords;
            $("#startInput").val(tempCoords);

        } else if (selectFor == SELECT_FOR.STOP) {

            SELECTED_STATIONS.STOP = coords;
            $("#stopInput").val(tempCoords);
            SELECTED_STATIONS.USE();

        } else {

        }

        ol.Observable.unByKey(mapClickListenerKey);
    }

    $(".start-stop").on("click", function (e) {
        selectFor = $(e.target).attr("selectFor") || "start";
        mapClickListenerKey = map.on("click", mapClickListener);

        $(e.target).val("");
    })

    $(".start-stop-btn").on("click", function (e) {
        selectFor = $(e.target).attr("selectFor") || "start";
        mapClickListenerKey = map.on("click", mapClickListener);

        $("#" + selectFor +"Input").val("");
    })

    $("#clear-routes").on("click", function () {
        vectorSource4Routes.clear();

        $("#route-result").empty();
    });

    var FindRoute = function (options, callback) {

        options.profile = options.profile || 'route';
        options.alternatives = (options.alternatives != true && options.alternatives != false) ? false : options.alternatives;
        options.steps = (options.steps != true && options.steps != false) ? false : options.steps;
        options.geometries = options.geometries || 'geojson';
        options.overview = options.overview || 'false';
        options.annotations = (options.annotations != true && options.annotations != false) ? false : options.annotations;

        var coordinates = options.start[0] + "," + options.start[1] + ";" + options.stop[0] + "," + options.stop[1];

        // var path = "/route/v1/" + options.profile + "/" + coordinates + "?alternatives=" + options.alternatives +
        //     "&steps=" + options.steps + "&geometries=" + options.geometries + "&overview=" + options.overview;
        var path = "/route/v1/" + options.profile + "/" + coordinates //+ "?geometries=" + options.geometries;

        path = "https://router.project-osrm.org" + path;

        try {
            $.ajax({
                dataType: "json",
                url: path,
            }).done(function (data) {
                callback(data);
            });
        } catch (err) {
            console.log(err);
        }
    }

    var AddRouteToLayer = function (route) {

        if (route && route.legs && route.legs.length > 0) {
            var leg1 = route.legs[0];
            if (leg1) {
                console.log(leg1);
                // distance 17485.6
                // duration 566.9
                // steps  : (14) [{…}, {…}, {…}, {…}, {…}, {…}, {…}, {…}, {…}, {…}, {…}, {…}, {…}, {…}]
                // summary Ankara-Ayaş yolu, İstanbul Yolu"

                var featuresRouteParts = [];
                var i, geom, feature;

                for (var i = 0; i < leg1.steps.length; i++) {
                    const element = leg1.steps[i];

                    // element.geometry.crs = {
                    //     'type': 'name',
                    //     'properties': {
                    //         'name': 'EPSG:3857'
                    //     }
                    // };

                    var coordinates = element.geometry.coordinates;

                    var feature = new ol.Feature({
                        geometry: new ol.geom.LineString(coordinates),
                        name: 'Line'
                    })

                    // geom = new ol.geom.Circle(
                    //     ol.proj.transform([duraklar[i].py, duraklar[i].px], 'EPSG:4326', 'EPSG:3857'),
                    //     25
                    // );
                    // feature = new ol.Feature(geom);

                    featuresRouteParts.push(feature);

                }

                vectorSource4Routes.addFeatures(featuresRouteParts);

            }
        }

    }

    var utils = {
        getNearest: function (coord) {
            var coord4326 = utils.to4326(coord);
            return new Promise(function (resolve, reject) {
                //make sure the coord is on street
                fetch(url_osrm_nearest + coord4326.join()).then(function (response) {
                    // Convert to JSON
                    return response.json();
                }).then(function (json) {
                    if (json.code === 'Ok') resolve(json.waypoints[0].location);
                    else reject();
                });
            });
        },
        // createFeature: function (coord) {
        //     var feature = new ol.Feature({
        //         type: 'place',
        //         geometry: new ol.geom.Point(ol.proj.fromLonLat(coord))
        //     });
        //     feature.setStyle(styles.icon);
        //     vectorSource.addFeature(feature);
        // },
        createRoute: function (route, vectorSource, type) {
            // route is ol.geom.LineString
            var route = new ol.format.Polyline({
                factor: 1e5
            }).readGeometry(route.geometry, {
                dataProjection: 'EPSG:4326',
                featureProjection: 'EPSG:3857'
            });
            var feature = new ol.Feature({
                type: type || 'route',
                geometry: route
            });
            feature.setStyle(styles[type] || styles.route);
            vectorSource.addFeature(feature);
        },
        createRouteInfo: function (route, selector) {
            var distance = $("<p>").text("Distance : " + route.distance);
            var duration = $("<p>").text("Duration : " + route.duration);
            var weight = $("<p>").text("Weight : " + route.weight);

            $(selector).empty();
            $(selector).append(distance).append(duration).append(weight);
        },
        to4326: function (coord) {
            return ol.proj.transform([
                parseFloat(coord[0]), parseFloat(coord[1])
            ], 'EPSG:3857', 'EPSG:4326');
        }
    };

})