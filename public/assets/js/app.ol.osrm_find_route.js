$(function () {

    var circleStyle = new ol.style.Style({
        stroke: new ol.style.Stroke({
            color: 'rgba(0, 0, 0, 0.4)',
            width: 3
        }),
        fill: new ol.style.Fill({
            color: 'rgba(0, 255, 0, 0.4)'
        })
    });

    var osmLayer = new ol.layer.Tile({
        source: new ol.source.OSM(),
    });

    var stationVectorSource = new ol.source.Vector({
        projection: 'EPSG:4326'
    });

    var stationVectorLayer = new ol.layer.Vector({
        source: stationVectorSource,
        style: circleStyle
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
    var routeVectorSource = new ol.source.Vector({
        projection: 'EPSG:4326'
    });
    var routeVectorLayer = new ol.layer.Vector({
        source: routeVectorSource,
        style: styleFunction
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

    // var addStationCircle = function (duraklar) {

    //     var featuresDuraklar = [];
    //     var i, geom, feature;

    //     for (i = 0; i < duraklar.length; i++) {

    //         geom = new ol.geom.Circle(
    //             ol.proj.transform([duraklar[i].py, duraklar[i].px], 'EPSG:4326', 'EPSG:3857'),
    //             25
    //         );

    //         feature = new ol.Feature(geom);
    //         featuresDuraklar.push(feature);
    //     }

    //     stationVectorSource.addFeatures(featuresDuraklar);
    // }

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
            utils.FindRoute({
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
                    utils.createRoute(route1, routeVectorSource, this.profile, styles[this.profile]);
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

        $("#" + selectFor + "Input").val("");
    })

    $("#clear-routes").on("click", function () {
        routeVectorSource.clear();

        $("#route-result").empty();
    });

    utils.createRouteInfo = function (route, selector) {
        var distance = $("<p>").text("Distance : " + route.distance);
        var duration = $("<p>").text("Duration : " + route.duration);
        var weight = $("<p>").text("Weight : " + route.weight);

        $(selector).empty();
        $(selector).append(distance).append(duration).append(weight);
    }


})