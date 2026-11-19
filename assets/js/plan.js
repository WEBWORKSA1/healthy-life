/* Free Healthy Life Plan: a five-step wizard that writes a 30-day plan and, with consent, sends a lead. */
(function () {
  'use strict';
  var HL = window.HL, mount = HL.$('[data-plan]');
  if (!mount) return;
  var esc = HL.esc;
  var PILLARS = [['move', 'Move'], ['nourish', 'Nourish'], ['sleep', 'Sleep'], ['mind', 'Mind'], ['connect', 'Connect'], ['prevent', 'Prevent']];
  var NAME = {}; PILLARS.forEach(function (p) { NAME[p[0]] = p[1]; });
  var GOALS = [['energy', 'More energy', ['sleep', 'move']], ['weight', 'A healthier weight', ['nourish', 'move']], ['strength', 'Get stronger and fitter', ['move']],
    ['sleep', 'Sleep better', ['sleep']], ['stress', 'Feel less stressed', ['mind', 'connect']], ['eating', 'Eat better', ['nourish']],
    ['heart', 'Look after my heart', ['prevent', 'move']], ['aging', 'Stay well as I age', ['move', 'connect', 'prevent']]];
  var STEPS = 5, actions = {}, saved = HL.get('hl.plan'), score = HL.get('hl.score');
  var st = (saved && saved.st) || { goals: [], ratings: {}, useScore: !!score, time: '20', support: 'self', budget: 'none', start: 'week', age: '', country: '', who: 'me' };
  var step = 1;

  HL.json('actions.json').then(function (a) { actions = a; }).catch(function () { /* plan falls back to headings only */ }).then(function () {
    if (saved && saved.unlocked) full(); else draw();
  });

  function shell(title, hint, body, canNext) {
    var bars = ''; for (var i = 1; i <= STEPS; i++) bars += '<li class="' + (i <= step ? 'done' : '') + '"></li>';
    mount.innerHTML = '<div class="wizard"><ol class="wizard-steps" aria-hidden="true">' + bars + '</ol><p class="muted">Step ' + step + ' of ' + STEPS + '</p>' +
      '<h2>' + title + '</h2>' + (hint ? '<p class="muted">' + hint + '</p>' : '') + body +
      '<div class="quiz-nav"><button type="button" class="btn btn-small" data-back' + (step > 1 ? '' : ' disabled') + '>Back</button>' +
      (step < STEPS ? '<button type="button" class="btn btn-accent" data-next' + (canNext ? '' : ' disabled') + '>Continue</button>' : '') + '</div></div>';
    mount.querySelector('[data-back]').addEventListener('click', function () { step -= 1; draw(); });
    var next = mount.querySelector('[data-next]');
    if (next) next.addEventListener('click', function () { step += 1; draw(); window.scrollTo({ top: mount.getBoundingClientRect().top + scrollY - 90, behavior: 'smooth' }); });
  }
  function radios(name, options, value) {
    return '<div class="options multi">' + options.map(function (o) {
      return '<label class="option"><input type="radio" name="' + name + '" value="' + o[0] + '"' + (value === o[0] ? ' checked' : '') + '><span>' + esc(o[1]) + '</span></label>';
    }).join('') + '</div>';
  }
  function bind(name, key) {
    HL.$$('input[name="' + name + '"]', mount).forEach(function (r) { r.addEventListener('change', function () { st[key] = r.value; }); });
  }

  function draw() {
    if (step === 1) {
      shell('What do you want most right now?', 'Pick up to three.',
        '<div class="options multi">' + GOALS.map(function (g) {
          return '<label class="option"><input type="checkbox" value="' + g[0] + '"' + (st.goals.indexOf(g[0]) > -1 ? ' checked' : '') + '><span>' + g[1] + '</span></label>';
        }).join('') + '</div>', st.goals.length > 0);
      HL.$$('input[type="checkbox"]', mount).forEach(function (c) {
        c.addEventListener('change', function () {
          if (c.checked && st.goals.length >= 3) { c.checked = false; return; }
          st.goals = HL.$$('input[type="checkbox"]', mount).filter(function (x) { return x.checked; }).map(function (x) { return x.value; });
          mount.querySelector('[data-next]').disabled = !st.goals.length;
        });
      });
    } else if (step === 2) {
      if (score && st.useScore) {
        shell('Where you are today', '', '<div class="today-box"><p class="big">We will use your Healthy Life Score of ' + score.total + ', taken ' + HL.niceDate(new Date(score.at)) + '.</p>' +
          '<p><button type="button" class="btn btn-small" data-rerate>Rate each area myself instead</button></p></div>', true);
        mount.querySelector('[data-rerate]').addEventListener('click', function () { st.useScore = false; draw(); });
      } else {
        var body = PILLARS.map(function (p) {
          return '<fieldset class="q" data-pillar="' + p[0] + '" style="margin-bottom:1rem"><legend style="font-size:1.1rem;margin-bottom:.5rem"><span class="dot"></span>' + p[1] + '</legend>' +
            '<div class="seg">' + [['35', 'Needs work'], ['65', 'OK'], ['90', 'Strong']].map(function (o) {
              return '<label><input type="radio" name="r-' + p[0] + '" value="' + o[0] + '"' + (String(st.ratings[p[0]]) === o[0] ? ' checked' : '') + '><span>' + o[1] + '</span></label>';
            }).join('') + '</div></fieldset>';
        }).join('');
        shell('How is each area going?', 'A gut feeling is fine. For a sharper picture, <a href="' + HL.root + 'score.html">take the 3-minute score</a> first.', body, Object.keys(st.ratings).length === 6);
        HL.$$('input[type="radio"]', mount).forEach(function (r) {
          r.addEventListener('change', function () {
            st.ratings[r.name.slice(2)] = +r.value;
            mount.querySelector('[data-next]').disabled = Object.keys(st.ratings).length < 6;
          });
        });
      }
    } else if (step === 3) {
      shell('How do you like to work on things?', '',
        '<fieldset class="q"><legend style="font-size:1.1rem">Time you can give it most days</legend>' + radios('time', [['10', '10 minutes'], ['20', '20 minutes'], ['30', '30 minutes'], ['45', '45 minutes or more']], st.time) + '</fieldset>' +
        '<fieldset class="q"><legend style="font-size:1.1rem">The kind of support that suits you</legend>' + radios('support', [['self', 'On my own'], ['app', 'An app or programme'], ['coach', 'A coach, trainer or dietitian'], ['group', 'A group or class']], st.support) + '</fieldset>' +
        '<fieldset class="q"><legend style="font-size:1.1rem">What you would spend on support each month</legend>' + radios('budget', [['none', 'Nothing right now'], ['low', 'Under US$50'], ['mid', 'US$50 to 150'], ['high', 'Over US$150']], st.budget) + '</fieldset>' +
        '<fieldset class="q"><legend style="font-size:1.1rem">When you want to start</legend>' + radios('start', [['week', 'This week'], ['month', 'This month'], ['later', 'Just exploring']], st.start) + '</fieldset>', true);
      bind('time', 'time'); bind('support', 'support'); bind('budget', 'budget'); bind('start', 'start');
    } else if (step === 4) {
      shell('A little about you', 'This tunes the plan and, if you ask for it, helps us match the right kind of professional.',
        '<fieldset class="q"><legend style="font-size:1.1rem">Age group</legend>' + radios('age', [['18-29', '18 to 29'], ['30-44', '30 to 44'], ['45-59', '45 to 59'], ['60+', '60 or over']], st.age) + '</fieldset>' +
        '<fieldset class="q"><legend style="font-size:1.1rem">This plan is for</legend>' + radios('who', [['me', 'Me'], ['family', 'My family'], ['team', 'My team at work']], st.who) + '</fieldset>' +
        '<div class="field" style="max-width:24rem"><label for="pl-country">Country (optional)</label><input id="pl-country" type="text" autocomplete="country-name" value="' + esc(st.country) + '"></div>', !!st.age);
      bind('who', 'who');
      HL.$$('input[name="age"]', mount).forEach(function (r) { r.addEventListener('change', function () { st.age = r.value; mount.querySelector('[data-next]').disabled = false; }); });
      mount.querySelector('#pl-country').addEventListener('input', function (e) { st.country = e.target.value; });
    } else preview();
    HL.set('hl.plan', { st: st, unlocked: false });
  }

  /* ---------- building the plan ---------- */
  function scores() {
    if (score && st.useScore) return score.pillars;
    var s = {}; PILLARS.forEach(function (p) { s[p[0]] = st.ratings[p[0]] || 65; }); return s;
  }
  function focus() {
    var s = scores(), weight = {};
    PILLARS.forEach(function (p) { weight[p[0]] = 100 - s[p[0]]; });
    GOALS.forEach(function (g) { if (st.goals.indexOf(g[0]) > -1) g[2].forEach(function (p, i) { weight[p] += i === 0 ? 40 : 20; }); });
    return PILLARS.map(function (p) { return p[0]; }).sort(function (a, b) { return weight[b] - weight[a]; });
  }
  function week(n, key, title, s) {
    var a = actions[key];
    if (!a) return '<div class="week"><h3>Week ' + n + ', ' + NAME[key] + '</h3></div>';
    var level = s[key] < 50 ? 'low' : s[key] < 80 ? 'mid' : 'high';
    return '<div class="week" data-pillar="' + key + '"><h3><span class="dot"></span>Week ' + n + ', ' + NAME[key] + ': ' + title + '</h3><ul>' +
      a[level].map(function (x) { return '<li>' + esc(x) + '</li>'; }).join('') + '</ul><p class="muted" style="margin:.5rem 0 0">Measure it: <a href="' + HL.root + 'tools/' + a.tool[0] + '.html">' + esc(a.tool[1]) + '</a>. ' +
      'Read: <a href="' + HL.root + 'guides/' + a.guide[0] + '.html">' + esc(a.guide[1]) + '</a>.' +
      (a.challenge ? ' Go further: <a href="' + HL.root + 'challenges/' + a.challenge[0] + '.html">' + esc(a.challenge[1]) + '</a>.' : '') + '</p></div>';
  }
  function planHtml(all) {
    var f = focus(), s = scores();
    var html = '<p class="lead">Your focus: ' + NAME[f[0]] + ', then ' + NAME[f[1]] + ' and ' + NAME[f[2]] + '. About ' + st.time + ' minutes a day.</p>' + week(1, f[0], 'start small', s);
    if (!all) return html;
    return html + week(2, f[1], 'add the second habit', s) + week(3, f[2], 'round it out', s) +
      '<div class="week"><h3>Week 4, lock it in</h3><ul><li>Keep the three steps from weeks 1 to 3 that felt easiest. Drop the rest without guilt.</li>' +
      '<li>Tie each one to something you already do every day, such as breakfast, your commute or brushing your teeth.</li>' +
      '<li>Retake your <a href="' + HL.root + 'score.html?retake=1">Healthy Life Score</a> on day 30 and compare.</li></ul></div>';
  }

  function preview() {
    shell('Your plan is ready', '', '<div class="plan-out">' + planHtml(false) + '</div>' +
      '<div class="panel" style="margin-top:1.5rem"><h2>Unlock weeks 2 to 4</h2><p class="muted">Tell us where to reach you and the full four-week plan opens on this page straight away.</p>' +
      '<form class="form" data-lead novalidate><div class="two"><div class="field"><label for="pl-name">First name</label><input id="pl-name" name="First name" required autocomplete="given-name"></div>' +
      '<div class="field"><label for="pl-email">Email</label><input id="pl-email" type="email" name="email" required autocomplete="email"></div></div>' +
      '<div class="field"><label for="pl-phone">Phone (optional, if you want a call back)</label><input id="pl-phone" type="tel" name="Phone" autocomplete="tel"></div>' +
      '<label class="check"><input type="checkbox" name="match" value="yes"><span>Yes, introduce me to up to three vetted coaches, dietitians, trainers or programmes that fit my goals. They may contact me by email or phone.</span></label>' +
      '<label class="check"><input type="checkbox" name="agree" required><span>I agree to the <a href="' + HL.root + 'privacy.html" target="_blank">privacy policy</a> and to receive my plan and occasional tips by email. I can unsubscribe any time.</span></label>' +
      '<div class="hp" aria-hidden="true"><label>Leave this empty<input type="text" name="_honey" tabindex="-1" autocomplete="off"></label></div>' +
      '<button class="btn btn-accent" type="submit">Show my full plan</button><p class="form-status" role="status"></p>' +
      '<p class="form-note">We never ask for medical details here, and we do not sell your email address. Matching happens only if you tick the first box.</p></form></div>', true);
    var form = mount.querySelector('[data-lead]'), status = form.querySelector('.form-status');
    form.addEventListener('submit', function (ev) {
      ev.preventDefault();
      if (form.querySelector('[name="_honey"]').value) return;
      if (!form.checkValidity()) { form.reportValidity(); return; }
      var d = new FormData(form), f = focus(), s = scores(), match = d.get('match') === 'yes', pts = 0;
      if (st.support === 'coach' || st.support === 'group') pts += 2;
      pts += { none: 0, low: 1, mid: 2, high: 3 }[st.budget];
      pts += { week: 2, month: 1, later: 0 }[st.start];
      if (d.get('Phone')) pts += 1;
      if (st.who === 'team') pts += 2;
      if (match) pts += 2;
      var grade = pts >= 6 ? 'HOT' : pts >= 3 ? 'WARM' : 'COOL';
      form.querySelector('button').disabled = true;
      status.textContent = 'Opening your plan…';
      HL.set('hl.plan', { st: st, unlocked: true });
      HL.send('Plan lead [' + grade + '] ' + st.goals.join(', '), {
        'First name': d.get('First name'), email: d.get('email'), Phone: d.get('Phone') || 'not given',
        'Lead grade': grade + ' (' + pts + ' points)', 'Wants introductions': match ? 'YES, up to 3 pros' : 'No',
        Goals: st.goals.join(', '), 'Focus pillars': f.slice(0, 3).map(function (k) { return NAME[k]; }).join(', '),
        'Pillar scores': PILLARS.map(function (p) { return p[1] + ' ' + s[p[0]]; }).join(', '),
        'Score source': score && st.useScore ? 'Healthy Life Score ' + score.total : 'Self-rated',
        'Time per day': st.time + ' min', 'Support wanted': st.support, 'Monthly budget': st.budget, Start: st.start,
        'Age group': st.age, Country: st.country || 'not given', 'Plan for': st.who, 'Came from': HL.params.get('from') || 'direct'
      }).then(full);
    });
  }

  function full() {
    mount.innerHTML = '<div class="wizard"><h2>Your 30-day Healthy Life Plan</h2><div class="plan-out">' + planHtml(true) + '</div>' +
      '<div class="result-actions"><button type="button" class="btn btn-small" data-print>Print or save as PDF</button>' +
      '<a class="btn btn-small" href="' + HL.root + 'challenges.html">Pick a challenge</a><button type="button" class="btn btn-small" data-again>Start over</button></div>' +
      '<p class="muted" style="margin-top:1rem">This plan is general wellbeing guidance, not medical advice. If you have a health condition, check changes with your doctor first.</p></div>';
    mount.querySelector('[data-print]').addEventListener('click', function () { window.print(); });
    mount.querySelector('[data-again]').addEventListener('click', function () { HL.set('hl.plan', null); saved = null; step = 1; draw(); });
  }
})();
