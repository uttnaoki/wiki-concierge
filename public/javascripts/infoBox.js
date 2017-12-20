function appendPlacesTag(places, boxname) {
  for (const p of places) {
    $('#' + boxname).append('<div id="' + boxname + '_' +  p.name + '">'
      + p.name + '</div>')
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
