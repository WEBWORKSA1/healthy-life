/* My numbers: one profile in, every number out. Needs tools.js. */
(function () {
  'use strict';
  var HL = window.HL, T = window.HLTools, mount = HL.$('[data-numbers]');
  if (!mount || !T) return;
  var fmt = HL.fmt, esc = HL.esc, link = function (slug, text) { return '<a href="' + HL.root + 'tools/' + slug + '.html">' + text + '</a>'; };

  var def = {
    fields: ['units', 'sex', 'age', 'height', 'weight',
      { id: 'waist', type: 'length', label: 'Waist (optional)', profile: 'waistCm', min: 40, max: 200, optional: true, help: 'Midway between lowest rib and hip bone.' },
      'rhr', 'activity'],
    calc: function (v) { return v; }
  };
  var form = HL.el('div'), out = HL.el('div', { 'aria-live': 'polite' });
  mount.appendChild(form);
  mount.appendChild(out);

  function tile(slug, name, value, unit, note, tape) {
    return '<div class="number-tile">' + link(slug, name) + '<span class="num">' + esc(value) + (unit ? '<small>' + esc(unit) + '</small>' : '') + '</span>' +
      (tape || '') + '<p>' + note + '</p></div>';
  }

  function render(v) {
    if (!v) {
      out.innerHTML = '<p class="empty">Add your age, height and weight above. Your numbers appear here and are remembered on this device only.</p>';
      return;
    }
    var b = T.bmi(v), h = v.heightCm / 100, band = b < 18.5 ? 'underweight' : b < 25 ? 'healthy weight' : b < 30 ? 'overweight' : 'obesity range';
    var bmr = T.mifflin(v), tdee = Math.round(bmr * parseFloat(v.activity) / 10) * 10, max = T.tanaka(v.age), need = T.sleepNeed(v.age);
    var water = (v.sex === 'male' ? 3.0 : 2.2);
    var z2 = v.rhr ? [v.rhr + (max - v.rhr) * 0.6, v.rhr + (max - v.rhr) * 0.7] : [max * 0.6, max * 0.7];
    var html = '<div class="numbers-grid">';
    html += tile('bmi-calculator', 'Body mass index', b.toFixed(1), '', 'Classed as ' + band + '. A screening number, not a verdict.',
      HL.tape({ min: 15, max: 40, value: b, text: b.toFixed(1), marks: [15, 18.5, 25, 30, 40], bands: T.bmiBands, key: false }));
    if (v.waistCm) {
      var r = v.waistCm / v.heightCm;
      html += tile('waist-to-height-ratio', 'Waist-to-height ratio', r.toFixed(2), '', r < 0.5 ? 'Under 0.5: your waist is less than half your height.' : 'At or over 0.5. Aim to bring your waist under ' + T.len(v.heightCm / 2, v.units) + '.',
        HL.tape({ min: 0.3, max: 0.8, value: r, text: r.toFixed(2), marks: [0.3, 0.4, 0.5, 0.6, 0.8], key: false,
          bands: [{ to: 0.4, c: 'low' }, { to: 0.5, c: 'good' }, { to: 0.6, c: 'watch' }, { to: 0.8, c: 'alert' }] }));
    } else {
      html += '<div class="number-tile">' + link('waist-to-height-ratio', 'Waist-to-height ratio') + '<span class="num">?</span><p>Add your waist above. It says more about health risk than BMI does.</p></div>';
    }
    html += tile('healthy-weight-range', 'Healthy weight for your height', T.wtRange(18.5 * h * h, 24.9 * h * h, v.units), '', 'The span that gives a BMI of 18.5 to 24.9.');
    html += tile('tdee-calculator', 'Calories to hold your weight', fmt(tdee), 'kcal a day', 'At your chosen activity level. Resting needs are ' + fmt(bmr) + ' kcal.');
    html += tile('protein-calculator', 'Protein to aim for', fmt(v.weightKg * 1.2) + '–' + fmt(v.weightKg * 1.6), 'g a day', '1.2 to 1.6 g per kg. The bare minimum is ' + fmt(v.weightKg * 0.8) + ' g.');
    html += tile('water-intake-calculator', 'Water from drinks', T.vol(water, v.units), 'a day', 'Baseline before exercise and heat. All drinks count.');
    html += tile('heart-rate-zones', 'Easy-effort heart rate', Math.round(z2[0]) + '–' + Math.round(z2[1]), 'bpm', 'Zone 2' + (v.rhr ? ', using your resting heart rate' : '') + '. Estimated maximum: ' + fmt(max) + ' bpm.');
    html += tile('sleep-calculator', 'Sleep you need', need[0] + '–' + need[1], 'hours a night', 'Find a bedtime that fits your wake-up time.');
    html += tile('activity-minutes-checker', 'Weekly movement target', '150–300', 'minutes', 'Moderate activity, plus muscle strengthening on 2 days.');
    var score = HL.get('hl.score');
    html += score ? '<div class="number-tile"><a href="' + HL.root + 'score.html">Healthy Life Score</a><span class="num">' + score.total + '<small>out of 100</small></span><p>Taken ' + HL.niceDate(new Date(score.at)) + '. Retake it monthly to see your trend.</p></div>'
      : '<div class="number-tile"><a href="' + HL.root + 'score.html">Healthy Life Score</a><span class="num">?</span><p>Eighteen questions, three minutes. Adds lifestyle to the numbers above.</p></div>';
    html += '</div>';

    var saved = HL.get('hl.numbers', {}), keep = ['body-fat-calculator', 'blood-pressure-checker', 'a1c-converter', 'activity-minutes-checker', 'alcohol-units-calculator', 'caffeine-cutoff-calculator', 'smoke-free-calculator', 'macro-calculator', 'weight-goal-planner'];
    var extra = keep.filter(function (k) { return saved[k]; }).map(function (k) {
      return '<div><dt>' + link(k, esc(saved[k].label)) + ', ' + HL.niceDate(new Date(saved[k].at)) + '</dt><dd>' + esc(saved[k].value) + '</dd></div>';
    }).join('');
    if (extra) html += '<h2 style="margin-top:2.5rem">Saved from other tools</h2><dl class="result-rows" style="max-width:42rem">' + extra + '</dl>';
    html += '<div class="result-actions"><button type="button" class="btn btn-small" data-print>Print my numbers</button>' +
      '<a class="btn btn-accent btn-small" href="' + HL.root + 'plan.html?from=my-numbers">Build my free plan</a>' +
      '<button type="button" class="btn btn-small" data-clear>Clear my data from this device</button></div>';
    out.innerHTML = html;
    out.querySelector('[data-print]').addEventListener('click', function () { window.print(); });
    out.querySelector('[data-clear]').addEventListener('click', function () {
      if (!window.confirm('Remove your profile, saved numbers, score and challenge progress from this browser?')) return;
      try { Object.keys(localStorage).forEach(function (k) { if (k.indexOf('hl.') === 0 && k !== 'hl.theme' && k !== 'hl.cookie-ok') localStorage.removeItem(k); }); } catch (e) { /* ignore */ }
      location.reload();
    });
  }
  new T.Tool(form, 'numbers', def, { onResult: render });
})();
