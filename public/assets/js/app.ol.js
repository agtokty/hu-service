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

    var osmLayer = new ol.layer.Tile({
        source: new ol.source.OSM(),
    });

    var defaultZoom = 10;
    var defaultLonLatCenter = [32.7615216, 39.908144];

    var vectorSource = new ol.source.Vector({
        features: []
    });

    var vectorLayer = new ol.layer.Vector({
        source: vectorSource,
        style: function (feature) {
            return styles[feature.get('type')];
        }
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
            // stationVectorLayer
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

    //Listen when an address is chosen
    geocoder.on('addresschosen', function (evt) {
        console.info(evt);
        window.setTimeout(function () {
            popup.show(evt.coordinate, evt.address.formatted);
        }, 3000);
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

});