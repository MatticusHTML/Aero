(function () {
  'use strict';
  var grid = document.getElementById('series-grid');
  fetch('catalog.json').then(function (response) {
    if (!response.ok) throw new Error('Catalog unavailable');
    return response.json();
  }).then(function (catalog) {
    var count = 0;
    grid.replaceChildren();
    catalog.series.forEach(function (series) {
      count += series.episodes.length;
      var card = document.createElement('article');
      card.className = 'series-card';
      var first = series.episodes[0];
      if (first.thumbnail) {
        var cover = document.createElement('a');
        cover.className = 'series-cover';
        cover.href = 'watch.html?episode=' + encodeURIComponent(first.id);
        cover.setAttribute('aria-label', 'Watch ' + series.title + ' from the beginning');
        var image = document.createElement('img');
        image.src = first.thumbnail;
        image.alt = '';
        image.loading = 'lazy';
        image.width = 368;
        image.height = 76;
        cover.appendChild(image);
        card.appendChild(cover);
      }
      var body = document.createElement('div');
      body.className = 'series-body';
      var label = document.createElement('p');
      label.className = 'eyebrow';
      label.textContent = series.episodes.length + ' animations / original SWFs';
      var heading = document.createElement('h3');
      heading.textContent = series.title;
      var byline = document.createElement('p');
      byline.className = 'series-byline';
      byline.textContent = series.id === 'shock'
        ? 'Terkoiz’s original trilogy, with tributes by David “Geo” Borja and Jcamelo.'
        : 'The seven-part collection by Master Samus, in its original order.';
      var list = document.createElement('ol');
      list.className = 'episode-links';
      series.episodes.forEach(function (episode) {
        var item = document.createElement('li');
        var link = document.createElement('a');
        link.href = 'watch.html?episode=' + encodeURIComponent(episode.id);
        link.textContent = episode.title;
        item.appendChild(link);
        list.appendChild(item);
      });
      body.append(label, heading, byline, list);
      card.appendChild(body);
      grid.appendChild(card);
    });
    document.getElementById('fight-count').textContent = count + ' titles';
    document.getElementById('collection-count').textContent = catalog.series.length + ' series. ' + count + ' animations preserved.';
  }).catch(function () {
    grid.textContent = 'The collection could not load. Please refresh to try again.';
  });
}());
