$(function () {
    var mapHeight = $("body").height() - 70;
    $("#map").height(mapHeight);


    var osmLayer = new ol.layer.Tile({
        source: new ol.source.OSM(),
    });

    var circle = new ol.geom.Circle(
        ol.proj.transform([32.9257, 39.9434], 'EPSG:4326', 'EPSG:3857'),
        1000
    );

    var defaultZoom = 10;
    var defaultLonLatCenter = [32.7615216, 39.908144];

    var vectorSource = new ol.source.Vector({
        projection: 'EPSG:4326'
    });

    var vectorLayer = new ol.layer.Vector({
        source: vectorSource,
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
            // osmLayer,
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

    var addDurak = function (duraklar) {

        var featuresDuraklar = [];
        var i, geom, feature;

        for (i = 0; i < duraklar.length; i++) {

            geom = new ol.geom.Circle(
                ol.proj.transform([duraklar[i].py, duraklar[i].px], 'EPSG:4326', 'EPSG:3857'),
                25
            );

            feature = new ol.Feature(geom);
            featuresDuraklar.push(feature);

            // var coordinates = [duraklar[i].py, duraklar[i].px];
            // var coord = ol.proj.transform(coordinates, 'EPSG:4326', 'EPSG:3857');
            // var lonLat = new ol.geom.Point(coord);
            // var pointFeature = new ol.Feature({
            //     geometry: lonLat,
            //     weight: 1
            // });
            // vectorSource.addFeatures([pointFeature]);

            // var nokta = [duraklar[i].px, duraklar[i].py];
            // var circle = new ol.geom.Circle(
            //     ol.proj.transform(nokta, 'EPSG:4326', 'EPSG:3857'),
            //     10000
            // );
            // featuresDuraklar.push(new ol.Feature(circle));
        }

        vectorSource.addFeatures(featuresDuraklar);
    }

})