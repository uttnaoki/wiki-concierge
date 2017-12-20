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

(function() {
  $.ajax({
    // wikipedia に座標が書かれているものだけ取得
    url: URL + '/places?status=0',
    type: 'get',
    dataType: 'json'
  })
  .done(function (response) {
    appendPlacesTag(response, 'NoCoordinatePlaces')
  })
  .fail(function (err) {
    console.log(err);
  });
}());
