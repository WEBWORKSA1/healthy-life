/* Site search: a small index built at publish time, searched in the browser. */
(function () {
  'use strict';
  var HL = window.HL, input = HL.$('#q'), list = HL.$('[data-results]'), note = HL.$('[data-count]');
  if (!input || !list) return;
  var KIND = { tool: 'Tool', guide: 'Guide', challenge: 'Challenge', term: 'Glossary', core: 'Page', info: 'Page' }, index = [];

  function run() {
    var words = input.value.toLowerCase().split(/\s+/).filter(function (w) { return w.length > 1; });
    if (!words.length) { list.innerHTML = ''; note.textContent = 'Type a word, such as sleep, protein or blood pressure.'; return; }
    var hits = index.map(function (p) {
      var t = p.t.toLowerCase(), d = (p.d || '').toLowerCase(), x = (p.x || '').toLowerCase(), s = 0;
      for (var i = 0; i < words.length; i++) {
        var w = words[i], here = (t.indexOf(w) > -1 ? 6 : 0) + (x.indexOf(w) > -1 ? 3 : 0) + (d.indexOf(w) > -1 ? 1 : 0);
        if (!here) return null;
        s += here;
      }
      if (p.k === 'tool') s += 2;
      return { p: p, s: s };
    }).filter(Boolean).sort(function (a, b) { return b.s - a.s; }).slice(0, 30);
    note.textContent = hits.length ? hits.length + (hits.length === 1 ? ' result' : ' results') : 'Nothing matched. Try a simpler word, or browse the tools and guides.';
    list.innerHTML = hits.map(function (h) {
      return '<li><a href="' + HL.root + h.p.u + '">' + HL.esc(h.p.t) + '</a><small>' + (KIND[h.p.k] || 'Page') + '</small><p>' + HL.esc(h.p.d || '') + '</p></li>';
    }).join('');
  }
  HL.json('search.json').then(function (data) {
    index = data;
    input.value = HL.params.get('q') || '';
    run();
  }).catch(function () { note.textContent = 'Search could not load. Check your connection and reload the page.'; });
  input.addEventListener('input', run);
  var form = input.form;
  if (form) form.addEventListener('submit', function (e) { e.preventDefault(); run(); });
})();
