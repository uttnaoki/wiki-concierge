const deletePlaceTag = (place) => {
  $(`#UnregisteredPlaces_box_${place}`).remove();
  $.ajax({
    url: `${URL}/places/unregistered`,
    type: 'delete',
    data: {
      'name': place
    }
  })
  .done( (response) => {
    if (response.statusCode === 200) {
      alert(`${place}を削除しました。`)
    }
  })
  .fail( (err) => {
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
    // 削除タグの生成(可視化)
    // $('.del_icon').css('visibility', 'visible');
    $('.del_icon')
      .css({'visibility':'visible'})
      .animate({opacity: 1}, 400);
    // 削除ボタンの状態変更
    $('#del_button').html('削除OFF').addClass('off');
  } else if (status === '削除OFF') {
    // 削除タグの削除(不可視化)
    // $('.del_icon').css('visibility', 'hidden');
    $('.del_icon')
      .animate({opacity: 0}, 400)
      .css({'visibility':'hidden'});
    // 削除ボタンの状態変更
    $('#del_button').html('削除').removeClass('off');
  }
}

const appendPlacesTag = (places, boxname) => {
  // const img_tag = boxname === 'UnregisteredPlaces' ? '<img src="images/del_icon.png">' : ''

  for (const p of places) {
    const box_id = `${boxname}_box_${p.name}`
    const place_tag_id = `${boxname}_tag_${p.name}`

    $(`#${boxname}`).append(`<div class="place_tag" id="${box_id}">
      ${del_tag(p.name, boxname)}
      <p id="${place_tag_id}">${p.name}</p>
      </div>`)

    $(`#${place_tag_id}`).on('click', () => {
      // wikipedia のページへ移動
      window.location.href = 'https://ja.wikipedia.org/wiki/' + p.name;
    })
  }
};

const appendPlacesTag_wrapper = (lower_url, id) => {
  $.ajax({
    url: URL + '/places' + lower_url,
    type: 'get',
    dataType: 'json'
  })
  .done( (response) => {
    appendPlacesTag(response, id)
  })
  .fail( (err) => {
    console.log(err);
  });
}

// Unregisteredテーブル にデータを格納
const insertUnregisteredDB = ()  => {
  var place_name = $('#textform_unregistered').val();
  console.log(place_name);
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
  .done( (response) => {
    console.log(response);
    // 未登録施設のタグを再描画
    $('#UnregisteredPlaces').empty();
    appendPlacesTag_wrapper('/unregistered', 'UnregisteredPlaces')
  })
  .fail( (err) => {
    console.log(err);
  });

  $('#textform_unregistered').val('');
}

// 追加してほしい岡山県の観光スポットへの投稿フォーム
$(document).on('confirmation', '.remodal', () => {
  insertUnregisteredDB();
});

(() => {
  // ページの更新日時(DB更新日時) を取得
  $.ajax({
    url: URL + '/date',
    type: 'get',
    dataType: 'json'
  })
  .done( (response) => {
    const date = response[0].date;
    $('#lastmod').html('最終更新時間: ' + date)
  })
  .fail( (err) => {
    console.log(err);
  });

  // 座標が登録されていない観光施設 について
  appendPlacesTag_wrapper('?status=0', 'NoCoordinatePlaces')

  // wikipedia に登録されていない観光施設 について
  appendPlacesTag_wrapper('/unregistered', 'UnregisteredPlaces')
})();
