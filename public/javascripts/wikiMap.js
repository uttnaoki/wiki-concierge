'use strict'

const icon_filepath = '/images/icon1.png';
const icon_filepath_phone = '';
let status_select_marker = { flag: 0, name: '' };

// Scoresを基にマーカーのsizeまたはopacityを計算
function calScore(Scores, type) {
  let result = 0;
  const result_set = {
    size: [30, 45, 60, 90, 120, 150],
    opacity: [0.5, 0.6, 0.7, 0.8, 0.9, 1]
  }

  let scores_sum = 0;
  let scores_len = 0;
  for (var key in Scores) {
    scores_sum += Scores[key];
    scores_len += 1;
  }
  const scores_mean = scores_sum / scores_len;

  return result_set[type][Math.round(scores_mean)];
}

function setIconOption(Scores) {
  const size = calScore(Scores, 'size');
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

// マーカー上部に表示されるポップアップメッセージの内容を作成
function makePopupMessage(name, overview) {
  const message =
    '<h2>' +
    '<a href="https://ja.wikipedia.org/wiki/' + name + '" target="_blank">' + name + '</a>' +
    '</h2>' +
    '<p class="PopupMessage">' + overview + '</p>';
  return message;
}

function highlightMarker(name, action) {
  $("#marker" + name).css({
    "filter": "hue-rotate(0deg)"
  })
  $(".marker:not(#marker" + name + ")").css({
    "filter": "hue-rotate(240deg)"
  })
  marker_set[name].openPopup();
  const lat = marker_set[name]._latlng.lat;
  const lng = marker_set[name]._latlng.lng;

  if (action === 'pan') map.panTo([lat, lng])
  else if (action === 'pan_zoom') map.setView([lat, lng], 16);
}

function scrollInfo(name) {
  const target_pt = $('#info_' + name).position().top;
  const InfoField_pt = $('#information').position().top;
  const current_scroll_dist = $('#information').scrollTop();
  const next_scroll_dist = current_scroll_dist + (target_pt - InfoField_pt);

  $('#information').animate({scrollTop:next_scroll_dist},500)
}

function highlightInfo(name) {
  $('.active').removeClass('active');
  $(`#info_${name}`).addClass('active');
  scrollInfo(name);
}

// マップ上にマーカーを描画
function putMarker(map, data) {
  const Scores = {
    Score_countFulltext: data.Score_countFulltext,
    Score_countLang: data.Score_countLang,
    Score_itemCount: data.Score_itemCount,
    Score_editfrequency: data.Score_editfrequency,
    Score_countperson: data.Score_countperson
  }
  const Icon = setIconOption(Scores);
  var marker = L.marker(
      [data.lat, data.lng], {
        icon: Icon,
        opacity: calScore(Scores, 'opacity'),
      }
    )
    .addTo(map)
    .bindPopup(makePopupMessage(data.name, data.overview))

  marker.on("mouseover", function(e) {
    highlightMarker(data.name)
    if (data.name != status_select_marker.name) {
      status_select_marker.flag = 0;
      status_select_marker.name = '';
    }
  })
  .on("click", function(e) {
    highlightMarker(data.name, 'pan')
    highlightInfo(data.name)
    status_select_marker.flag = 1;
    status_select_marker.name = data.name;
  })
  .on("mouseout", function(e) {
    if (!status_select_marker.flag) {
      marker.closePopup();
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

// 観光スポット一覧の中に画像とスポット名を追加
function appendInfoTag(data, class_type) {
  $('#information').append('<div id="info_' + data.name + '" class="info_content">'
      + '<div class="info_content_inner class_type' + class_type + '">'
        + '<img src="images/' + data.name + '.jpg" alt="' + data.name + '">'
      + '</div>'
      + '<div class="info_content_inner class_type' + class_type + '">'
        + '<p class="textbox">'　+ data.name + '</p>'
      + '</div>'
    + '</div>')

  $('#info_' + data.name).on('click', function() {
    highlightMarker(data.name, 'pan_zoom');
    highlightInfo(data.name)
    status_select_marker.flag = 1;
    status_select_marker.name = data.name;
  })
}

var marker_set = {};
var map;

// マップとスポット一覧を描画
function drawMap(dataset) {
  // マップの設定
  map = L.map('map', {
    minZoom: 9
  }).setView(
    [34.80501, 133.755],
    9
  ).on('click', function(e) {
    $("#marker" + status_select_marker.name).css({
      "filter": "hue-rotate(240deg)"
    });
    $('#info_' + status_select_marker.name).removeClass('active');
    status_select_marker.flag = 0;
    status_select_marker.name = '';
  });
  // マップタイルの設定
  L.tileLayer(
    'http://{s}.tile.osm.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
    }
  ).addTo(map);
  var info_class_type = 0;
  for (var d of dataset) {
    // マップ上にマーカーを描画
    marker_set[d.name] = putMarker(map, d);
    // スポット一覧の中身を描画
    appendInfoTag(d, info_class_type);
    info_class_type = Number(!info_class_type);
  }
}

// ページ下部に指標の説明を描画
const view_legend = () => {
  const level_num = 6;
  const max_size = calScore({tmp: level_num-1}, 'size');

  const img_cell = (cell_num) => {
    let tag = '';
    for (let i = 0; i < cell_num; i++) {
      tag += '<td id="legend_img' + i + '" class="img_td"></td>';
    }
    return tag;
  };
  const level_cell = (cell_num) => {
    let tag = '';
    for (let i = 0; i < cell_num; i++) {
      tag += '<td class="level_cell">' + (i+1) + '</td>';
    }
    return tag;
  }

  $('#legend_row0').append('<td rowspan="2"><div class="label">低い評価<div></td>'
    + img_cell(level_num) + '<td rowspan="2"><div class="label">高い評価<div></td>')
  $('#legend_row1').append(level_cell(level_num))

  for (let i = 0; i < level_num; i++) {
    const img = $('<img src="' + icon_filepath + '">');
    // const img = $('<img src="' + icon_filepath + '" id="legend_img"' + i + '>');
    const size = calScore({tmp: i}, 'size');
    const opacity = calScore({tmp: i}, 'opacity');

    $('#legend_img' + i).append(img);
    img.ready(function() {
      img.width(size).height(size);
      img.css('opacity', opacity);
    })
  }
};

(function() {
  // ページの更新日時(DB更新日時) を取得し，表示
  $.ajax({
    url: URL + '/date',
    type: 'get',
    dataType: 'json'
  })
  .done(function (response) {
    const date = response[0].date;
    $('#lastmod').html('最終更新時間: ' + date)
  })
  .fail(function (err) {
    console.log(err);
  });

  // 観光スポット情報を取得し，マップとスポット一覧を描画
  $.ajax({
    // wikipedia に座標が書かれているものだけ取得
    url: URL + '/places?status=1',
    type: 'get',
    dataType: 'json'
  })
  .done(function (response) {
    // response にはデータセットが入っています．
    drawMap(response);
  })
  .fail(function (err) {
    console.log(err);
  });

  // ページ下部に指標の説明を描画
  view_legend();
}());
