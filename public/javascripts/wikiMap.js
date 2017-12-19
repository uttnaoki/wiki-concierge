'use strict'

const icon_filepath = '/images/icon1.png';
const icon_filepath_phone = '';

var b = "あ";
var a;

function calScore_subfunc(value, base_value, result_set) {
  let i = 0;
  while (i < base_value.length) {
    if (value < base_value[i]) {
      return result_set[i];
    }
    i++;
  }
  return result_set[i];
}

function calScore(value, type) {
  let result = 0;
  const base_value = [1000, 2000, 3000, 5000, 10000];
  const result_set = {
    size: [30, 45, 60, 90, 120, 150],
    opacity: [0.5, 0.5, 0.75, 0.75, 1, 1.5]
  }
  switch (type) {
    case 'size':
      result = calScore_subfunc(value, base_value, result_set.size);
      break;
    case 'opacity':
      result = calScore_subfunc(value, base_value, result_set.opacity);
      break;
    default:
      console.log('"' + type + '" に対する calScore() 処理は定義されていません。');
  }
  return result;
}

function setIconOption(value) {
  const size = calScore(value, 'size');
  const icon_pc = icon_filepath;
  const icon_phone = icon_filepath_phone ? icon_filepath_phone : icon_pc;
  let Icon = L.icon({
    iconUrl: icon_pc,
    iconRetinaUrl: icon_phone,
    iconSize: [size, size],
    iconAnchor: [size / 2, size],
    popupAnchor: [0, -size]
  });
  return Icon;
}

function makePopupMessage(name, value) {
  const message =
    '<h2>' +
    '<a href="https://ja.wikipedia.org/wiki/' + name + '" target="_blank">' + name + '</a>' +
    // "<p>" + value + "</p>" +
    '</h2>';
  return message;
}

function highlightMarker(name, click_flag) {
  $("#marker" + name).css({
    "filter": "hue-rotate(0deg)"
  })
  $(".marker:not(#marker" + name + ")").css({
    "filter": "hue-rotate(240deg)"
  })
  marker_set[name].openPopup();
  const lat = marker_set[name]._latlng.lat;
  const lng = marker_set[name]._latlng.lng;
  // map.setCenter([lng, lat], 10)
  if (click_flag) map.panTo([lat, lng]);
}

function putMarker(map, data) {
  const Icon = setIconOption(data.value);
  var marker = L.marker(
      [data.lat, data.lng], {
        icon: Icon,
        opacity: calScore(data.value, 'opacity'),
        // title: data.name
      }
    )
    .addTo(map)
    .bindPopup(makePopupMessage(data.name, data.value))

  marker.on("mouseover", function(e) {
    if(b!=data.name){
      a = 0;
    }
    highlightMarker(data.name)
  })
  .on("click", function(e) {
    b=data.name;
    highlightMarker(data.name, 1)
    a = 1;
  })
  .on("mouseout", function(e) {
    // $(".marker").show();
    if (a == 0) {
      marker.closePopup();

      // marker.closePopup();
      $("#marker" + data.name).css({
        "filter": "hue-rotate(240deg)"
      })
    }
  })
  $(marker._icon).attr("id", "marker" + data.name)
  $(marker._icon).addClass("marker")
  $(marker._icon).css({
    "filter": "hue-rotate(240deg)"
  })

  return marker;
}

function appendInfoTag(data) {
  $('#information').append('<div id="info_' + data.name + '" class="info_content">'
     + '<div class="info_content_inner"><img src="images/' + data.name + '.jpg" alt=""></div>'
       + '<div class="info_content_inner"><p class="textbox">'
        + data.name
       + '</p></div>'
     + '</div>')
  $('#info_' + data.name).on('click', function() {
    highlightMarker(data.name, 1);
  })
}

var marker_set = {};
var map;

function drawMap(dataset) {
  //地図の設定
  map = L.map('map').setView(
    [34.80501, 133.755],
    9
  );
  //地図タイルの設定
  L.tileLayer(
    'http://{s}.tile.osm.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
    }
  ).addTo(map);
  for (var d of dataset) {
    // console.log(Math.log(d.value));
    marker_set[d.name] = putMarker(map, d);
    appendInfoTag(d);
  }
}

(function() {
  $.ajax({
    url: URL + '/places',
    type: 'get',
    dataType: 'json'
  })
  .done(function (response) {
    console.log(response);
    // response == dataset
    drawMap(response);
  })
  .fail(function (err) {
    console.log(err);
  });
}());
