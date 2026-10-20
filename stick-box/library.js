(function () {
  'use strict';
  var grid = document.getElementById('series-grid');
  var search = document.getElementById('library-search');
  var results = document.getElementById('library-results');
  function watchLink(group, episode) {
    return 'watch.html?series=' + encodeURIComponent(group.id) + '&episode=' + encodeURIComponent(episode.id);
  }
  function matches(episode, term) {
    return (episode.title + ' ' + (episode.creator || '')).toLowerCase().includes(term);
  }
  function render(catalog) {
    var term = search.value.trim().toLowerCase();
    var shown = 0;
    grid.replaceChildren();
    catalog.series.forEach(function (group) {
      var groupMatches = !term || group.title.toLowerCase().includes(term);
      var episodes = group.episodes.filter(function (episode) { return groupMatches || matches(episode, term); });
      var unavailable = (group.unavailable || []).filter(function (entry) { return groupMatches || matches(entry, term); });
      if (!episodes.length && !unavailable.length) return;
      shown++;
      var card = document.createElement('article');
      card.className = 'series-card';
      var first = episodes[0];
      var coverEpisode = episodes.find(function (episode) { return episode.thumbnail; });
      if (first && coverEpisode) {
        var cover = document.createElement('a');
        cover.className = 'series-cover';
        cover.href = watchLink(group, first);
        cover.setAttribute('aria-label', 'Watch ' + first.title + ' in ' + group.title);
        var image = document.createElement('img');
        image.src = coverEpisode.thumbnail;
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
      label.textContent = episodes.length + ' preserved' + (unavailable.length ? ' / ' + unavailable.length + ' unavailable' : ' / original files');
      var heading = document.createElement('h3');
      heading.textContent = group.title;
      var byline = document.createElement('p');
      byline.className = 'series-byline';
      var creators = Array.from(new Set(episodes.map(function (episode) { return episode.creator; })));
      byline.textContent = creators.length && creators.length <= 3
        ? 'By ' + creators.join(' · ') : 'Various creators. Original source order.';
      var details = document.createElement('details');
      details.className = 'series-episodes';
      details.open = Boolean(term);
      var summary = document.createElement('summary');
      var titleCount = episodes.length + unavailable.length;
      summary.textContent = 'Browse ' + titleCount + (titleCount === 1 ? ' title' : ' titles');
      var list = document.createElement('ol');
      list.className = 'episode-links';
      episodes.forEach(function (episode) {
        var item = document.createElement('li');
        var link = document.createElement('a');
        link.href = watchLink(group, episode);
        link.textContent = episode.title + (episode.playbackStatus === 'external-video' ? ' (external video)' : '');
        item.appendChild(link);
        list.appendChild(item);
      });
      unavailable.forEach(function (entry) {
        var item = document.createElement('li');
        item.className = 'unavailable-entry';
        var link = document.createElement('a');
        link.href = entry.source;
        link.target = '_blank';
        link.rel = 'noopener noreferrer';
        link.textContent = entry.title + ' — original unavailable ↗';
        item.appendChild(link);
        list.appendChild(item);
      });
      details.append(summary, list);
      body.append(label, heading, byline, details);
      card.appendChild(body);
      grid.appendChild(card);
    });
    results.textContent = term ? shown + ' matching collections' : catalog.series.length + ' collections · choose one to browse';
    if (!shown) grid.textContent = 'No titles match that search. Try a different name or creator.';
  }
  fetch('catalog.json').then(function (response) {
    if (!response.ok) throw new Error('Catalog unavailable');
    return response.json();
  }).then(function (catalog) {
    var identifiers = new Set();
    var unavailable = new Set();
    var external = new Set();
    catalog.series.forEach(function (group) {
      group.episodes.forEach(function (episode) {
        identifiers.add(episode.id);
        if (episode.playbackStatus === 'external-video') external.add(episode.id);
      });
      (group.unavailable || []).forEach(function (entry) { unavailable.add(entry.id); });
    });
    document.getElementById('fight-count').textContent = identifiers.size + ' titles';
    document.getElementById('collection-count').textContent = catalog.series.length + ' collections. ' + identifiers.size + ' originals preserved.';
    if (unavailable.size) {
      var note = document.createElement('p');
      note.className = 'archive-availability';
      note.textContent = unavailable.size + ' source files could not be recovered. Their listings are kept in the relevant collections.';
      grid.before(note);
    }
    if (external.size) {
      var externalNote = document.createElement('p');
      externalNote.className = 'archive-availability';
      externalNote.textContent = external.size + ' saved launchers depend on external videos and are labeled in the title lists.';
      grid.before(externalNote);
    }
    search.disabled = false;
    search.addEventListener('input', function () { render(catalog); });
    render(catalog);
  }).catch(function () {
    grid.textContent = 'The collection could not load. Please refresh to try again.';
  });
}());
