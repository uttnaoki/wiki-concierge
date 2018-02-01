const deletePlaceTag = (place) => {
  $(`#UnregisteredPlaces_box_${place}`).remove();
  $.ajax({
    url: `${URL}/places/unregistered`,
    type: 'delete',
    data: {
      'name': place
    }
  })
  .done(function (response) {
    if (response.statusCode === 200) {
      alert(`${place}を削除しました。`)
    }
  })
  .fail(function (err) {
    console.log(err);
  });
};

const del_tag = (place, boxname) => {
  if (boxname === 'NoCoordinatePlaces') {
    return ''
  } else if (boxname === 'UnregisteredPlaces') {
    return `<img src="images/del_icon.png" onClick="deletePlaceTag('${place}')" class="del_icon">`
  }
};

const DeleteMode = () => {
  const status = $('#del_button').html();
  if (status === '削除') {
    $('.del_icon').css('visibility', 'visible');
    $('#del_button').html('削除OFF').addClass('off');
  } else if (status === '削除OFF') {
    $('.del_icon').css('visibility', 'hidden');
    $('#del_button').html('削除').removeClass('off');
  }
}

function appendPlacesTag(places, boxname) {
  // const img_tag = boxname === 'UnregisteredPlaces' ? '<img src="images/del_icon.png">' : ''

  for (const p of places) {
    const box_id = `${boxname}_box_${p.name}`
    const place_tag_id = `${boxname}_tag_${p.name}`

    $(`#${boxname}`).append(`<div class="place_tag" id="${box_id}">
      ${del_tag(p.name, boxname)}
      <p id="${place_tag_id}">${p.name}</p>
      </div>`)

    $(`#${place_tag_id}`).on('click', function() {
      // wikipedia のページへ移動
      window.location.href = 'https://ja.wikipedia.org/wiki/' + p.name;
    })
  }
};

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
