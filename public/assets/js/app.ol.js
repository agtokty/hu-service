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


    var firstMoveDone = false;

    map.on("moveend", function (event) {
        console.log(event);

        if (firstMoveDone) {
            var v = map.getView()
            var zoom = v.getZoom()
            var extent = v.calculateExtent()

            var query = "?ex=" + extent.join() + "&z=" + zoom;

            console.log(query);

            // if (history.pushState) {
            //     var newurl = window.location.protocol + "//" + window.location.host + window.location.pathname + query;
            //     window.history.pushState({ path: newurl }, '', newurl);
            // }

            if (history.replaceState) {
                var newurl = window.location.protocol + "//" + window.location.host + window.location.pathname + query;
                window.history.replaceState({ path: newurl }, '', newurl);
                history.replaceState({}, '', window.location.pathname + query);
            }
        } else {
            firstMoveDone = true;
        }


    });

    function setExtent(extent, zoom) {
        map.getView().fit(extent, map.getSize())
        map.getView().setZoom(zoom)
    }

    var url_string = window.location.href
    var url = new URL(url_string);
    var ex = url.searchParams.get("ex");
    var zoom = url.searchParams.get("z");

    if (ex && zoom) {
        var ex = ex.split(",");
        zoom = Number(zoom);

        if (ex.length == 4 && zoom) {
            setExtent(ex, zoom);
        }
    }

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

    //TODO - change name
    window.utils = {
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
        addCircleData: function (circleDataArray, vectorSource, options) {
            var featureArray = [];
            var geom, feature;

            var _minRadius = 30;
            var defaultRadius = 30;

            if (options) {
                if (options.radius && options.radius >= 1)
                    defaultRadius = options.radius
            }

            for (var i = 0; i < circleDataArray.length; i++) {

                if (options) {
                    if (options.radius_property &&
                        circleDataArray[i][options.radius_property])
                        defaultRadius = Number(circleDataArray[i][options.radius_property]) * 15

                    if (defaultRadius < _minRadius)
                        defaultRadius = _minRadius
                }

                geom = new ol.geom.Circle(
                    ol.proj.transform([circleDataArray[i].py, circleDataArray[i].px], 'EPSG:4326', 'EPSG:3857'),
                    defaultRadius
                );
                feature = new ol.Feature(geom);
                feature.set("data", circleDataArray[i]);

                if (options && options.style)
                    feature.setStyle(style);

                if (options && options.getStyle && typeof options.getStyle == "function") {
                    if (options.getStyle(circleDataArray[i]) != null) {
                        feature.setStyle(options.getStyle(circleDataArray[i]));
                    }
                }

                featureArray.push(feature);
            }

            vectorSource.addFeatures(featureArray);
        },
        createPointFeature: function (coord, vectorSource) {
            var feature = new ol.Feature({
                type: 'place',
                geometry: new ol.geom.Point(ol.proj.fromLonLat(coord))
            });
            feature.setStyle(styles.icon);
            vectorSource.addFeature(feature);
        },
        convertPolyLine: function (geometry) {
            var route = new ol.format.Polyline({
                factor: 1e5
            }).readGeometry(geometry, {
                dataProjection: 'EPSG:4326',
                featureProjection: 'EPSG:3857'
            });

            return route;
        },
        createRoute: function (route, vectorSource, type, style) {
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
            feature.setStyle(style);
            vectorSource.addFeature(feature);
        },
        removeLastFeatureFromLayer: function (vectorLayer) {
            var features = vectorLayer.getFeatures();
            var f1 = features[features.length - 1];
            vectorLayer.removeFeature(f1);
        },
        to4326: function (coord) {
            return ol.proj.transform([
                parseFloat(coord[0]), parseFloat(coord[1])
            ], 'EPSG:3857', 'EPSG:4326');
        },
        FindRoute: function (options, callback) {
            options.profile = options.profile || 'route';
            options.alternatives = (options.alternatives != true && options.alternatives != false) ? false : options.alternatives;
            options.steps = (options.steps != true && options.steps != false) ? false : options.steps;
            options.geometries = options.geometries || 'geojson';
            options.overview = options.overview || 'false';
            options.annotations = (options.annotations != true && options.annotations != false) ? false : options.annotations;

            var coordinates = options.start[0] + "," + options.start[1] + ";" + options.stop[0] + "," + options.stop[1];

            // var path = "/route/v1/" + options.profile + "/" + coordinates + "?alternatives=" + options.alternatives +
            //     "&steps=" + options.steps + "&geometries=" + options.geometries + "&overview=" + options.overview;
            var path = "/route/v1/" + options.profile + "/" + coordinates + "?overview=" + options.overview;

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
    };


});