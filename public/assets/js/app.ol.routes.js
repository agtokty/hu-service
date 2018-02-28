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
        utils.addCircleData(data, stationVectorSource, { radius: 85, radius_property : "weight" });
    });

    $.ajax({
        dataType: "json",
        url: "/api/route/all",
    }).done(function (data) {
        // console.log(data)
        addRoute(data);
    });

    // var addDurak = function (circleDataArray, vertorSource) {
    //     var featureArray = [];
    //     var geom, feature;

    //     for (var i = 0; i < circleDataArray.length; i++) {
    //         geom = new ol.geom.Circle(
    //             ol.proj.transform([circleDataArray[i].py, circleDataArray[i].px], 'EPSG:4326', 'EPSG:3857'),
    //             30
    //         );
    //         feature = new ol.Feature(geom);
    //         feature.set("data", circleDataArray[i]);
    //         featureArray.push(feature);
    //     }

    //     vertorSource.addFeatures(featureArray);
    // }

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