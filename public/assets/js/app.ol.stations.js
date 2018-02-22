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
        'icon': new ol.style.Style({
            image: new ol.style.Icon({
                anchor: [0.5, 1],
                // size: [45, 45],
                scale: 0.1,
                src: '/images/pin-map-location-06-512.png'
            })
        })
    };

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
            vectorLayer
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
        // console.log("zoom " + v.getZoom());
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

    var ROUTE_TYPE = {
        CAR: "car",
        WALK: "walk"
    }

    var SELECTED_STATIONS = {
        START: {},
        STOP: {},
        TYPE: ROUTE_TYPE.CAR
    }

    var selectFor = SELECT_FOR.START;

    var mapClickListenerKey = null;

    var mapClickListener = function (event) {
        var coords = ol.proj.transform(event.coordinate, 'EPSG:3857', 'EPSG:4326');
        // var v = event.map.getView();
        // console.log("zoom " + v.getZoom());
        console.log(coords);

        map.forEachFeatureAtPixel(map.getEventPixel(event), function (feature, layer) {
            console.log(layer);
            console.log(feature);
        });

        map.forEachFeatureAtPixel(event.pixel, function (feature, layer) {
            //you may also use the layer argument here, so avoid processing for layers you dont want such functionality
            if (typeof feature.get('features') === 'undefined') {
                // means there is no cluster feature on click
            } else {
                var clustFeats = feature.get('features');
                //now loop through the features to get the attributes
                //I have just added the "attr1" for demo purposes
                for (var i = 0; i < clustFeats.length; i++) {
                    attsCollector.push(clustFeats[i].get("attr1"));
                }
            }
        });

        ol.Observable.unByKey(mapClickListenerKey);
    }

    $(".start-stop").on("click", function (e) {
        selectFor = $(e.target).attr("selectFor") || "start";
        mapClickListenerKey = map.on("click", mapClickListener);
    })

    var FindRoute = function (options, callback) {

        options.profile = options.profile || 'route';
        options.alternatives = (options.alternatives != true && options.alternatives != false) ? false : options.alternatives;
        options.steps = (options.steps != true && options.steps != false) ? false : options.steps;
        options.geometries = options.geometries || 'geojson';
        options.overview = options.overview || 'false';
        options.annotations = (options.annotations != true && options.annotations != false) ? false : options.annotations;

        var coordinates = s_dy + "," + s_dx + ";" + d_py + "," + d_x;

        var path = "/route/v1/" + options.profile + "/" + coordinates + "?alternatives=" + options.alternatives +
            "&steps=" + options.steps + "&geometries=" + options.geometries + "&overview=" + options.overview;

        path = "http://router.project-osrm.org" + path;

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

    var clearRoutesFromLayer = function () {

    }

    var AddRouteToLayer = function (data) {

    }

    var AddRouteInfoToWindow = function (data) {

    }

})