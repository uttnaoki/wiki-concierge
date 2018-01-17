function appendPlacesTag(places, boxname) {
  for (const p of places) {
    const this_id = boxname + '_' + p.name;

    $('#' + boxname).append('<p id="' + this_id + '"'
      + ' class="' + boxname + '_tag">'
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

(function() {
  // 座標が登録されていない観光施設 について
  appendPlacesTag_wrapper('?status=0', 'NoCoordinatePlaces')

  // wikipedia に登録されていない観光施設 について
  appendPlacesTag_wrapper('/unregistered', 'UnregisteredPlaces')
}());
