// $(function () {

var API_KEY = $("#apiKey").val();
var SOS_URL = "http://netigma.netcad.com.tr/SOS2/Swe.svc/"

var osmLayer = new ol.layer.Tile({
    source: new ol.source.OSM(),
});


// var circle = new ol.geom.Circle(
//     ol.proj.transform([32.9257, 39.9434], 'EPSG:4326', 'EPSG:3857'),
//     10000
// );
// var pointFeatures = [new ol.Feature(circle)];
var vectorSource = new ol.source.Vector({
    //projection: 'EPSG:4326'
});
// vectorSource.addFeatures(pointFeatures);
var vectorLayer = new ol.layer.Vector({
    source: vectorSource
});

var map = new ol.Map({
    target: 'map',
    layers: [
        osmLayer,
        vectorLayer
    ],
    view: new ol.View({
        center: ol.proj.fromLonLat([32.9257, 39.9434]),
        zoom: 7,
        minZoom: 2,
        maxZoom: 17
            // projection : 'EPSG:4326'
    }),
    controls: [],
});

map.on("click", function(event) {
    // console.log(event.coordinate);
    // var coords = ol.proj.transform(event.coordinate, 'EPSG:3857', 'EPSG:4326');
    // console.log(coords);

    var circle = new ol.geom.Circle(event.coordinate, 1000);
    var pointFeatures = [new ol.Feature(circle)];
    //vectorSource.addFeatures(pointFeatures);
});

var emulator = {
    prefix: $("#procedurePrefix").val() || "TEST_PROCEDURE",
    startDate: new Date(),
    dayCount: 4,
    procedureCount: 100,
    procedureGroups: []
};
var typeSelect = "Polygon";
var draw;

function startDrawing() {
    document.getElementById("startMap").disabled = true;
    addInteraction();
}

function finishDrawing() {
    map.removeInteraction(draw);
    document.getElementById("insertProcedure").disabled = false;
    document.getElementById("startMap").disabled = true;
}

function getRandomFloat(min, max) {
    return Math.random() * (max - min) + min;
}

function generateRandomCoord(extent) {
    var lat = getRandomFloat(extent[1], extent[3])
    var lon = getRandomFloat(extent[0], extent[2])

    return [lon, lat];
}

function getNdayLater(dayNum) {
    var startDate = $("#startDate").val();
    var inputDate = new Date(startDate);

    inputDate.setDate(inputDate.getDate() + dayNum);

    return inputDate;
}

var dayNum = 0;

function addInteraction() {
    draw = new ol.interaction.Draw({
        source: vectorSource,
        type: /** @type {ol.geom.GeometryType} */ (typeSelect)
    });
    draw.on('drawend', function(e) {
        var currentFeature = e.feature;
        var restOfFeats = vectorSource.getFeatures();
        var allFeats = restOfFeats.concat(currentFeature);
        //console.log(allFeats.length)
        map.removeInteraction(draw);

        var extend = currentFeature.getGeometry().getExtent()
        var locationGroup = {
            locations: [],
            day: getNdayLater(dayNum++)
        }

        var procedureCountPerDraw = Number((emulator.procedureCount / emulator.dayCount).toFixed());
        var tryCount = 0;
        for (var i = 0; i < procedureCountPerDraw;) {
            var coords = generateRandomCoord(extend);
            var isIn = currentFeature.getGeometry().intersectsCoordinate(coords)
            if (isIn) {
                i++;
                //console.log(coords)
                var circle = new ol.geom.Circle(coords, 1000);

                var style = new ol.style.Style({
                    stroke: new ol.style.Stroke({
                        color: '#b30734',
                        width: 3
                    }),
                    fill: new ol.style.Fill({
                        color: [51, 51, 51, .7]
                    })
                })
                var circleFeature = new ol.Feature(circle);
                circleFeature.setStyle(style);

                var pointFeatures = [circleFeature];
                vectorSource.addFeatures(pointFeatures);

                locationGroup.locations.push(coords);
            } else {
                tryCount++;
                if (tryCount > 2500)
                    break;
            }
        }

        emulator.procedureGroups.push(locationGroup);

        if (emulator.procedureGroups.length >= emulator.dayCount) {
            finishDrawing()
        } else {
            map.addInteraction(draw);
        }
        // var polygonGeometry = e.feature.getGeometry();
        // var coords = iconFeature.getGeometry().getCoordinates();
    });

    map.addInteraction(draw);
}

map.on("dblclick", function(e) {
    if (draw) {
        return false;
    }
    return false;
});

$("#startMap").on("click", function() {
    var startDate = $("#startDate").val();
    var dayCount = $("#dayCount").val();
    var procedureCount = $("#procedureCount").val();
    var prefix = $("#procedurePrefix").val();
    if (!startDate)
        return alert("Select start date")

    emulator.procedureGroups = [];
    emulator.dayCount = dayCount;
    emulator.procedureCount = procedureCount;
    emulator.startDate = startDate;
    emulator.prefix = prefix || emulator.prefix;

    startDrawing();
});

$("#resetMap").on("click", function() {
    vectorSource.clear();
    document.getElementById("resetMap").disabled = true;
    document.getElementById("startMap").disabled = false;
});

// $("#observedProperty").change(function() {
//     var property = $("#observedProperty").val();
//     loadPropertData(property);
// });

$("#insertProcedure").on("click", function() {
    startInserting();
});

function startInserting() {

    var count = 1;
    for (var i = 0; i < emulator.procedureGroups.length; i++) {
        var group = emulator.procedureGroups[i];

        for (var j = 0; j < group.locations.length; j++) {
            var location = group.locations[j];

            var identifier = (emulator.prefix + "_" + count++)
            console.log("I : " + identifier + " D : " + group.day + " Location : " + location);
            var timeout = 100 * count;
            insertProcedure(identifier, location, group.day, timeout);

        }
    }

    document.getElementById("insertProcedure").disabled = true;
}

var SOS_ERROR_PROCEDURE_ALREADY_INSERTED = "There is already a sensor with this identifier!";

function insertProcedure(identifier, coord, day, timeout) {
    var requestXml = '<swes:InsertSensor xmlns:gml="http://www.opengis.net/gml/3.2" xmlns:sos="http://www.opengis.net/sos/2.0" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:swe= "http://www.opengis.net/swe/2.0" xmlns:gmd="http://www.isotc211.org/2005/gmd" xmlns:gco="http://www.isotc211.org/2005/gco" xmlns:xlink="http://www.w3.org/1999/xlink" xmlns:sml="http://www.opengis.net/sensorml/2.0" version="2.0.0" service="SOS" xmlns:swes="http://www.opengis.net/swes/2.0"> <swes:procedureDescriptionFormat>http://www.opengis.net/sensorml/2.0</swes:procedureDescriptionFormat> <swes:procedureDescription> <sml:PhysicalSystem xmlns:swe="http://www.opengis.net/swe/2.0" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:xlink="http://www.w3.org/1999/xlink" xmlns:gml="http://www.opengis.net/gml/3.2" gml:id="[IDENTIFIER_ID]" xmlns:sml="http://www.opengis.net/sensorml/2.0"> <gml:description>[IDENTIFIER_DESC] </gml:description> <gml:identifier codeSpace="uniqueID">[IDENTIFIER]</gml:identifier> <gml:name>[NAME]</gml:name> <sml:outputs> <sml:OutputList> <sml:output name="HASTALIK"> <swe:Quantity definition=""/> </sml:output> </sml:OutputList> </sml:outputs> <sml:position> <swe:Vector referenceFrame="urn:ogc:def:crs:EPSG::4326"> <swe:coordinate name="easting"> <swe:Quantity axisID="x"> <swe:uom code="degree"/> <swe:value>[LON]</swe:value> </swe:Quantity> </swe:coordinate> <swe:coordinate name="northing"> <swe:Quantity axisID="y"> <swe:uom code="degree"/> <swe:value>[LAT]</swe:value> </swe:Quantity> </swe:coordinate> <swe:coordinate name="altitude"> <swe:Quantity axisID="z"> <swe:uom code="m"/> <swe:value>[ALT]</swe:value> </swe:Quantity> </swe:coordinate> </swe:Vector> </sml:position> </sml:PhysicalSystem> </swes:procedureDescription> <swes:observableProperty>HASTALIK</swes:observableProperty> <swes:metadata> <sos:SosInsertionMetadata> <sos:observationType>http://www.opengis.net/def/observationType/OGC-OM/2.0/OM_CategoryObservation</sos:observationType> <sos:featureOfInterestType>http://www.opengis.net/def/samplingFeatureType/OGC-OM/2.0/SF_SamplingPoint</sos:featureOfInterestType> </sos:SosInsertionMetadata> </swes:metadata> </swes:InsertSensor> ';
    requestXml = requestXml.replace("[IDENTIFIER]", identifier);
    requestXml = requestXml.replace("[IDENTIFIER_ID]", identifier);
    requestXml = requestXml.replace("[IDENTIFIER_DESC]", identifier);
    requestXml = requestXml.replace("[NAME]", identifier);

    coord = ol.proj.transform(coord, 'EPSG:3857', 'EPSG:4326');

    requestXml = requestXml.replace("[LON]", coord[0]);
    requestXml = requestXml.replace("[LAT]", coord[1]);
    requestXml = requestXml.replace("[ALT]", 0);

    setTimeout(function() {
        $.ajax({
            url: SOS_URL,
            processData: false,
            type: "POST",
            data: requestXml,
            contentType: "text/xml",
            headers: {
                'Authorization': API_KEY
            },
            beforeSend: function() {

            },
            success: function(data, textStatus, jqXHR) {
                console.log("Inserted : " + identifier)
                insertObservation(identifier, day, coord)
            },
            error: function(jqXHR, textStatus, errorThrown) {
                if (jqXHR.responseText && jqXHR.responseText.indexOf(SOS_ERROR_PROCEDURE_ALREADY_INSERTED)) {
                    console.log(SOS_ERROR_PROCEDURE_ALREADY_INSERTED + " : " + identifier)
                    insertObservation(identifier, day, coord)
                } else {
                    console.log("Can not insert procedure!")
                    console.log(jqXHR)
                }
            },
            complete: function() {

            }
        });
    }, timeout)

}

function insertObservation(sensorIdentifier, date, coord) {

    var requestXml = '<?xml version="1.0" encoding="UTF-8"?> <sos:InsertObservation xmlns:sos="http://www.opengis.net/sos/2.0" xmlns:swes="http://www.opengis.net/swes/2.0" xmlns:swe="http://www.opengis.net/swe/2.0" xmlns:sml="http://www.opengis.net/sensorML/1.0.1" xmlns:gml="http://www.opengis.net/gml/3.2" xmlns:xlink="http://www.w3.org/1999/xlink" xmlns:om="http://www.opengis.net/om/2.0" xmlns:sams="http://www.opengis.net/samplingSpatial/2.0" xmlns:sf="http://www.opengis.net/sampling/2.0" xmlns:xs="http://www.w3.org/2001/XMLSchema" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" service="SOS" version="2.0.0" xsi:schemaLocation="http://www.opengis.net/sos/2.0 http://schemas.opengis.net/sos/2.0/sos.xsd            http://www.opengis.net/samplingSpatial/2.0 http://schemas.opengis.net/samplingSpatial/2.0/spatialSamplingFeature.xsd"> <sos:offering>offering_[offering]_observations</sos:offering> <sos:observation> <om:OM_Observation gml:id="[id]"> <om:type xlink:href="http://www.opengis.net/def/observationType/OGC-OM/2.0/OM_CategoryObservation"/> <om:phenomenonTime> <gml:TimeInstant gml:id="phenomenonTime"> <gml:timePosition>[time]</gml:timePosition> </gml:TimeInstant> </om:phenomenonTime> <om:resultTime xlink:href="#phenomenonTime"/> <om:procedure xlink:href="[procedure]"/> <om:observedProperty xlink:href="HASTALIK"/> <om:featureOfInterest> <sams:SF_SpatialSamplingFeature gml:id="[cityNameId]"> <gml:identifier codeSpace="">[cityNameCode]</gml:identifier> <gml:name>[cityName]</gml:name> <sf:type xlink:href="http://www.opengis.net/def/samplingFeatureType/OGC-OM/2.0/SF_SamplingPoint"/> <sf:sampledFeature xlink:href="Turkiye"/> <sams:shape> <gml:Point gml:id="test_feature_9"> <gml:pos srsName="http://www.opengis.net/def/crs/EPSG/0/4326">[lat] [lon]</gml:pos> </gml:Point> </sams:shape> </sams:SF_SpatialSamplingFeature> </om:featureOfInterest> <om:result xsi:type="gml:ReferenceType" xlink:href="[hastalik]"/> </om:OM_Observation> </sos:observation> </sos:InsertObservation>';

    var featureName = "Turkiye";

    var d = new Date();
    requestXml = requestXml.replace("[id]", sensorIdentifier + d.getTime() + Math.floor((Math.random() * 10) + 1));
    //2012-11-19T13:45:15.000+00:00
    //2017-09-23T01:23:49+03:00
    date.setHours(d.getHours())
    date.setMinutes(d.getMinutes())
    var dateStr = moment(date).format();
    requestXml = requestXml.replace("[time]", dateStr);
    requestXml = requestXml.replace("[procedure]", sensorIdentifier);
    requestXml = requestXml.replace("[offering]", sensorIdentifier);
    requestXml = requestXml.replace("[cityNameId]", featureName);
    requestXml = requestXml.replace("[cityNameCode]", featureName);
    requestXml = requestXml.replace("[cityName]", featureName);
    requestXml = requestXml.replace("[lat]", coord[1]);
    requestXml = requestXml.replace("[lon]", coord[0]);

    var hastalikAdi = $("#observedProperty").val()
    requestXml = requestXml.replace("[hastalik]", hastalikAdi);


    $.ajax({
        url: SOS_URL,
        processData: false,
        type: "POST",
        data: requestXml,
        contentType: "text/xml",
        headers: {
            'Authorization': API_KEY
        },
        beforeSend: function() {

        },
        success: function(data, textStatus, jqXHR) {
            console.log("Observation added : " + sensorIdentifier)
        },
        error: function(jqXHR, textStatus, errorThrown) {
            console.log("Can not send observation   :" + sensorIdentifier)
        },
        complete: function() {

        }
    });

}

window.map = map;
// });