$(function () {
    var mapHeight = $("body").height() - 70;
    $("#map").height(mapHeight);

    var styles = {
        'icon': new ol.style.Style({
            image: new ol.style.Icon({
                anchor: [0.5, 1],
                // size: [45, 45],
                scale: 0.1,
                src: '/images/pin-map-location-06-512.png'
            })
        }),
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

    var osmLayer = new ol.layer.Tile({
        source: new ol.source.OSM(),
    });

    var defaultZoom = 10;
    var defaultLonLatCenter = [32.7615216, 39.908144];

    var vectorSource4Stations = new ol.source.Vector({
        projection: 'EPSG:4326'
    });

    var vectorLayer4Stations = new ol.layer.Vector({
        source: vectorSource4Stations,
        style: circleStyle
    });

    var vectorSource4Routes = new ol.source.Vector({
        projection: 'EPSG:4326'
    });
    var routeVectorLayer = new ol.layer.Vector({
        source: vectorSource4Routes,
        // style: routeStyles
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
        console.log(coords);
    });


    var addData = function (coordinates, weight) {
        coordinates[0] = Number(coordinates[0]);
        coordinates[1] = Number(coordinates[1]);
        var coord = ol.proj.transform(coordinates, 'EPSG:4326', 'EPSG:3857');
        // var coord = ol.proj.transform(coordinates, 'EPSG:4326', 'EPSG:4326');
        var lonLat = new ol.geom.Point(coord);

        if (typeof weight != "number") {
            if (typeof weight == "string")
                weight = 0.5;
            else if (typeof weight == "boolean" && weight == true)
                weight = 0.5;
        } else if (weight > 1) {
            weight = weight / 100;
        } else {

        }

        var pointFeature = new ol.Feature({
            geometry: lonLat,
            weight: weight
        });

        vectorSource.addFeatures([pointFeature]);
    }


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
        addDurak(data);
    });

    $.ajax({
        dataType: "json",
        url: "/api/route/all",
    }).done(function (data) {
        // console.log(data)
        addRoute(data);
    });


    var addDurak = function (duraklar) {
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

    var addRoute = function (routes) {
        var featuresRoutes = [];
        var i, geom, features;

        for (i = 0; i < routes.length; i++) {
            // geom = new ol.geom.Circle(
            //     ol.proj.transform([duraklar[i].py, duraklar[i].px], 'EPSG:4326', 'EPSG:3857'),
            //     30
            // );

            var geojsonObj = JSON.parse(routes[i].geojson);

            var geojson = new ol.format.GeoJSON({});
            features = geojson.readFeatures(geojsonObj, {
                dataProjection: 'EPSG:4326',
                featureProjection: 'EPSG:3857',
            });

            for (var j = 0; j < features.length; j++) {
                features[j].set("data", routes[i]);

                features[j].setStyle(styles.route);

                featuresRoutes.push(features[j]);
            }

            // feature.set("data", routes[i]);
            // featuresRoutes.push(feature);
        }

        vectorSource4Routes.addFeatures(featuresRoutes);
    }

})