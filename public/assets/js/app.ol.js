$(function () {
    var DEBUG_MODE = true;

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

    var vectorSource4Stations = new ol.source.Vector({
        projection: 'EPSG:4326'
    });

    var vectorLayer4Stations = new ol.layer.Vector({
        source: vectorSource4Stations,
        style: circleStyle
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
            vectorLayer,
            vectorLayer4Stations
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

    map.on("dblclick", function (event) {
        var coords = ol.proj.transform(event.coordinate, 'EPSG:3857', 'EPSG:4326');
        if (DEBUG_MODE)
            console.log("dblclick : " + coords);
    });

    map.on("moveend", function (event) {
        // console.log(event);
    });

    var changeMarker = function (coordinate) {
        startMarker.getGeometry().setCoordinates(coordinate);
        enableDisableSaveButton(true);
    }

    var enableDisableSaveButton = function (isEnabled) {
        $("#save-location").prop('disabled', !isEnabled);
    }

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

    var select = new ol.interaction.Select({
        condition: ol.events.condition.click
    });

    map.addInteraction(select);
    select.on('select', function (e) {
        if (e && e.selected && e.selected[0] && e.selected[0].getGeometry()) {
            var a = e.selected[0]
            var geom = e.selected[0].getGeometry()
            geom.getCenter()

            changeMarker(geom.getCenter())

            var ff = e.target.getFeatures()
            var fatures = ff.getArray();
            var data = fatures[0].get("data");

            $("#message-selected-station").html("Seçilen durak : <b>" + data["adi"] + "</b> - " + data["yeri"]);
            console.log(data);
        }
    });


});