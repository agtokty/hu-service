$(function () {

    utils = window.utils || {};

    utils.createRouteInfo = function (route, selector) {
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
    };

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

    var stationVectorSource = new ol.source.Vector({
        projection: 'EPSG:4326',
    });

    var stationVectorLayer = new ol.layer.Vector({
        source: stationVectorSource,
        style: circleStyle
    });

    var styleFunction = function (feature) {
        return styles[feature.getGeometry().getType()];
    };
    var routeVectorSource = new ol.source.Vector({
        projection: 'EPSG:4326'
    });
    var routeVectorLayer = new ol.layer.Vector({
        source: routeVectorSource
    });


    map.getLayers().push(stationVectorLayer);
    map.getLayers().push(routeVectorLayer);

    //durakları çek
    $.ajax({
        dataType: "json",
        url: "/api/station",
    }).done(function (data) {
        // addStationCircle(data);
        utils.addCircleData(data, stationVectorSource, { radius: 85, radius_property: "weight" });
    });

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
        alternatives: false,
        steps: true,
        USE: function () {

            if (this.ROUTE_ARRAY.length <= 1)
                return console.log("Select at least 2 station");

            var START = this.ROUTE_ARRAY[this.ROUTE_ARRAY.length - 2];
            var STOP = this.ROUTE_ARRAY[this.ROUTE_ARRAY.length - 1];

            this.profile = $("#route-type").val() || this.profile;
            utils.FindRoute({
                profile: "route",
                alternatives: this.alternatives,
                steps: this.steps,
                start: START,
                stop: STOP,
                overview: "full"
            }, function (result) {

                if (!result)
                    return alert("Hata!");

                if (result.routes && result.routes.length > 0) {
                    var route1 = result.routes[0];

                    this.ROUTE_RESULTS.push(route1);

                    // this.ROUTE_RESULTS_GEOM.push(utils.convertPolyLine(route1.geometry));
                    var route_color = $("#route_color").val();

                    var styles = {
                        route: new ol.style.Style({
                            stroke: new ol.style.Stroke({
                                width: 6, color: route_color
                            })
                        })
                    };

                    utils.createRoute(route1, routeVectorSource, "route", styles.route);
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

    $("#back_route").on("click", function () {
        utils.removeLastFeatureFromLayer(routeVectorSource);

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
            var route_color = $("#route_color").val();

            var data = {
                geojson: resultString,
                color: route_color
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


    /*
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
*/



})