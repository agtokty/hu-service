$(function () {

    var circleStyle = new ol.style.Style({
        stroke: new ol.style.Stroke({
            color: 'rgba(0, 0, 0, 0.4)',
            width: 4
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

    map.getLayers().push(stationVectorLayer);


    var DATA = null;

    //durakları çek
    $.ajax({
        dataType: "json",
        url: "/api/station/master",
    }).done(function (data) {
        DATA = data;
        // addStationCircle(data);
        utils.addCircleData(data, stationVectorSource, { radius: 85, radius_property: "weight" });
    });


    $("#use-master").on("change", function () {
        var usemaster = document.getElementById("use-master").checked
        $("#station-count").prop("disabled", usemaster);
    })

    $("#start-process").on("click", function () {

        var weight = $("#total-weight").val();
        var count = $("#station-count").val();

        if (!weight || !count || !Number(weight) || !Number(count)) {
            console.log("hatalı veri!")
            return;
        }

        var data = {
            weight: weight,
            count: count,
            use_masters: document.getElementById("use-master").checked
        };

        $("#start-process").text("lütfen bekleyiniz");
        $("#control-buttons button").prop("disabled",true);

        $.ajax({
            url: '/api/tools/generate_weight',
            type: 'post',
            contentType: 'application/json',
            data: JSON.stringify(data),
            success: function (data, textStatus, jQxhr) {

                console.log(data);

                var info = {
                    title: "İşlem Tamamlandı",
                    text: "Rasgele duraklar seçildi ve ağırlık noktaları atandı",
                    type: "success"
                };
                swal(info, function () {
                    location.reload();
                });
            },
            error: function (jqXhr, textStatus, errorThrown) {
                console.log(errorThrown);
                swal("İşlem Tamamlanamadı", "Lütfen sayfayı yeniden yükleyip tekrar deneyiniz!", "error");
            }
        });

    })

    $("#clear-data-process").on("click", function () {

        var radius = prompt("Birleştime işlemi için yakınlık yarıçapı değeri giriniz ", "500");
        var radius = parseInt(radius);

        if (radius === NaN)
            radius = 500;

        var data = {
            radius: radius,
        };

        $("#clear-data-process").text("lütfen bekleyiniz");
        $("#control-buttons button").prop("disabled",true);

        $.ajax({
            url: '/api/tools/clear',
            type: 'post',
            contentType: 'application/json',
            data: JSON.stringify(data),
            success: function (data, textStatus, jQxhr) {

                console.log(data);
                var info = {
                    title: "İşlem Tamamlandı",
                    text: "Yakın duraklar birleştirildi. " + (data.message || ""),
                    type: "success"
                };
                swal(info, function () {
                    location.reload();
                });
            },
            error: function (jqXhr, textStatus, errorThrown) {
                console.log(errorThrown);
                swal("İşlem Tamamlanamadı", "Lütfen sayfayı yeniden yükleyip tekrar deneyiniz!", "error");
            }
        });
    })

    function PickRandomNStation(count) {

    }

})