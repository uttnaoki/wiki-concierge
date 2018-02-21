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
  if (type === 'score') return scores_mean;

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
  const message = `
    <h2>
      <a href="https://ja.wikipedia.org/wiki/${name}" target="_blank">${name}</a>
    </h2>
    <p class="PopupMessage">${overview}</p>
  `;
  return message;
}

function highlightMarker(name, action) {
  $(`#marker${name}`).css({
    filter: 'hue-rotate(0deg)'
  })
  $(`.leaflet-marker-icon:not(#marker${name})`).css({
    filter: 'hue-rotate(240deg)'
  })
  marker_set[name].openPopup();
  const lat = marker_set[name]._latlng.lat;
  const lng = marker_set[name]._latlng.lng;

  if (action === 'pan') map.panTo([lat+0.05, lng])
  else if (action === 'pan_zoom') map.setView([lat+0.0005, lng], 16);
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
      $(`#info_${status_select_marker.name}`).removeClass('active');
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
      $(`#marker${data.name}`).css({
        filter: "hue-rotate(240deg)"
      })
    }
  })
  $(marker._icon).attr("id", "marker" + data.name)
  $(marker._icon).addClass("marker")
  $(marker._icon).css({
    filter: "hue-rotate(240deg)"
  })

  return marker;
}

// 観光スポット一覧の中に画像とスポット名を追加
function appendInfoTag(spot_name, class_type) {
  $('#information').append(`
    <div id="info_${spot_name}" class="info_content">
      <div class="info_content_inner class_type${class_type}">
        <img src="images/${spot_name}.jpg" alt="${spot_name}">
      </div>
      <div class="info_content_inner class_type${class_type}">
        <p class="textbox">${spot_name}</p>
      </div>
    </div>
  `)

  $(`#info_${spot_name}`).on('click', function() {
    highlightMarker(spot_name, 'pan_zoom');
    highlightInfo(spot_name)
    status_select_marker.flag = 1;
    status_select_marker.name = spot_name;
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
    // マーカー以外をクリックした際の動作
    $(`#marker${status_select_marker.name}`).css({
      filter: 'hue-rotate(240deg)'
    });
    $(`#info_${status_select_marker.name}`).removeClass('active');
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

  const spots_score = [];
  for (var data of dataset) {
    // マップ上にマーカーを描画
    marker_set[data.name] = putMarker(map, data);

    const Scores = {
      Score_countFulltext: data.Score_countFulltext,
      Score_countLang: data.Score_countLang,
      Score_itemCount: data.Score_itemCount,
      Score_editfrequency: data.Score_editfrequency,
      Score_countperson: data.Score_countperson
    }
    spots_score.push({
      name: data.name,
      score: calScore(Scores, 'score')
    })
  }
  // スコアを基にスポットを降順でソート
  spots_score.sort(function(a,b){
    if(a.score > b.score) return -1;
    if(a.score < b.score) return 1;
    return 0;
  });

  for (var s of spots_score) {
    // スポット一覧の中身を描画
    appendInfoTag(s.name, info_class_type);
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
      tag += `<td id="legend_img${i}" class="img_td"></td>`;
    }
    return tag;
  };
  const level_cell = (cell_num) => {
    let tag = '';
    for (let i = 0; i < cell_num; i++) {
      tag += `<td class="level_cell">${i+1}</td>`;
    }
    return tag;
  }

  $('#legend_row0').append(`
    <td rowspan="2">
      <div class="label">低い評価<div>
    </td>
    ${img_cell(level_num)}
    <td rowspan="2">
      <div class="label">高い評価<div>
    </td>
  `)
  $('#legend_row1').append(level_cell(level_num))

  for (let i = 0; i < level_num; i++) {
    const img = $(`<img src="${icon_filepath}">`);
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
  let dataset;
  $.ajax({
    // wikipedia に座標が書かれているものだけ取得
    url: URL + '/places?status=1',
    type: 'get',
    dataType: 'json'
  })
  .done(function (response) {
    // 一つ上のスコープでデータを保持
    dataset = response;
    drawMap(dataset);
  })
  .fail(function (err) {
    console.log(err);
  });

  // wikiページの評価尺度のセレクタを追加
  $('#map').append('<div id="metrics_selectors"></div>')
  const eval_metrics = {
    '他言語の記事数': 'Score_countLang',
    '目次の項目数': 'Score_itemCount',
    'テキスト量': 'Score_countFulltext',
    '記事の更新頻度': 'Score_editfrequency',
    '編集者の数': 'Score_countperson'
  };
  for (const metrics in eval_metrics) {
    const appended_tag = `<button id="metrics_${metrics}"
      class="btn metrics_selector_elem" value='on'>${metrics}</button>`;

    $('#metrics_selectors').append(appended_tag);
  }

  // 評価尺度セレクタのクリックイベントを定義
  const setScores = (data, usable_metrics) => {
    // 評価尺度が1つも選択されていない場合，ページを評価せず，3を返す．
    if (!usable_metrics.length) {
      return {tmp: 3};
    }

    const usable_scores = {};
    for (const metrics of usable_metrics) {
      const score_name = eval_metrics[metrics];
      usable_scores[score_name] = data[score_name];
    }
    return usable_scores;
  }

  // 各マーカーのサイズ・透過度・ポップアップのアンカーを変更
  const redisplayMarker = (dataset, usable_metrics) => {
    const spots_score = [];

    for (const data of dataset) {
      const this_marker = marker_set[data.name];
      const usable_scores = setScores(data, usable_metrics);
      const icon = setIconOption(usable_scores)
      const opacity = calScore(usable_scores, 'opacity');

      this_marker.setIcon(icon).setOpacity(opacity);

      // spots_score.[data.name] = calScore(usable_scores, 'score');
      spots_score.push({
        name: data.name,
        score: calScore(usable_scores, 'score')
      })
    }
    return spots_score;
  }

  $('.metrics_selector_elem').on('click', function() {
    // 評価尺度セレクタのステータスを変更
    const this_status = $(this).val();
    const reverse_status = {
      'on': 'off',
      'off': 'on'
    };
    $(this).val(reverse_status[this_status]);

    // 使用可能な評価尺度でwikiページを再評価し，マーカーを再描画
    let usable_metrics = [];
    $('.metrics_selector_elem[value="on"]').each(function(){
      usable_metrics.push($(this).html());
    })
    let spots_score = redisplayMarker(dataset, usable_metrics);

    // スコアを基にスポットを降順でソート
    spots_score.sort(function(a,b){
      if(a.score > b.score) return -1;
      if(a.score < b.score) return 1;
      return 0;
    });
    let info_class_type = 0;
    $('#information').empty();
    for (var s of spots_score) {
      appendInfoTag(s.name, info_class_type);
      info_class_type = Number(!info_class_type);
    }
  })
  // ページ下部に指標の説明を描画
  view_legend();
}());
