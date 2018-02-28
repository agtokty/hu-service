$(function () {

    var defaultZoom = 10;
    var defaultLonLatCenter = [32.7615216, 39.908144];

    var mapHeight = $("body").height() - 70;
    $("#map").height(mapHeight);

    var osmLayer = new ol.layer.Tile({
        source: new ol.source.OSM(),
    });

    var stationVectorSource = new ol.source.Vector({
        projection: 'EPSG:4326'
    });

    var vectorLayer = new ol.layer.Vector({
        source: stationVectorSource,
        // style: function (feature) {
        //     return styles[feature.get('type')];
        // }
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

    var map = new ol.Map({
        target: 'map',
        layers: [
            osmLayer,
            googleLayer,
            vectorLayer,
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
    // $.ajax({
    //     dataType: "json",
    //     url: "/api/station",
    // }).done(function (data) {
    //     addStationCircle(data);
    // });

    $("#start-process").on("click", function () {

        var weight = $("#total-weight").val();
        var count = $("#station-count").val();

        if (!weight || !count || !Number(weight) || !Number(count)) {
            console.log("hatalı veri!")
            return;
        }

        var data = {
            weight: weight,
            count: count
        };

        $.ajax({
            url: '/api/tools/generate_weight',
            type: 'post',
            contentType: 'application/json',
            data: JSON.stringify(data),
            success: function (data, textStatus, jQxhr) {

                console.log(data);

                $("#start-process").remove();

                swal("İşlem Tamamlandı", "Rasgele duraklar seçildi ve ağırlık noktaları atandı", "success");
            },
            error: function (jqXhr, textStatus, errorThrown) {
                console.log(errorThrown);
                swal("İşlem Tamamlanamadı", "Lütfen sayfayı yeniden yükleyip tekrar deneyiniz!", "error");
            }
        });

    })


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

        stationVectorSource.addFeatures(featuresDuraklar);
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
        to4326: function (coord) {
            return ol.proj.transform([
                parseFloat(coord[0]), parseFloat(coord[1])
            ], 'EPSG:3857', 'EPSG:4326');
        }
    };

})