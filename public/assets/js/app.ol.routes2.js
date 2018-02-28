$(function () {

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

    var defaultZoom = 10;
    var defaultLonLatCenter = [32.7615216, 39.908144];

    var stationVectorSource = new ol.source.Vector({
        projection: 'EPSG:4326'
    });

    var stationVectorLayer = new ol.layer.Vector({
        source: stationVectorSource,
        style: circleStyle
    });

    var routeVectorSource = new ol.source.Vector({
        projection: 'EPSG:4326'
    });
    var routeVectorLayer = new ol.layer.Vector({
        source: routeVectorSource,
        // style: routeStyles
    });

    map.getLayers().push(stationVectorLayer);
    map.getLayers().push(routeVectorLayer);

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

        stationVectorSource.addFeatures(featuresDuraklar);
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

        routeVectorSource.addFeatures(featuresRoutes);
    }

})