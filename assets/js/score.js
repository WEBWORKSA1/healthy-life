/* Healthy Life Score: 18 questions, six pillars, one number out of 100. */
(function () {
  'use strict';
  var HL = window.HL, mount = HL.$('[data-score]');
  if (!mount) return;
  var esc = HL.esc;
  var PILLARS = [['move', 'Move'], ['nourish', 'Nourish'], ['sleep', 'Sleep'], ['mind', 'Mind'], ['connect', 'Connect'], ['prevent', 'Prevent']];

  /* [pillar, question, [[answer, points], ...]] — points follow published guidelines where one exists */
  var Q = [
    ['move', 'In a typical week, how much activity gets you breathing harder?', [['Under 30 minutes', 10], ['30 to 89 minutes', 40], ['90 to 149 minutes', 70], ['150 minutes or more', 100]]],
    ['move', 'On how many days a week do you work your muscles?', [['None', 20], ['One day', 60], ['Two or more days', 100]]],
    ['move', 'How long do you sit on a normal day?', [['10 hours or more', 20], ['7 to 9 hours', 50], ['4 to 6 hours', 80], ['Under 4 hours', 100]]],
    ['nourish', 'How many servings of vegetables and fruit do you eat a day?', [['One or none', 20], ['Two or three', 55], ['Four', 80], ['Five or more', 100]]],
    ['nourish', 'How often do you have sugary drinks?', [['Every day', 15], ['A few times a week', 55], ['Rarely', 85], ['Never', 100]]],
    ['nourish', 'How many meals a week are fast food or ready-made packaged meals?', [['Seven or more', 20], ['Four to six', 50], ['One to three', 80], ['Fewer than one', 100]]],
    ['sleep', 'How much sleep do you get on a usual night?', [['Under 5 hours', 10], ['5 to 6 hours', 40], ['6 to 7 hours', 70], ['7 to 9 hours', 100], ['Over 9 hours', 70]]],
    ['sleep', 'Do you go to bed and get up at about the same time?', [['Rarely', 30], ['Some days', 65], ['Most days', 100]]],
    ['sleep', 'How often do you wake up feeling rested?', [['Rarely', 25], ['Some days', 60], ['Most days', 100]]],
    ['mind', 'How often does stress feel like more than you can handle?', [['Most days', 20], ['Some days', 60], ['Rarely', 100]]],
    ['mind', 'Do you have something that reliably helps you unwind?', [['Not really', 30], ['Sometimes I use it', 65], ['Yes, most days', 100]]],
    ['mind', 'How much time do you spend outdoors in daylight each day?', [['Under 10 minutes', 30], ['10 to 30 minutes', 65], ['Over 30 minutes', 100]]],
    ['connect', 'How often do you have a real conversation with friends or family?', [['Less than weekly', 15], ['Once or twice a week', 55], ['Several times a week', 85], ['Every day', 100]]],
    ['connect', 'If you needed help, how many people could you count on?', [['No one', 15], ['One person', 60], ['Several people', 100]]],
    ['connect', 'How often do your days feel purposeful?', [['Rarely', 30], ['Sometimes', 65], ['Often', 100]]],
    ['prevent', 'Do you smoke or vape?', [['Every day', 0], ['Occasionally', 35], ['I quit', 85], ['Never have', 100]]],
    ['prevent', 'How many alcoholic drinks do you have in a week?', [['15 or more', 15], ['8 to 14', 45], ['3 to 7', 70], ['1 or 2', 90], ['None', 100]]],
    ['prevent', 'When did you last have a checkup or your blood pressure taken?', [['Over 3 years ago, or never', 30], ['1 to 3 years ago', 70], ['Within the past year', 100]]]
  ];
  var BANDS = [[85, 'Thriving', 'Your habits line up with the guidelines almost everywhere. The job now is keeping them through busy and hard patches.'],
    [70, 'Strong', 'Solid foundations with one or two pillars pulling the average down. Small, specific changes there will move the number most.'],
    [50, 'Building', 'Some pillars are working for you and some are not yet. Pick the lowest one and change one thing this week.'],
    [0, 'Starting', 'Plenty of room to gain, which also means the first changes pay back fastest. Start with the single easiest step below.']];

  var answers = [], step = 0, actions = null;
  HL.json('actions.json').then(function (a) { actions = a; }).catch(function () { actions = {}; }).then(function () {
    var shared = parseInt(HL.params.get('shared'), 10), saved = HL.get('hl.score');
    if (shared >= 0 && shared <= 100) {
      mount.innerHTML = '<div class="today-box"><p class="big">Someone shared their Healthy Life Score with you: ' + shared + ' out of 100.</p><p>Take three minutes to find yours.</p></div>';
      var b = HL.el('button', { type: 'button', 'class': 'btn btn-accent', text: 'Find my score', style: 'margin-top:1rem' });
      b.addEventListener('click', ask);
      mount.appendChild(b);
    } else if (saved && !HL.params.get('retake')) result(saved);
    else intro();
  });

  function intro() {
    mount.innerHTML = '<div class="quiz"><p class="lead">Eighteen quick questions about how you live: no weight, no medical history, no sign-up. Your answers never leave this browser.</p>' +
      '<div class="btn-row"><button type="button" class="btn btn-accent" data-start>Start the check</button><span class="muted">Takes about 3 minutes</span></div></div>';
    mount.querySelector('[data-start]').addEventListener('click', ask);
  }

  function ask() {
    var q = Q[step], name = PILLARS.filter(function (p) { return p[0] === q[0]; })[0][1];
    mount.innerHTML = '<div class="quiz" data-pillar="' + q[0] + '"><div class="progress" role="progressbar" aria-valuemin="0" aria-valuemax="' + Q.length + '" aria-valuenow="' + step + '" aria-label="Progress"><i style="width:' + (step / Q.length * 100) + '%"></i></div>' +
      '<p class="muted"><span class="dot"></span>' + name + ', question ' + (step + 1) + ' of ' + Q.length + '</p>' +
      '<fieldset class="q"><legend>' + esc(q[1]) + '</legend><div class="options">' +
      q[2].map(function (o, i) { return '<label class="option"><input type="radio" name="q" value="' + i + '"' + (answers[step] === i ? ' checked' : '') + '><span>' + esc(o[0]) + '</span></label>'; }).join('') +
      '</div></fieldset><div class="quiz-nav"><button type="button" class="btn btn-small" data-back' + (step ? '' : ' disabled') + '>Back</button><span class="muted">Pick an answer to continue</span></div></div>';
    mount.querySelector('[data-back]').addEventListener('click', function () { step -= 1; ask(); });
    HL.$$('input[name="q"]', mount).forEach(function (r) {
      r.addEventListener('change', function () {
        answers[step] = +r.value;
        setTimeout(function () {
          step += 1;
          if (step < Q.length) ask(); else finish();
        }, 180);
      });
    });
    var first = mount.querySelector('input[name="q"]');
    if (first && step) first.focus();
  }

  function finish() {
    var sums = {}, counts = {}, pillars = {}, total = 0;
    Q.forEach(function (q, i) { sums[q[0]] = (sums[q[0]] || 0) + q[2][answers[i]][1]; counts[q[0]] = (counts[q[0]] || 0) + 1; });
    PILLARS.forEach(function (p) { pillars[p[0]] = Math.round(sums[p[0]] / counts[p[0]]); total += pillars[p[0]]; });
    var record = { total: Math.round(total / PILLARS.length), pillars: pillars, at: Date.now(), stress: answers[9] === 0 };
    var history = HL.get('hl.score.history', []);
    history.push({ t: record.total, at: record.at });
    HL.set('hl.score.history', history.slice(-12));
    HL.set('hl.score', record);
    step = 0; answers = [];
    result(record, true);
  }

  function result(rec, fresh) {
    var band = BANDS.filter(function (b) { return rec.total >= b[0]; })[0], C = 2 * Math.PI * 86;
    var order = PILLARS.slice().sort(function (a, b) { return rec.pillars[a[0]] - rec.pillars[b[0]]; });
    var focus = order.slice(0, 3).map(function (p) {
      var a = (actions || {})[p[0]], s = rec.pillars[p[0]];
      if (!a) return '';
      var list = a[s < 50 ? 'low' : s < 80 ? 'mid' : 'high'].slice(0, 2).map(function (x) { return '<li>' + esc(x) + '</li>'; }).join('');
      return '<li data-pillar="' + p[0] + '"><strong>' + p[1] + ', ' + s + ' out of 100</strong><ul>' + list + '</ul><p class="muted" style="margin:.4rem 0 0">' +
        '<a href="' + HL.root + 'tools/' + a.tool[0] + '.html">' + esc(a.tool[1]) + '</a>, <a href="' + HL.root + 'guides/' + a.guide[0] + '.html">' + esc(a.guide[1]) + '</a>' +
        (a.challenge ? ', <a href="' + HL.root + 'challenges/' + a.challenge[0] + '.html">' + esc(a.challenge[1]) + '</a>' : '') + '</p></li>';
    }).join('');
    var history = HL.get('hl.score.history', []);
    var spark = history.length > 1 ? '<p class="muted" style="margin-top:1.5rem">Your last ' + history.length + ' checks</p><div class="spark" aria-hidden="true">' +
      history.map(function (h) { return '<i style="height:' + Math.max(8, h.t) + '%" title="' + h.t + '"></i>'; }).join('') + '</div>' : '';
    mount.innerHTML = '<div class="score-top"><div class="dial"><svg viewBox="0 0 200 200" aria-hidden="true"><circle class="track" cx="100" cy="100" r="86"/>' +
      '<circle class="value" cx="100" cy="100" r="86" stroke-dasharray="' + C.toFixed(1) + '" stroke-dashoffset="' + C.toFixed(1) + '"/></svg>' +
      '<div class="dial-text"><span class="num">' + rec.total + '</span><span>out of 100</span></div></div>' +
      '<div><h2>' + band[1] + '</h2><p class="lead">' + band[2] + '</p><ul class="pillar-bars">' +
      PILLARS.map(function (p) { return '<li data-pillar="' + p[0] + '"><span>' + p[1] + '</span><span class="bar"><i style="width:0" data-w="' + rec.pillars[p[0]] + '"></i></span><b>' + rec.pillars[p[0]] + '</b></li>'; }).join('') +
      '</ul>' + spark + '</div></div>' +
      (rec.stress ? '<aside class="note"><p>You said stress often feels like more than you can handle. That is common, and it is also worth saying out loud to a doctor or someone you trust. Support works.</p></aside>' : '') +
      '<h2 style="margin-top:2.5rem">Where a small change moves your score most</h2><ul class="focus-list">' + focus + '</ul>' +
      '<div class="plan-cta"><div><h2>Get this as a 30-day plan</h2><p>We turn your three focus pillars into four weeks of small steps. Free.</p></div><a class="btn btn-accent" href="' + HL.root + 'plan.html?from=score">Build my free plan</a></div>' +
      '<div class="result-actions"><button type="button" class="btn btn-small" data-share>Copy a link to share my score</button><button type="button" class="btn btn-small" data-card>Download score card</button>' +
      '<button type="button" class="btn btn-small" data-print>Print</button><button type="button" class="btn btn-small" data-retake>Retake the check</button></div>' +
      '<p class="muted" style="margin-top:1rem">Taken ' + HL.niceDate(new Date(rec.at)) + '. Saved on this device only. A lifestyle self-check based on public-health guidelines, not a medical assessment.</p>';
    requestAnimationFrame(function () {
      requestAnimationFrame(function () {
        mount.querySelector('.dial .value').style.strokeDashoffset = (C * (1 - rec.total / 100)).toFixed(1);
        HL.$$('.pillar-bars i', mount).forEach(function (i) { i.style.width = i.getAttribute('data-w') + '%'; });
      });
    });
    mount.querySelector('[data-retake]').addEventListener('click', function () { step = 0; answers = []; ask(); });
    mount.querySelector('[data-print]').addEventListener('click', function () { window.print(); });
    mount.querySelector('[data-share]').addEventListener('click', function (ev) {
      var url = location.origin + location.pathname + '?shared=' + rec.total, btn = ev.currentTarget;
      var done = function () { btn.textContent = 'Link copied'; };
      if (navigator.share) navigator.share({ title: 'My Healthy Life Score', text: 'I scored ' + rec.total + ' out of 100. What is yours?', url: url }).catch(function () { /* cancelled */ });
      else if (navigator.clipboard) navigator.clipboard.writeText(url).then(done); else prompt('Copy this link', url);
    });
    mount.querySelector('[data-card]').addEventListener('click', function () { card(rec, band[1]); });
    if (fresh) mount.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  /* A shareable image drawn in the browser. Nothing is uploaded. */
  function card(rec, label) {
    var c = document.createElement('canvas'), x = c.getContext('2d'), colors = { move: '#e06b25', nourish: '#2f9e6e', sleep: '#5b6cd9', mind: '#9a4fb8', connect: '#d6336c', prevent: '#1e88a8' };
    c.width = 1200; c.height = 630;
    x.fillStyle = '#0f4c45'; x.fillRect(0, 0, 1200, 630);
    x.fillStyle = '#f4d94e'; x.fillRect(0, 0, 1200, 14);
    x.fillStyle = '#ffffff'; x.font = '700 44px "Bricolage Grotesque", sans-serif'; x.fillText('Healthy.Life Score', 70, 110);
    x.font = '800 230px "Bricolage Grotesque", sans-serif'; x.fillText(String(rec.total), 60, 360);
    x.font = '600 40px "Atkinson Hyperlegible Next", sans-serif'; x.fillStyle = '#b9d4cb'; x.fillText('out of 100, ' + label.toLowerCase(), 70, 425);
    PILLARS.forEach(function (p, i) {
      var y = 150 + i * 62, w = 420;
      x.fillStyle = '#ffffff'; x.font = '600 30px "Atkinson Hyperlegible Next", sans-serif'; x.fillText(p[1], 620, y + 24);
      x.fillStyle = 'rgba(255,255,255,.18)'; x.fillRect(770, y, w - 90, 26);
      x.fillStyle = colors[p[0]]; x.fillRect(770, y, (w - 90) * rec.pillars[p[0]] / 100, 26);
      x.fillStyle = '#ffffff'; x.fillText(String(rec.pillars[p[0]]), 1115, y + 24);
    });
    x.fillStyle = '#f4d94e'; x.font = '600 34px "Atkinson Hyperlegible Next", sans-serif'; x.fillText('What is yours? healthy.life/score', 70, 560);
    var a = document.createElement('a');
    a.download = 'healthy-life-score.png'; a.href = c.toDataURL('image/png');
    document.body.appendChild(a); a.click(); a.remove();
  }
})();
