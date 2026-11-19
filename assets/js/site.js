/* Healthy.Life — behaviour shared by every page. No dependencies. */
(function () {
  'use strict';
  var doc = document, root = doc.documentElement;
  var CFG = window.HL_CONFIG || {};
  var HL = window.HL = { root: root.getAttribute('data-root') || '' };

  /* ---------- small helpers ---------- */
  var memory = {};
  HL.get = function (key, fallback) {
    try {
      var raw = localStorage.getItem(key);
      return raw === null ? fallback : JSON.parse(raw);
    } catch (e) { return key in memory ? memory[key] : fallback; }
  };
  HL.set = function (key, value) {
    memory[key] = value;
    try { localStorage.setItem(key, JSON.stringify(value)); } catch (e) { /* private mode: keep in memory */ }
  };
  HL.$ = function (sel, scope) { return (scope || doc).querySelector(sel); };
  HL.$$ = function (sel, scope) { return Array.prototype.slice.call((scope || doc).querySelectorAll(sel)); };
  HL.el = function (tag, attrs, children) {
    var node = doc.createElement(tag), k;
    for (k in attrs || {}) {
      if (k === 'text') node.textContent = attrs[k];
      else if (k === 'html') node.innerHTML = attrs[k];
      else if (attrs[k] !== false && attrs[k] != null) node.setAttribute(k, attrs[k]);
    }
    (children || []).forEach(function (c) { if (c) node.appendChild(typeof c === 'string' ? doc.createTextNode(c) : c); });
    return node;
  };
  HL.esc = function (s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  };
  HL.fmt = function (n, digits) {
    if (n == null || isNaN(n)) return '–';
    return Number(n).toLocaleString('en-US', { minimumFractionDigits: digits || 0, maximumFractionDigits: digits || 0 });
  };
  HL.json = function (name) {
    return fetch(HL.root + 'assets/data/' + name).then(function (r) {
      if (!r.ok) throw new Error(name);
      return r.json();
    });
  };
  HL.params = new URLSearchParams(location.search);
  HL.profile = function (patch) {
    var p = HL.get('hl.profile', { units: 'metric' });
    if (patch) {
      Object.keys(patch).forEach(function (k) { p[k] = patch[k]; });
      HL.set('hl.profile', p);
    }
    return p;
  };
  HL.dayOfYear = function (d) {
    d = d || new Date();
    return Math.floor((Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()) - Date.UTC(d.getFullYear(), 0, 0)) / 864e5);
  };
  var MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  HL.niceDate = function (d) { return d.getDate() + ' ' + MONTHS[d.getMonth()] + ' ' + d.getFullYear(); };

  /* ---------- tape gauge: used by tools, the score and the home page ---------- */
  var RANGE = { low: 'var(--r-low)', good: 'var(--r-good)', watch: 'var(--r-watch)', high: 'var(--r-high)', alert: 'var(--r-alert)' };
  HL.rangeColor = function (key) { return RANGE[key] || key; };
  /* spec: {min, max, value, bands:[{to, c, label}], marks:[numbers], text} */
  HL.tape = function (spec) {
    var span = spec.max - spec.min, from = spec.min, bands = '', key = '';
    spec.bands.forEach(function (b) {
      var to = Math.min(b.to, spec.max);
      bands += '<i style="flex:' + Math.max(to - from, 0) + ';background:' + HL.rangeColor(b.c) + '"></i>';
      if (b.label) key += '<li><i style="background:' + HL.rangeColor(b.c) + '"></i>' + HL.esc(b.label) + '</li>';
      from = to;
    });
    var pos = Math.max(0, Math.min(100, (spec.value - spec.min) / span * 100));
    var marks = (spec.marks || [spec.min, spec.max]).map(function (m) {
      return '<span style="left:' + ((m - spec.min) / span * 100) + '%">' + m + '</span>';
    }).join('');
    return '<div class="tape" style="--pos:' + pos.toFixed(1) + '%" role="img" aria-label="' + HL.esc(spec.aria || ('Scale from ' + spec.min + ' to ' + spec.max + ', your value ' + spec.text)) + '">' +
      '<div class="tape-marker"><b>' + HL.esc(spec.text) + '</b></div>' +
      '<div class="tape-bands">' + bands + '</div><div class="tape-ticks"></div>' +
      '<div class="tape-labels">' + marks + '</div></div>' +
      (key && spec.key !== false ? '<ul class="band-key">' + key + '</ul>' : '');
  };

  /* ---------- sending forms (the inbox is decoded only here) ---------- */
  function inbox() {
    return (CFG.inbox || []).map(function (n) { return String.fromCharCode(n ^ CFG.inboxKey); }).join('');
  }
  function context() {
    return {
      'Sent from': location.pathname.split('/').slice(-2).join('/') || 'home',
      'Arrived via': HL.get('hl.source', 'direct'),
      'Sent at': new Date().toISOString()
    };
  }
  HL.send = function (subject, data) {
    var payload = { _subject: '[Healthy.Life] ' + subject, _template: 'table', _captcha: 'false' };
    Object.keys(data).forEach(function (k) { payload[k] = data[k]; });
    var extra = context();
    Object.keys(extra).forEach(function (k) { payload[k] = extra[k]; });
    return fetch(CFG.formEndpoint + inbox(), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
      body: JSON.stringify(payload)
    }).then(function (r) {
      if (!r.ok) throw new Error('send failed');
      return true;
    }).catch(function () {
      /* Network or CORS trouble: post the same fields as an ordinary form instead. */
      var form = HL.el('form', { method: 'POST', action: CFG.formFallback + inbox(), style: 'display:none' });
      payload._next = new URL(HL.root + 'thank-you.html', location.href).href;
      Object.keys(payload).forEach(function (k) {
        form.appendChild(HL.el('input', { type: 'hidden', name: k, value: payload[k] }));
      });
      doc.body.appendChild(form);
      form.submit();
      return true;
    });
  };
  HL.readForm = function (form) {
    var out = {};
    new FormData(form).forEach(function (value, key) {
      if (key.charAt(0) === '_' || value === '') return;
      out[key] = key in out ? out[key] + ', ' + value : value;
    });
    return out;
  };
  function wireForms() {
    HL.$$('form[data-form]').forEach(function (form) {
      var status = HL.$('.form-status', form) || form.appendChild(HL.el('p', { 'class': 'form-status', role: 'status' }));
      form.appendChild(HL.el('div', { 'class': 'hp', 'aria-hidden': 'true', html: '<label>Leave this empty<input type="text" name="_honey" tabindex="-1" autocomplete="off"></label>' }));
      form.addEventListener('submit', function (ev) {
        ev.preventDefault();
        if (form.querySelector('[name="_honey"]').value) return;
        if (!form.checkValidity()) { form.reportValidity(); return; }
        var button = form.querySelector('[type="submit"]');
        var data = HL.readForm(form);
        if (typeof form.hlExtra === 'function') {
          var extra = form.hlExtra();
          Object.keys(extra).forEach(function (k) { data[k] = extra[k]; });
        }
        button.disabled = true;
        status.className = 'form-status';
        status.textContent = 'Sending…';
        HL.send(form.getAttribute('data-subject') || form.getAttribute('data-form'), data).then(function () {
          status.className = 'form-status ok';
          status.textContent = form.getAttribute('data-done') || 'Sent. Thank you, we read every message.';
          form.reset();
          button.disabled = false;
          form.dispatchEvent(new CustomEvent('hl:sent', { detail: data }));
        });
      });
    });
  }

  /* ---------- page furniture ---------- */
  function wireHeader() {
    var btn = HL.$('.menu-btn'), nav = HL.$('#site-nav');
    if (btn && nav) btn.addEventListener('click', function () {
      var open = nav.hasAttribute('data-open');
      if (open) nav.removeAttribute('data-open'); else nav.setAttribute('data-open', '');
      btn.setAttribute('aria-expanded', String(!open));
    });
    var toggle = HL.$('[data-theme-toggle]');
    if (toggle) toggle.addEventListener('click', function () {
      var dark = root.dataset.theme === 'dark' ||
        (!root.dataset.theme && window.matchMedia('(prefers-color-scheme: dark)').matches);
      root.dataset.theme = dark ? 'light' : 'dark';
      try { localStorage.setItem('hl.theme', root.dataset.theme); } catch (e) { /* ignore */ }
    });
    HL.$$('[data-year]').forEach(function (n) { n.textContent = new Date().getFullYear(); });
  }
  function rememberSource() {
    if (HL.get('hl.source')) return;
    var utm = ['utm_source', 'utm_medium', 'utm_campaign'].map(function (k) { return HL.params.get(k); }).filter(Boolean).join(' / ');
    var ref = '';
    try { ref = doc.referrer && new URL(doc.referrer).host !== location.host ? new URL(doc.referrer).host : ''; } catch (e) { /* ignore */ }
    HL.set('hl.source', utm || ref || 'direct');
  }
  function wireBars() {
    var cookie = HL.$('[data-cookie]');
    if (cookie && CFG.cookieNotice && !HL.get('hl.cookie-ok')) {
      setTimeout(function () {
        if (typeof window.__tcfapi === 'function') return;   // Google's consent message is handling it
        cookie.hidden = false;
      }, 1800);
      HL.$('[data-cookie-ok]', cookie).addEventListener('click', function () {
        HL.set('hl.cookie-ok', 1);
        cookie.hidden = true;
      });
    }
    var bar = HL.$('[data-cta-bar]');
    var quiet = /score|plan|thank-you|contact|support|contests|careers|pros|teams|advertise/.test(location.pathname);
    if (bar && CFG.stickyCta && !quiet && !sessionStorage.getItem('hl.cta-off') && !HL.get('hl.score')) {
      var onScroll = function () {
        var max = doc.documentElement.scrollHeight - innerHeight;
        if (max > 600 && scrollY / max > 0.35 && (cookie ? cookie.hidden : true)) {
          bar.hidden = false;
          removeEventListener('scroll', onScroll);
        }
      };
      addEventListener('scroll', onScroll, { passive: true });
      HL.$('[data-cta-close]', bar).addEventListener('click', function () {
        bar.hidden = true;
        try { sessionStorage.setItem('hl.cta-off', '1'); } catch (e) { /* ignore */ }
      });
    }
  }
  function wireAds() {
    var slots = CFG.adSlots || {};
    HL.$$('.ad[data-ad]').forEach(function (box) {
      var id = slots[box.getAttribute('data-ad')];
      if (!id) return;
      box.classList.add('is-live');
      box.appendChild(HL.el('ins', {
        'class': 'adsbygoogle', style: 'display:block', 'data-ad-client': CFG.adClient,
        'data-ad-slot': id, 'data-ad-format': 'auto', 'data-full-width-responsive': 'true'
      }));
      try { (window.adsbygoogle = window.adsbygoogle || []).push({}); } catch (e) { /* ad blocker */ }
    });
  }
  function wireVideos() {
    doc.addEventListener('click', function (ev) {
      var btn = ev.target.closest && ev.target.closest('.video-play');
      if (!btn) return;
      var frame = HL.el('iframe', {
        src: 'https://www.youtube-nocookie.com/embed/' + encodeURIComponent(btn.getAttribute('data-video')) + '?autoplay=1&rel=0',
        title: btn.getAttribute('aria-label').replace(/^Play: /, ''), allowfullscreen: '',
        allow: 'accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture', loading: 'lazy'
      });
      btn.parentNode.replaceChild(frame, btn);
    });
  }
  function wireFilters() {
    HL.$$('[data-filter-for]').forEach(function (row) {
      var list = doc.getElementById(row.getAttribute('data-filter-for'));
      if (!list) return;
      row.addEventListener('click', function (ev) {
        var chip = ev.target.closest('.chip');
        if (!chip) return;
        var want = chip.getAttribute('data-value');
        HL.$$('.chip', row).forEach(function (c) { c.setAttribute('aria-pressed', String(c === chip)); });
        HL.$$('[data-pillar]', list).forEach(function (item) {
          item.hidden = want !== 'all' && item.getAttribute('data-pillar') !== want;
        });
      });
    });
  }
  function wireToday() {
    var box = HL.$('[data-today]');
    if (!box) return;
    var now = new Date(), m = now.getMonth() + 1, d = now.getDate();
    Promise.all([HL.json('tips.json'), HL.json('observances.json')]).then(function (res) {
      var tips = res[0], obs = res[1];
      var tip = tips[HL.dayOfYear(now) % tips.length];
      var today = obs.filter(function (o) { return o.m === m && o.d === d && !o.to; })[0];
      var week = obs.filter(function (o) { return o.m === m && o.to && d >= o.d && d <= o.to; })[0];
      var month = obs.filter(function (o) { return o.m === m && !o.d; })[0];
      var html = '<p class="muted">' + HL.niceDate(now) + '</p>';
      if (today) html += '<p class="big">Today is ' + HL.esc(today.name) + '.</p>';
      else if (week) html += '<p class="big">This is ' + HL.esc(week.name) + '.</p>';
      else if (month) html += '<p class="big">This month is ' + HL.esc(month.name) + '.</p>';
      html += '<p><strong>Today\'s small step:</strong> ' + HL.esc(tip.tip) + ' ';
      if (tip.link) html += '<a href="' + HL.root + tip.link + '">' + HL.esc(tip.cta || 'Try it') + '</a>';
      box.innerHTML = html + '</p>';
    }).catch(function () { box.hidden = true; });
  }
  function wireContest() {
    var c = CFG.contest;
    if (!c) return;
    HL.$$('[data-contest]').forEach(function (n) {
      var key = n.getAttribute('data-contest');
      if (key === 'closesText') { var p = c.closes.slice(0, 10).split('-'); n.textContent = HL.niceDate(new Date(+p[0], +p[1] - 1, +p[2])); }
      else if (key === 'sponsor') { if (c.sponsor) n.textContent = 'Prize sponsor: ' + c.sponsor; else n.hidden = true; }
      else if (c[key]) n.textContent = c[key];
    });
    var end = new Date(c.closes).getTime(), open = Date.now() < end;
    HL.$$('[data-contest-open]').forEach(function (n) { n.hidden = !open; });
    HL.$$('[data-contest-closed]').forEach(function (n) { n.hidden = open; });
    var clock = HL.$('[data-countdown]');
    if (!clock || !open) return;
    var tick = function () {
      var left = Math.max(0, end - Date.now());
      var parts = [['days', Math.floor(left / 864e5)], ['hours', Math.floor(left / 36e5) % 24], ['minutes', Math.floor(left / 6e4) % 60]];
      clock.innerHTML = parts.map(function (p) { return '<div><b>' + p[1] + '</b><span>' + p[0] + '</span></div>'; }).join('');
    };
    tick();
    setInterval(tick, 30000);
  }
  function wireDonate() {
    var links = CFG.donate || {}, any = false;
    HL.$$('[data-donate]').forEach(function (a) {
      var url = links[a.getAttribute('data-donate')];
      if (url) { a.href = url; a.hidden = false; any = true; } else a.hidden = true;
    });
    HL.$$('[data-donate-none]').forEach(function (n) { n.hidden = any; });
    HL.$$('[data-donate-any]').forEach(function (n) { n.hidden = !any; });
  }
  function wireMisc() {
    HL.$$('[data-print]').forEach(function (b) { b.addEventListener('click', function () { window.print(); }); });
    if ('serviceWorker' in navigator && location.protocol === 'https:') {
      navigator.serviceWorker.register(HL.root + 'sw.js').catch(function () { /* offline support is optional */ });
    }
  }

  function start() {
    rememberSource();
    wireHeader();
    wireForms();
    wireBars();
    wireAds();
    wireVideos();
    wireFilters();
    wireToday();
    wireContest();
    wireDonate();
    wireMisc();
    doc.dispatchEvent(new Event('hl:ready'));
  }
  if (doc.readyState === 'loading') doc.addEventListener('DOMContentLoaded', start); else start();
})();
