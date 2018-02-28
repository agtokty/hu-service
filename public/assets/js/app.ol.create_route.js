$(function () {

    var defaultZoom = 10;
    var defaultLonLatCenter = [32.7615216, 39.908144];

    var styles = {
        route: new ol.style.Style({
            stroke: new ol.style.Stroke({
                width: 6, color: [40, 40, 40, 0.8]
            })
        })
    };

    var circleStyle = new ol.style.Style({
        stroke: new ol.style.Stroke({
            color: 'rgba(0, 0, 0, 0.4)',
            width: 3
        }),
        fill: new ol.style.Fill({
            color: 'rgba(0, 255, 0, 0.4)'
        })
    });

    var mapHeight = $("body").height() - 70;
    $("#map").height(mapHeight);

    var osmLayer = new ol.layer.Tile({
        source: new ol.source.OSM(),
    });

    var vectorSource4Stations = new ol.source.Vector({
        projection: 'EPSG:4326',
    });

    var vectorLayer4Stations = new ol.layer.Vector({
        source: vectorSource4Stations,
        style: circleStyle
    });

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

    window.map = new ol.Map({
        target: 'map',
        layers: [
            osmLayer,
            googleLayer,
            vectorLayer4Stations,
            routeVectorLayer
        ],
        view: new ol.View({
            center: ol.proj.fromLonLat(defaultLonLatCenter),
            zoom: defaultZoom,
            minZoom: 5,
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
                30
            );

            feature = new ol.Feature(geom);
            feature.set("data", duraklar[i]);
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
        ROUTE_ARRAY: [],
        ROUTE_RESULTS: [],
        ROUTE_RESULTS_GEOM: [],
        profile: "car",
        alternatives: false,
        steps: true,
        USE: function () {

            if (this.ROUTE_ARRAY.length <= 1)
                return console.log("Select at least 2 station");

            var START = this.ROUTE_ARRAY[this.ROUTE_ARRAY.length - 2];
            var STOP = this.ROUTE_ARRAY[this.ROUTE_ARRAY.length - 1];

            this.profile = $("#route-type").val() || this.profile;
            FindRoute({
                profile: this.profile,
                alternatives: this.alternatives,
                steps: this.steps,
                start: START,
                stop: STOP
            }, function (result) {

                if (!result)
                    return alert("Hata!");

                if (result.routes && result.routes.length > 0) {
                    var route1 = result.routes[0];

                    this.ROUTE_RESULTS.push(route1);

                    // this.ROUTE_RESULTS_GEOM.push(utils.convertPolyLine(route1.geometry));

                    utils.createRoute(route1, vectorSource4Routes, this.profile);
                    utils.createRouteInfo(this.ROUTE_RESULTS, "#route-result");
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


    // $("#start_stop").on("click", function (e) {
    //     var status = $(e.target).attr("status");
    //     if (status == "start") {
    //         selectFor = SELECT_FOR.START;
    //         mapClickListenerKey = map.on("click", mapClickListener);
    //         $(e.target).attr("status", "stop");
    //     } else {
    //         ol.Observable.unByKey(mapClickListenerKey);
    //         vectorSource4Routes.clear();
    //         $(e.target).attr("status", "start");
    //     }
    // });

    $("#back_route").on("click", function () {
        utils.removeLastFeatureFromLayer(vectorSource4Routes);

        if (SELECTED_STATIONS.ROUTE_ARRAY.length > 0) {
            SELECTED_STATIONS.ROUTE_ARRAY.pop();
            SELECTED_STATIONS.ROUTE_RESULTS.pop();

            if (SELECTED_STATIONS.ROUTE_ARRAY.length <= 1) {
                $("#back_route").prop("disabled", true)
                SELECTED_STATIONS.ROUTE_ARRAY = [];
            }
        }
    })

    $("#add_route").on("click", function () {

        $("#add_route").prop("disabled", true);

        if (SELECTED_STATIONS.ROUTE_ARRAY.length > 0)
            console.log(SELECTED_STATIONS.ROUTE_ARRAY);

        if (SELECTED_STATIONS.ROUTE_RESULTS.length > 0) {
            console.log(SELECTED_STATIONS.ROUTE_RESULTS);

            var geoArray = [];
            var geoArray2 = [];
            for (var i = 0; i < SELECTED_STATIONS.ROUTE_RESULTS.length; i++) {
                const element = SELECTED_STATIONS.ROUTE_RESULTS[i];

                var line = utils.convertPolyLine(element.geometry);
                geoArray.push(line);

                var lineFeature = new ol.Feature({
                    geometry: line,
                });

                geoArray2.push(lineFeature)
            }

            console.log(geoArray2);

            var geojson = new ol.format.GeoJSON({})
            var resultString = geojson.writeFeatures(geoArray2, {
                dataProjection: 'EPSG:4326',
                featureProjection: 'EPSG:3857',
                decimals: 5
            });
            // var resultObj = geojson.writeFeaturesObject(geoArray2, {});

            var data = {
                geojson: resultString
            }

            $.ajax({
                url: '/api/route',
                type: 'post',
                contentType: 'application/json',
                data: JSON.stringify(data),
                success: function (data, textStatus, jQxhr) {
                    // enableDisableSaveButton(false);

                    swal("İşlem Tamamlandı", "Yeni rota eklendi!", "success");
                },
                error: function (jqXhr, textStatus, errorThrown) {
                    if (DEBUG_MODE)
                        console.log(errorThrown);
                    swal("İşlem Tamamlanamadı", "Lütfen sayfayı yeniden yükleyip tekrar deneyiniz!", "error");
                    $("#add_route").prop("disabled", false);
                }
            });

        }

    })

    var select = new ol.interaction.Select({
        condition: ol.events.condition.click
    });

    map.addInteraction(select);
    select.on('select', function (e) {
        if (e && e.selected && e.selected[0] && e.selected[0].getGeometry()) {
            var a = e.selected[0]
            var geom = e.selected[0].getGeometry()
            geom.getCenter()

            var ff = e.target.getFeatures()
            var fatures = ff.getArray();
            var data = fatures[0].get("data");
            console.log(data);

            SELECTED_STATIONS.ROUTE_ARRAY.push([data.py, data.px])
            SELECTED_STATIONS.USE();

            if (SELECTED_STATIONS.ROUTE_ARRAY.length > 1) {
                $("#back_route").prop("disabled", false)
            }
        }
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
        convertPolyLine: function (geometry) {
            var route = new ol.format.Polyline({
                factor: 1e5
            }).readGeometry(geometry, {
                dataProjection: 'EPSG:4326',
                featureProjection: 'EPSG:3857'
            });

            return route;
        },
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
        removeLastFeatureFromLayer: function (vectorLayer) {
            var features = vectorLayer.getFeatures();
            var f1 = features[features.length - 1];
            vectorLayer.removeFeature(f1);
        },
        createRouteInfo: function (route, selector) {

            var distance = 0, duration = 0, weight = 0;

            if (route instanceof Array) {
                for (var i = 0; i < route.length; i++) {
                    const element = route[i];
                    distance += element.distance;
                    duration += element.duration;
                    weight += element.weight;
                }
            } else {
                distance = route.distance;
                duration = route.duration;
                weight = route.weight;
            }

            var distanceElement = $("<p>").text("Distance : " + distance);
            var durationElement = $("<p>").text("Duration : " + duration);
            var weightElement = $("<p>").text("Weight : " + weight);

            $(selector).empty();
            $(selector).append(distanceElement).append(durationElement).append(weightElement);
        },
        to4326: function (coord) {
            return ol.proj.transform([
                parseFloat(coord[0]), parseFloat(coord[1])
            ], 'EPSG:3857', 'EPSG:4326');
        }
    };

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

})