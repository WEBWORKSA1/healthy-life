/* Challenge tracker: tick off days, keep a streak, download a certificate. Stored in this browser only. */
(function () {
  'use strict';
  var HL = window.HL, mount = HL.$('.tracker[data-challenge]');
  if (!mount) return;
  var slug = mount.getAttribute('data-challenge'), days = +mount.getAttribute('data-days'), title = mount.getAttribute('data-title');
  var key = 'hl.ch.' + slug, state = HL.get(key, { done: [], started: null });

  HL.json('challenges.json').then(function (all) {
    var c = all.filter(function (x) { return x.slug === slug; })[0];
    draw(c ? c.tasks : []);
  }).catch(function () { draw([]); });

  function streak() {
    var best = 0, run = 0;
    for (var i = 0; i < days; i++) { if (state.done[i]) { run += 1; best = Math.max(best, run); } else run = 0; }
    return best;
  }
  function draw(tasks) {
    var count = state.done.filter(Boolean).length, cells = '';
    for (var i = 0; i < days; i++) {
      cells += '<li><button type="button" class="day-cell" data-day="' + i + '" aria-pressed="' + (state.done[i] ? 'true' : 'false') + '"><b>Day ' + (i + 1) + '</b>' + HL.esc(tasks[i] || '') + '</button></li>';
    }
    mount.innerHTML = '<div class="tracker-top"><div class="tracker-stat"><span class="num">' + count + ' of ' + days + '</span><span>days done</span></div>' +
      '<div class="tracker-stat"><span class="num">' + streak() + '</span><span>best run in a row</span></div>' +
      '<div class="tracker-stat"><span class="num">' + Math.round(count / days * 100) + '%</span><span>complete</span></div>' +
      '<div class="btn-row"><button type="button" class="btn btn-small btn-accent" data-cert' + (count >= days ? '' : ' disabled') + '>Download my certificate</button>' +
      '<button type="button" class="btn btn-small" data-reset>Start again</button></div></div>' +
      '<p class="muted">Tap a day when you have done it. Tap again to undo.</p><ol class="day-grid">' + cells + '</ol>';
    HL.$$('.day-cell', mount).forEach(function (b) {
      b.addEventListener('click', function () {
        var d = +b.getAttribute('data-day');
        state.done[d] = !state.done[d];
        if (!state.started) state.started = Date.now();
        HL.set(key, state);
        draw(tasks);
        var again = mount.querySelector('[data-day="' + d + '"]');
        if (again) again.focus();
      });
    });
    mount.querySelector('[data-reset]').addEventListener('click', function () {
      if (!window.confirm('Clear your progress on this challenge?')) return;
      state = { done: [], started: null }; HL.set(key, state); draw(tasks);
    });
    mount.querySelector('[data-cert]').addEventListener('click', certificate);
  }

  function certificate() {
    var name = (window.prompt('Name to print on the certificate') || '').trim().slice(0, 40);
    if (!name) return;
    var c = document.createElement('canvas'), x = c.getContext('2d');
    c.width = 1600; c.height = 1130;
    x.fillStyle = '#fbfcfa'; x.fillRect(0, 0, 1600, 1130);
    x.strokeStyle = '#0f4c45'; x.lineWidth = 18; x.strokeRect(40, 40, 1520, 1050);
    x.fillStyle = '#f4d94e'; x.fillRect(49, 49, 1502, 26);
    x.textAlign = 'center'; x.fillStyle = '#0f4c45';
    x.font = '700 54px "Bricolage Grotesque", sans-serif'; x.fillText('Healthy.Life', 800, 190);
    x.fillStyle = '#4a6360'; x.font = '500 38px "Atkinson Hyperlegible Next", sans-serif'; x.fillText('This certifies that', 800, 330);
    x.fillStyle = '#12302f'; x.font = '800 104px "Bricolage Grotesque", sans-serif'; x.fillText(name, 800, 470, 1400);
    x.fillStyle = '#4a6360'; x.font = '500 38px "Atkinson Hyperlegible Next", sans-serif'; x.fillText('completed every day of the', 800, 580);
    x.fillStyle = '#c2255c'; x.font = '750 72px "Bricolage Grotesque", sans-serif'; x.fillText(title, 800, 690, 1400);
    x.fillStyle = '#12302f'; x.font = '600 40px "Atkinson Hyperlegible Next", sans-serif'; x.fillText(days + ' days, finished ' + HL.niceDate(new Date()), 800, 800);
    x.fillStyle = '#4a6360'; x.font = '500 30px "Atkinson Hyperlegible Next", sans-serif'; x.fillText('Self-reported achievement. Well done.', 800, 980);
    var a = document.createElement('a');
    a.download = slug + '-certificate.png'; a.href = c.toDataURL('image/png');
    document.body.appendChild(a); a.click(); a.remove();
  }
})();
