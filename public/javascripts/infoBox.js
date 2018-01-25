function appendPlacesTag(places, boxname) {
  for (const p of places) {
    const this_id = boxname + '_' + p.name;

    $('#' + boxname).append('<p id="' + this_id + '"'
      + ' class="place_tag">'
      + p.name + '</p>')

    $('#' + this_id).on('click', function() {
      // wikipedia のページへ移動
      window.location.href = 'https://ja.wikipedia.org/wiki/' + p.name;
    })
  }
}

function appendPlacesTag_wrapper (lower_url, id) {
  $.ajax({
    url: URL + '/places' + lower_url,
    type: 'get',
    dataType: 'json'
  })
  .done(function (response) {
    appendPlacesTag(response, id)
  })
  .fail(function (err) {
    console.log(err);
  });
}

// Unregisteredテーブル にデータを格納
function insertUnregisteredDB () {
  var place_name = $('#textform_unregistered').val();
  if (!place_name) {
    alert('施設名を入力していません．')
    return;
  }

  $.ajax({
    url: URL + '/places/unregistered',
    type: 'POST',
    data: {
      'name': place_name
    }
  })
  .done(function (response) {
    console.log(response);
    // 未登録施設のタグを再描画
    $('#UnregisteredPlaces').empty();
    appendPlacesTag_wrapper('/unregistered', 'UnregisteredPlaces')
  })
  .fail(function (err) {
    console.log(err);
  });

  $('#textform_unregistered').val('');
}

(function() {
  // ページの更新日時(DB更新日時) を取得
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

  // 座標が登録されていない観光施設 について
  appendPlacesTag_wrapper('?status=0', 'NoCoordinatePlaces')

  // wikipedia に登録されていない観光施設 について
  appendPlacesTag_wrapper('/unregistered', 'UnregisteredPlaces')
}());
