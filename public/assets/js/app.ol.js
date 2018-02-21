$(function () {
    var DEBUG_MODE = true;

    var mapHeight = $("body").height() - 70;
    $("#map").height(mapHeight);

    // var raster = new ol.layer.Tile({
    //     source: new ol.source.Stamen({
    //         layer: 'toner'
    //     })
    // });

    var osmLayer = new ol.layer.Tile({
        source: new ol.source.OSM(),
    });

    var circle = new ol.geom.Circle(
        ol.proj.transform([32.9257, 39.9434], 'EPSG:4326', 'EPSG:3857'),
        1000
    );

    var selected = ol.proj.fromLonLat([32.7615216, 39.908144]);
    var defaultZoom = 10;
    var defaultLonLatCenter = [32.7615216, 39.908144];

    if (typeof savedData_lat != "undefined" && typeof savedData_lon != "undefined" && savedData_lat && savedData_lon) {
        defaultZoom = 13;
        defaultLonLatCenter = [savedData_lon, savedData_lat];
        selected = ol.proj.fromLonLat(defaultLonLatCenter);
    }

    var startMarker = new ol.Feature({
        type: 'icon',
        geometry: new ol.geom.Point(selected)
    });

    var pointFeatures = [new ol.Feature(circle)];
    var vectorSource = new ol.source.Vector({
        //projection: 'EPSG:4326'
        features: [startMarker]
    });

    var vectorLayer = new ol.layer.Vector({
        source: vectorSource,
        style: function (feature) {
            return styles[feature.get('type')];
        }
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
            // vectorHeatmapLayer
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

    var zoomslider = new ol.control.ZoomSlider();
    // map.addControl(zoomslider);

    map.on("click", function (event) {
        var coords = ol.proj.transform(event.coordinate, 'EPSG:3857', 'EPSG:4326');
        var v = event.map.getView();
        if (DEBUG_MODE) {
            console.log("zoom " + v.getZoom());
            console.log(coords);
        }

        changeMarker(event.coordinate)
    });

    map.on("dblclick", function (event) {
        var coords = ol.proj.transform(event.coordinate, 'EPSG:3857', 'EPSG:4326');
        if (DEBUG_MODE)
            console.log("dblclick : " + coords);
    });

    map.on("moveend", function (event) {
        // console.log(event);
    });

    var changeMarker = function (coordinate) {
        //TODO - drow circle ?
        // var circle = new ol.geom.Circle(coordinate, 100);
        // var pointFeatures = [new ol.Feature(circle)];
        // vectorSource.addFeatures(pointFeatures);

        startMarker.getGeometry().setCoordinates(coordinate);

        enableDisableSaveButton(true);
    }

    var enableDisableSaveButton = function (isEnabled) {
        $("#save-location").prop('disabled', !isEnabled);
    }

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
            weight: weight // e.g. temperature
        });

        vectorSource.addFeatures([pointFeature]);
    }

    //window.map = map;

    // popup
    //var popup = new ol.Overlay.Popup();
    //map.addOverlay(popup);
    //https://jsfiddle.net/jonataswalker/c4qv9afb/
    //Instantiate with some options and add the Control
    var geocoder = new Geocoder('nominatim', {
        provider: 'osm',
        lang: 'tr',
        placeholder: 'Search for ...',
        limit: 5,
        debug: false,
        autoComplete: true,
        keepOpen: true,
        url: "https://nominatim.openstreetmap.org/search/",
        targetType: "map-search-input"
    });
    // map.addControl(geocoder);

    //Listen when an address is chosen
    geocoder.on('addresschosen', function (evt) {
        console.info(evt);
        window.setTimeout(function () {
            popup.show(evt.coordinate, evt.address.formatted);
        }, 3000);
    });

    $("#history").on("click", function () {
        // alert("history clicked");
    })

    $("#save-location").on("click", function () {

        var coords = startMarker.getGeometry().getCoordinates()

        LonLat = ol.proj.toLonLat(coords)
        var data = {
            lon: LonLat[0],
            lat: LonLat[1]
        }

        $.ajax({
            url: '/api/location',
            type: 'post',
            contentType: 'application/json',
            data: JSON.stringify(data),
            success: function (data, textStatus, jQxhr) {
                enableDisableSaveButton(false);

                var resText = "kaydedildi";
                if (typeof savedData_saved != "undefined" && savedData_saved == true)
                    resText = "güncellendi";
                else {
                    $("#save-location").text("Güncelle");
                    $("#message-span").text("Servise bindiğiniz noktayı değiştirmek için harita üzerinde yeni bir yere tıkladıktan sonra güncelle butonuna basınız.");
                }
                swal("İşlem Tamamlandı", "Servise biniş noktanız " + resText + "!", "success");
            },
            error: function (jqXhr, textStatus, errorThrown) {
                if (DEBUG_MODE)
                    console.log(errorThrown);
                swal("İşlem Tamamlanamadı", "Lütfen sayfayı yeniden yükleyip tekrar deneyiniz!", "error");
            }
        });
    })

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

});