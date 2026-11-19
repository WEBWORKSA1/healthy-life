/* Healthy.Life tools: one engine, one profile, 25 calculators.
   Every tool is a definition (fields + calc). The engine draws the form, keeps the shared
   profile in this browser, and renders results on a measuring tape. */
(function () {
  'use strict';
  var HL = window.HL, el = HL.el, fmt = HL.fmt, esc = HL.esc;
  var LB = 2.2046226218, IN = 2.54;

  /* ---------- formatting ---------- */
  function wt(kg, units) { return units === 'us' ? fmt(kg * LB) + ' lb' : fmt(kg, kg < 100 ? 1 : 0) + ' kg'; }
  function wtRange(a, b, units) { return units === 'us' ? fmt(a * LB) + '–' + fmt(b * LB) + ' lb' : fmt(a) + '–' + fmt(b) + ' kg'; }
  function len(cm, units) { return units === 'us' ? fmt(cm / IN, 1) + ' in' : fmt(cm) + ' cm'; }
  function vol(l, units) { return units === 'us' ? fmt(l * 33.814) + ' fl oz' : fmt(l, 1) + ' L'; }
  function clock(mins) {
    mins = ((Math.round(mins) % 1440) + 1440) % 1440;
    var h = Math.floor(mins / 60), m = mins % 60, ap = h < 12 ? 'am' : 'pm';
    return ((h + 11) % 12 + 1) + ':' + (m < 10 ? '0' : '') + m + ' ' + ap;
  }
  function toMin(t) { var p = String(t || '').split(':'); return p.length < 2 ? NaN : (+p[0]) * 60 + (+p[1]); }
  function hm(mins) { mins = Math.round(mins); var h = Math.floor(mins / 60), m = mins % 60; return (h ? h + ' h' : '') + (h && m ? ' ' : '') + (m || !h ? m + ' min' : ''); }
  function hms(sec) {
    sec = Math.round(sec);
    var h = Math.floor(sec / 3600), m = Math.floor(sec % 3600 / 60), s = sec % 60;
    return (h ? h + ':' + (m < 10 ? '0' : '') : '') + m + ':' + (s < 10 ? '0' : '') + s;
  }
  function addDays(d, n) { var x = new Date(d.getTime()); x.setDate(x.getDate() + n); return x; }
  function parseDate(s) { var p = String(s || '').split('-'); return p.length === 3 ? new Date(+p[0], +p[1] - 1, +p[2]) : null; }
  function rows(list) { return list.filter(Boolean); }

  /* ---------- shared maths ---------- */
  function bmi(v) { var h = v.heightCm / 100; return v.weightKg / (h * h); }
  function mifflin(v) { return 10 * v.weightKg + 6.25 * v.heightCm - 5 * v.age + (v.sex === 'male' ? 5 : -161); }
  function floorKcal(v) { return v.sex === 'male' ? 1500 : 1200; }
  function tanaka(age) { return 208 - 0.7 * age; }
  var ACTIVITY = [['1.2', 'Mostly sitting, little exercise'], ['1.375', 'Light: exercise 1 to 3 days a week'],
    ['1.55', 'Moderate: exercise 3 to 5 days a week'], ['1.725', 'Very active: hard exercise 6 to 7 days a week'],
    ['1.9', 'Extra active: physical job plus training']];
  var BMI_BANDS = [{ to: 18.5, c: 'low', label: 'Underweight' }, { to: 25, c: 'good', label: 'Healthy weight' },
    { to: 30, c: 'watch', label: 'Overweight' }, { to: 40, c: 'high', label: 'Obesity' }];
  function bmiBand(b) {
    return b < 18.5 ? ['Underweight', 'low'] : b < 25 ? ['Healthy weight', 'good'] : b < 30 ? ['Overweight', 'watch'] :
      b < 35 ? ['Obesity class 1', 'high'] : b < 40 ? ['Obesity class 2', 'alert'] : ['Obesity class 3', 'alert'];
  }
  function sleepNeed(age) { return age < 18 ? [8, 10] : age >= 65 ? [7, 8] : [7, 9]; }

  /* ---------- shared fields (profile fields are remembered across tools) ---------- */
  var F = {
    units: { type: 'seg', label: 'Units', options: [['metric', 'Metric'], ['us', 'US']], profile: 'units', wide: true },
    sex: { type: 'seg', label: 'Sex', options: [['female', 'Female'], ['male', 'Male']], profile: 'sex', help: 'The formulas use male and female reference data. Pick whichever fits your body best.' },
    age: { type: 'number', label: 'Age', unit: 'years', min: 18, max: 100, profile: 'age' },
    height: { type: 'height', label: 'Height', profile: 'heightCm', min: 120, max: 230 },
    weight: { type: 'weight', label: 'Weight', profile: 'weightKg', min: 30, max: 300 },
    waist: { type: 'length', label: 'Waist', profile: 'waistCm', min: 40, max: 200, help: 'Measure midway between your lowest rib and the top of your hip bone, after breathing out.' },
    neck: { type: 'length', label: 'Neck', profile: 'neckCm', min: 20, max: 70, help: 'Just below the Adam\'s apple, tape level.' },
    hip: { type: 'length', label: 'Hips', profile: 'hipCm', min: 50, max: 200, help: 'Around the widest part.', show: function (s) { return s.sex === 'female'; } },
    rhr: { type: 'number', label: 'Resting heart rate', unit: 'bpm', min: 30, max: 120, profile: 'rhr', optional: true, help: 'Optional. Count your pulse for 60 seconds after sitting quietly.' },
    activity: { type: 'select', label: 'Activity level', profile: 'activity', options: ACTIVITY, wide: true, fallback: '1.375' }
  };

  /* ---------- the 25 tools ---------- */
  var T = {};

  T['bmi-calculator'] = {
    fields: ['units', 'height', 'weight'],
    calc: function (v) {
      var b = bmi(v), band = bmiBand(b), h = v.heightCm / 100;
      var say = {
        low: 'A BMI under 18.5 is classed as underweight for adults. It suits some bodies, but mention it to a doctor, especially if your weight dropped without trying.',
        good: 'This sits in the range linked with the lowest health risk for most adults. BMI cannot see muscle or where fat sits, so pair it with your waist-to-height ratio.',
        watch: 'A BMI of 25 to 29.9 is classed as overweight. Muscular people land here too, so check your waist-to-height ratio before reading much into it.',
        high: 'A BMI of 30 or more is classed as obesity and is linked with higher risk of type 2 diabetes, heart disease and other conditions. A doctor can look at the whole picture with you.',
        alert: 'A BMI of 35 or more carries higher health risk. It is worth a conversation with a doctor, who can check blood pressure, blood sugar and other markers and talk through options.'
      };
      return {
        label: 'Your BMI', value: b.toFixed(1), tag: band, meaning: say[band[1]],
        tape: { min: 15, max: 40, value: b, text: b.toFixed(1), marks: [15, 18.5, 25, 30, 40], bands: BMI_BANDS },
        rows: [['Healthy weight for your height', wtRange(18.5 * h * h, 24.9 * h * h, v.units)],
          ['BMI Prime (your BMI divided by 25)', (b / 25).toFixed(2)]],
        save: ['BMI', b.toFixed(1)]
      };
    }
  };

  T['waist-to-height-ratio'] = {
    fields: ['units', 'height', 'waist'],
    calc: function (v) {
      var r = v.waistCm / v.heightCm;
      var band = r < 0.4 ? ['Below 0.4', 'low'] : r < 0.5 ? ['Healthy', 'good'] : r < 0.6 ? ['Increased risk', 'watch'] : ['High risk', 'alert'];
      var say = {
        low: 'A ratio under 0.4 is below the usual healthy band. If you are also underweight by BMI, mention it to a doctor.',
        good: 'Your waist is less than half your height, the band linked with lower risk of heart disease and type 2 diabetes.',
        watch: 'A ratio of 0.5 to 0.59 points to extra fat around the middle and a raised risk of heart disease and type 2 diabetes. Bringing your waist under half your height is a clear, measurable goal.',
        alert: 'A ratio of 0.6 or more points to a high level of fat around the middle. Talk to a doctor about checking blood pressure, blood sugar and cholesterol.'
      };
      return {
        label: 'Your waist-to-height ratio', value: r.toFixed(2), tag: band, meaning: say[band[1]],
        tape: { min: 0.3, max: 0.8, value: r, text: r.toFixed(2), marks: [0.3, 0.4, 0.5, 0.6, 0.8],
          bands: [{ to: 0.4, c: 'low', label: 'Below 0.4' }, { to: 0.5, c: 'good', label: 'Healthy 0.4 to 0.49' }, { to: 0.6, c: 'watch', label: 'Increased 0.5 to 0.59' }, { to: 0.8, c: 'alert', label: 'High 0.6+' }] },
        rows: [['Half your height', len(v.heightCm / 2, v.units)], ['Your waist', len(v.waistCm, v.units)]],
        save: ['Waist-to-height', r.toFixed(2)]
      };
    }
  };

  T['body-fat-calculator'] = {
    fields: ['units', 'sex', 'height', 'neck', 'waist', 'hip', { id: 'bfWeight', type: 'weight', label: 'Weight (optional)', profile: 'weightKg', min: 30, max: 300, optional: true }],
    calc: function (v) {
      var L = Math.log10 || function (x) { return Math.log(x) / Math.LN10; }, pct;
      if (v.sex === 'male') {
        if (v.waistCm <= v.neckCm) return { error: 'Waist must be larger than neck. Check your measurements.' };
        pct = 495 / (1.0324 - 0.19077 * L(v.waistCm - v.neckCm) + 0.15456 * L(v.heightCm)) - 450;
      } else {
        if (!v.hipCm) return null;
        if (v.waistCm + v.hipCm <= v.neckCm) return { error: 'Check your measurements.' };
        pct = 495 / (1.29579 - 0.35004 * L(v.waistCm + v.hipCm - v.neckCm) + 0.22100 * L(v.heightCm)) - 450;
      }
      if (!(pct > 2 && pct < 65)) return { error: 'Those measurements give an impossible result. Re-measure and try again.' };
      var cut = v.sex === 'male' ? [6, 14, 18, 25] : [14, 21, 25, 32];
      var names = ['Essential fat', 'Athletes', 'Fitness', 'Average', 'Above average'];
      var idx = pct < cut[0] ? 0 : pct < cut[1] ? 1 : pct < cut[2] ? 2 : pct < cut[3] ? 3 : 4;
      var out = {
        label: 'Estimated body fat', value: pct.toFixed(1), unit: '%', tag: [names[idx], ['low', 'good', 'good', 'watch', 'high'][idx]],
        meaning: 'This is the U.S. Navy circumference estimate. Expect it to be within about 3 to 4 percentage points of a lab measurement for most people. Categories follow the American Council on Exercise chart.',
        tape: { min: 5, max: 50, value: pct, text: pct.toFixed(1) + '%', marks: [5, cut[0], cut[1], cut[2], cut[3], 50],
          bands: [{ to: cut[0], c: 'low', label: 'Essential' }, { to: cut[2], c: 'good', label: 'Athletes and fitness' }, { to: cut[3], c: 'watch', label: 'Average' }, { to: 50, c: 'high', label: 'Above average' }] },
        rows: [], save: ['Body fat', pct.toFixed(1) + '%']
      };
      if (v.weightKg) {
        out.rows.push(['Fat mass', wt(v.weightKg * pct / 100, v.units)]);
        out.rows.push(['Lean mass', wt(v.weightKg * (1 - pct / 100), v.units)]);
      }
      return out;
    }
  };

  T['healthy-weight-range'] = {
    fields: ['units', 'height', { id: 'hwWeight', type: 'weight', label: 'Current weight (optional)', profile: 'weightKg', min: 30, max: 300, optional: true }],
    calc: function (v) {
      var h = v.heightCm / 100, lo = 18.5 * h * h, hi = 24.9 * h * h;
      var out = {
        label: 'Healthy weight for your height', value: wtRange(lo, hi, v.units),
        meaning: 'This is the weight span that gives a BMI of 18.5 to 24.9, the band the WHO and CDC class as healthy for adults. Where you feel and function best inside (or near) it depends on your build, muscle and age.',
        rows: [['Lower end (BMI 18.5)', wt(lo, v.units)], ['Middle (BMI 21.7)', wt(21.7 * h * h, v.units)], ['Upper end (BMI 24.9)', wt(hi, v.units)]],
        save: ['Healthy weight', wtRange(lo, hi, v.units)]
      };
      if (v.weightKg) {
        var f = v.units === 'us' ? LB : 1;
        out.tape = { min: Math.round(15 * h * h * f), max: Math.round(40 * h * h * f), value: v.weightKg * f, text: wt(v.weightKg, v.units),
          marks: [Math.round(15 * h * h * f), Math.round(lo * f), Math.round(hi * f), Math.round(30 * h * h * f), Math.round(40 * h * h * f)],
          bands: [{ to: lo * f, c: 'low', label: 'Under' }, { to: hi * f, c: 'good', label: 'Healthy range' }, { to: 30 * h * h * f, c: 'watch', label: 'Over' }, { to: 40 * h * h * f, c: 'high', label: 'Well over' }] };
        var gap = v.weightKg > hi ? wt(v.weightKg - hi, v.units) + ' above the range' : v.weightKg < lo ? wt(lo - v.weightKg, v.units) + ' below the range' : 'inside the range';
        out.rows.push(['You are', gap, true]);
      }
      return out;
    }
  };

  T['bmr-calculator'] = {
    fields: ['units', 'sex', 'age', 'height', 'weight'],
    calc: function (v) {
      var m = mifflin(v);
      var hb = v.sex === 'male' ? 88.362 + 13.397 * v.weightKg + 4.799 * v.heightCm - 5.677 * v.age
        : 447.593 + 9.247 * v.weightKg + 3.098 * v.heightCm - 4.330 * v.age;
      return {
        label: 'Your basal metabolic rate', value: fmt(m), unit: 'kcal a day',
        meaning: 'This is roughly what your body burns at complete rest to keep you alive: breathing, circulation, repair. It is the floor under your daily needs, not an eating target. Real-world needs are higher. See the daily calorie calculator.',
        rows: [['Per hour at rest', fmt(m / 24) + ' kcal'], ['Mifflin-St Jeor (used above)', fmt(m) + ' kcal'], ['Revised Harris-Benedict, for comparison', fmt(hb) + ' kcal']],
        save: ['BMR', fmt(m) + ' kcal']
      };
    }
  };

  T['tdee-calculator'] = {
    fields: ['units', 'sex', 'age', 'height', 'weight', 'activity'],
    calc: function (v) {
      var m = mifflin(v), chosen = parseFloat(v.activity), total = m * chosen;
      return {
        label: 'Calories to hold your weight', value: fmt(Math.round(total / 10) * 10), unit: 'kcal a day',
        meaning: 'This is your estimated total daily energy expenditure: resting needs multiplied by an activity factor. Treat it as a starting point and adjust after two to three weeks of watching your weight trend. Most people overrate their activity level, so if in doubt pick the lower one.',
        rows: ACTIVITY.map(function (a) { return [a[1], fmt(Math.round(m * a[0] / 10) * 10) + ' kcal', a[0] === v.activity]; })
          .concat([['Resting needs (BMR)', fmt(m) + ' kcal']]),
        save: ['Maintenance calories', fmt(Math.round(total / 10) * 10) + ' kcal']
      };
    }
  };

  var MACRO_STYLES = { balanced: [25, 45, 30], protein: [30, 40, 30], lowcarb: [30, 30, 40], endurance: [20, 55, 25] };
  T['macro-calculator'] = {
    fields: ['units', 'sex', 'age', 'height', 'weight', 'activity',
      { id: 'goal', type: 'select', label: 'Goal', options: [['1', 'Hold my weight'], ['0.85', 'Lose slowly (15% under)'], ['1.1', 'Gain slowly (10% over)']], fallback: '1' },
      { id: 'style', type: 'select', label: 'Eating style', options: [['balanced', 'Balanced'], ['protein', 'Higher protein'], ['lowcarb', 'Lower carb'], ['endurance', 'Endurance, higher carb']], fallback: 'balanced' }],
    calc: function (v) {
      var kcal = mifflin(v) * parseFloat(v.activity) * parseFloat(v.goal), note = '';
      if (kcal < floorKcal(v)) { kcal = floorKcal(v); note = ' Your target was raised to ' + fmt(kcal) + ' kcal, the lowest level we show without medical supervision.'; }
      kcal = Math.round(kcal / 10) * 10;
      var s = MACRO_STYLES[v.style], p = kcal * s[0] / 400, c = kcal * s[1] / 400, f = kcal * s[2] / 900;
      var bar = '<div class="tape" style="margin-top:1rem"><div class="tape-bands" style="height:1.1rem"><i style="flex:' + s[0] + ';background:var(--p-prevent)"></i><i style="flex:' + s[1] + ';background:var(--r-watch)"></i><i style="flex:' + s[2] + ';background:var(--p-mind)"></i></div></div>' +
        '<ul class="band-key"><li><i style="background:var(--p-prevent)"></i>Protein ' + s[0] + '%</li><li><i style="background:var(--r-watch)"></i>Carbohydrate ' + s[1] + '%</li><li><i style="background:var(--p-mind)"></i>Fat ' + s[2] + '%</li></ul>';
      return {
        label: 'Your daily target', value: fmt(kcal), unit: 'kcal', html: bar,
        meaning: 'Grams come from splitting your calories by percentage: protein and carbohydrate give 4 kcal per gram, fat gives 9.' + note,
        rows: [['Protein', fmt(p) + ' g (' + (p / v.weightKg).toFixed(1) + ' g per kg)'], ['Carbohydrate', fmt(c) + ' g'], ['Fat', fmt(f) + ' g'], ['Fibre to aim for', fmt(kcal / 1000 * 14) + ' g']],
        save: ['Macros', fmt(p) + 'P / ' + fmt(c) + 'C / ' + fmt(f) + 'F g']
      };
    }
  };

  T['protein-calculator'] = {
    fields: ['units', 'weight', { id: 'pgoal', type: 'select', label: 'What describes you', wide: true, fallback: 'general',
      options: [['general', 'General health'], ['muscle', 'Building muscle with strength training'], ['older', 'Aged 65 or over'], ['endurance', 'Regular endurance training']] }],
    calc: function (v) {
      var r = { general: [1.2, 1.6], muscle: [1.6, 2.2], older: [1.2, 1.6], endurance: [1.4, 1.8] }[v.pgoal];
      var lo = v.weightKg * r[0], hi = v.weightKg * r[1];
      return {
        label: 'Daily protein to aim for', value: fmt(lo) + '–' + fmt(hi), unit: 'g',
        meaning: 'That is ' + r[0] + ' to ' + r[1] + ' g per kg of body weight. The 2025–2030 U.S. Dietary Guidelines suggest 1.2 to 1.6 g per kg for adults; the long-standing minimum (RDA) is 0.8 g per kg. Spreading protein across meals works better than one large serving.',
        rows: [['Minimum to avoid deficiency (0.8 g/kg)', fmt(v.weightKg * 0.8) + ' g'], ['Per meal, over three meals', fmt(lo / 3) + '–' + fmt(hi / 3) + ' g']],
        save: ['Protein', fmt(lo) + '–' + fmt(hi) + ' g']
      };
    }
  };

  T['water-intake-calculator'] = {
    fields: ['units', 'sex',
      { id: 'wstatus', type: 'select', label: 'Pregnant or breastfeeding', options: [['no', 'No'], ['preg', 'Pregnant'], ['bf', 'Breastfeeding']], fallback: 'no', show: function (s) { return s.sex === 'female'; } },
      { id: 'exercise', type: 'number', label: 'Exercise on a typical day', unit: 'min', min: 0, max: 600, fallback: 30 },
      { id: 'climate', type: 'seg', label: 'Weather', options: [['mild', 'Mild'], ['hot', 'Hot or humid']], fallback: 'mild' }],
    calc: function (v) {
      var total = v.sex === 'male' ? 3.7 : 2.7, drinks = v.sex === 'male' ? 3.0 : 2.2;
      if (v.sex === 'female' && v.wstatus === 'preg') { total = 3.0; drinks = 2.3; }
      if (v.sex === 'female' && v.wstatus === 'bf') { total = 3.8; drinks = 3.1; }
      var ex = (v.exercise || 0) / 60 * 0.6, heat = v.climate === 'hot' ? 0.5 : 0, need = drinks + ex + heat;
      var glasses = need / 0.25;
      return {
        label: 'Drinks to aim for each day', value: v.units === 'us' ? fmt(need * 33.814) : need.toFixed(1), unit: v.units === 'us' ? 'fl oz' : 'litres',
        meaning: 'The baseline is the U.S. National Academies adequate intake. About a fifth of your water comes from food, so the drinks figure is lower than total water. All drinks count, including tea and coffee. Pale-yellow urine is a good sign you are getting enough.',
        rows: rows([['In 250 ml (8 oz) glasses', fmt(glasses) + ' glasses'], ['One glass about every', Math.round(16 * 60 / glasses / 5) * 5 + ' minutes while awake'],
          ['Baseline from drinks', vol(drinks, v.units)], ex ? ['Added for exercise', vol(ex, v.units)] : null, heat ? ['Added for heat', vol(heat, v.units)] : null,
          ['Total water including food', vol(total + ex + heat, v.units)]]),
        save: ['Water from drinks', vol(need, v.units)]
      };
    }
  };

  var METS = [['3.5', 'Walking, moderate pace (4.8 km/h, 3 mph)'], ['4.3', 'Walking, brisk (5.6 km/h, 3.5 mph)'], ['6.0', 'Hiking'], ['8.3', 'Running, 8 km/h (5 mph)'],
    ['9.8', 'Running, 9.7 km/h (6 mph)'], ['11.5', 'Running, 11.3 km/h (7 mph)'], ['4.0', 'Cycling, easy (under 16 km/h)'], ['8.0', 'Cycling, moderate (19 to 22 km/h)'],
    ['5.8', 'Swimming laps, moderate'], ['3.5', 'Strength training, general'], ['6.0', 'Strength training, vigorous'], ['8.0', 'Circuit or interval training'],
    ['2.5', 'Yoga, gentle'], ['3.0', 'Pilates or tai chi'], ['5.0', 'Dancing'], ['7.3', 'Aerobics class'], ['5.0', 'Elliptical trainer'], ['7.0', 'Rowing machine, moderate'],
    ['8.8', 'Climbing stairs'], ['11.8', 'Skipping rope'], ['4.1', 'Pickleball'], ['7.3', 'Tennis, singles'], ['6.5', 'Basketball'], ['7.0', 'Football (soccer), casual'],
    ['4.3', 'Golf, walking'], ['3.8', 'Gardening'], ['3.3', 'Housework'], ['1.3', 'Sitting quietly']];
  T['calories-burned-calculator'] = {
    fields: ['units', 'weight', { id: 'met', type: 'select', label: 'Activity', options: METS, wide: true, fallback: '3.5', byLabel: true },
      { id: 'minutes', type: 'number', label: 'Duration', unit: 'min', min: 1, max: 600, fallback: 30 }],
    calc: function (v) {
      var met = parseFloat(v.met), kcal = met * v.weightKg * v.minutes / 60;
      return {
        label: 'Energy used', value: fmt(kcal), unit: 'kcal',
        meaning: 'Calculated as MET × body weight in kg × hours, using values from the Compendium of Physical Activities. This is the gross figure: it includes the roughly ' + fmt(1 * v.weightKg * v.minutes / 60) + ' kcal you would have burned sitting still for the same time.',
        rows: [['Intensity', met.toFixed(1) + ' MET (' + (met < 3 ? 'light' : met < 6 ? 'moderate' : 'vigorous') + ')'], ['Per hour at this effort', fmt(met * v.weightKg) + ' kcal'],
          ['Counts towards your weekly 150 minutes', met >= 3 ? (met >= 6 ? fmt(v.minutes * 2) + ' min (vigorous counts double)' : fmt(v.minutes) + ' min') : 'No, too light']],
        save: null
      };
    }
  };

  T['weight-goal-planner'] = {
    fields: ['units', 'sex', 'age', 'height', 'weight', 'activity',
      { id: 'goalKg', type: 'weight', label: 'Goal weight', min: 30, max: 300 },
      { id: 'pace', type: 'select', label: 'Pace', options: [['0.25', 'Gentle: 0.25 kg (0.5 lb) a week'], ['0.5', 'Steady: 0.5 kg (1 lb) a week'], ['0.75', 'Faster: 0.75 kg (1.5 lb) a week']], fallback: '0.5' }],
    calc: function (v) {
      var h = v.heightCm / 100, lo = 18.5 * h * h, hi = 24.9 * h * h, goalBmi = v.goalKg / (h * h);
      if (goalBmi < 18.5) return { error: 'That goal would put your BMI under 18.5, which is classed as underweight. Choose a goal inside your healthy range: ' + wtRange(lo, hi, v.units) + '.' };
      var diff = v.goalKg - v.weightKg, tdee = mifflin(v) * parseFloat(v.activity);
      if (Math.abs(diff) < 0.5) return { label: 'You are at your goal', value: fmt(Math.round(tdee / 10) * 10), unit: 'kcal a day to stay there', meaning: 'Your goal is within half a kilo of your current weight. The number above is your estimated maintenance intake.', rows: [] };
      var losing = diff < 0, pace = parseFloat(v.pace), daily = pace * 7700 / 7, target = losing ? tdee - daily : tdee + daily, note = '';
      if (losing && target < floorKcal(v)) {
        target = floorKcal(v);
        pace = (tdee - target) * 7 / 7700;
        if (pace < 0.05) return { error: 'Your estimated needs are already close to the lowest intake we show (' + fmt(floorKcal(v)) + ' kcal). A dietitian or doctor can set a safe plan with you.' };
        note = ' We slowed the pace so that intake stays at or above ' + fmt(floorKcal(v)) + ' kcal a day.';
      }
      var weeks = Math.abs(diff) / pace, when = addDays(new Date(), Math.round(weeks * 7));
      var out = {
        label: 'Daily calories for this plan', value: fmt(Math.round(target / 10) * 10), unit: 'kcal',
        meaning: 'Based on the rule of thumb that a kilo of body weight is about 7,700 kcal. Real bodies adapt, so progress usually slows over time. Re-run this every few weeks with your new weight.' + note,
        rows: [['Maintenance now', fmt(Math.round(tdee / 10) * 10) + ' kcal'], [losing ? 'Daily deficit' : 'Daily surplus', fmt(Math.abs(tdee - target)) + ' kcal'],
          ['Pace', pace.toFixed(2) + ' kg (' + (pace * LB).toFixed(1) + ' lb) a week'], ['Time to goal', fmt(weeks) + ' weeks'], ['Estimated date', HL.niceDate(when)],
          ['Protein to protect muscle', fmt(v.weightKg * 1.2) + '–' + fmt(v.weightKg * 1.6) + ' g a day']],
        save: ['Goal calories', fmt(Math.round(target / 10) * 10) + ' kcal']
      };
      if (pace / v.weightKg > 0.01) out.alert = ['That pace is over 1% of your body weight a week', 'Faster loss tends to cost muscle and is harder to keep. Consider the steady or gentle pace.'];
      return out;
    }
  };

  var ZONES = [['Zone 1', 'Very light: warm-up, recovery', 0.5, 0.6, 'low'], ['Zone 2', 'Light: easy, can hold a conversation', 0.6, 0.7, 'good'],
    ['Zone 3', 'Moderate: steady, talking in short sentences', 0.7, 0.8, 'watch'], ['Zone 4', 'Hard: threshold, a few words at a time', 0.8, 0.9, 'high'], ['Zone 5', 'Maximum: short intervals only', 0.9, 1, 'alert']];
  function zoneTable(max, rest) {
    return ZONES.map(function (z) {
      var a = rest ? rest + (max - rest) * z[2] : max * z[2], b = rest ? rest + (max - rest) * z[3] : max * z[3];
      return [z[0] + ': ' + z[1].charAt(0).toLowerCase() + z[1].slice(1), Math.round(a) + '–' + Math.round(b) + ' bpm'];
    });
  }
  T['heart-rate-zones'] = {
    fields: ['age', 'rhr', { id: 'hrf', type: 'seg', label: 'Maximum heart rate formula', options: [['tanaka', '208 − 0.7 × age'], ['fox', '220 − age']], fallback: 'tanaka', wide: true },
      { id: 'maxhr', type: 'number', label: 'Known maximum (optional)', unit: 'bpm', min: 100, max: 230, optional: true, help: 'From a lab or field test. Overrides the formula.' }],
    calc: function (v) {
      var max = v.maxhr || (v.hrf === 'fox' ? 220 - v.age : tanaka(v.age));
      if (v.rhr && v.rhr >= max) return { error: 'Resting heart rate must be lower than maximum heart rate.' };
      var z = zoneTable(max, v.rhr), z2 = z[1][1];
      return {
        label: 'Estimated maximum heart rate', value: fmt(max), unit: 'bpm',
        meaning: (v.rhr ? 'Zones use the Karvonen (heart-rate reserve) method, because you entered a resting heart rate.' : 'Zones are simple percentages of maximum. Add your resting heart rate for a more personal result.') +
          ' Age formulas can be off by 10 beats or more for an individual, so treat zones as guides and let breathing and effort confirm them.',
        rows: z.concat([['Moderate intensity for the weekly 150 minutes (50–70% of max)', Math.round(max * 0.5) + '–' + Math.round(max * 0.7) + ' bpm'],
          ['Vigorous intensity (70–85% of max)', Math.round(max * 0.7) + '–' + Math.round(max * 0.85) + ' bpm']]),
        save: ['Zone 2 heart rate', z2]
      };
    }
  };

  var WALK = { slow: [3.2, 2.8, 'Slow stroll'], avg: [4.8, 3.5, 'Average pace'], brisk: [5.6, 4.3, 'Brisk'] };
  T['steps-calculator'] = {
    fields: ['units', 'height', { id: 'stWeight', type: 'weight', label: 'Weight (optional)', profile: 'weightKg', min: 30, max: 300, optional: true },
      { id: 'steps', type: 'number', label: 'Steps', unit: 'steps', min: 100, max: 100000, fallback: 7000, step: 100 },
      { id: 'walk', type: 'seg', label: 'Pace', options: [['slow', 'Slow'], ['avg', 'Average'], ['brisk', 'Brisk']], fallback: 'avg' }],
    calc: function (v) {
      var stride = v.heightCm * 0.414 / 100, km = v.steps * stride / 1000, w = WALK[v.walk], mins = km / w[0] * 60;
      return {
        label: 'Distance', value: v.units === 'us' ? (km * 0.621371).toFixed(2) : km.toFixed(2), unit: v.units === 'us' ? 'miles' : 'km',
        meaning: 'Stride length is estimated at 41.4% of your height, a common figure for walking. Running strides are longer, so runners cover more ground per step.',
        rows: rows([['Walking time at this pace', hm(mins)], v.weightKg ? ['Energy used', fmt(w[1] * v.weightKg * mins / 60) + ' kcal'] : null,
          ['Your estimated stride', len(stride * 100, v.units)], ['Steps per ' + (v.units === 'us' ? 'mile' : 'kilometre'), fmt((v.units === 'us' ? 1609.34 : 1000) / stride)],
          ['Counts towards weekly activity', v.walk === 'slow' ? 'Light movement (still worth it)' : fmt(mins) + ' moderate minutes']]),
        save: null
      };
    }
  };

  var RACES = [['5', '5K'], ['10', '10K'], ['21.0975', 'Half marathon'], ['42.195', 'Marathon'], ['1.609344', '1 mile'], ['custom', 'Other distance']];
  T['pace-calculator'] = {
    fields: [{ id: 'race', type: 'select', label: 'Distance', options: RACES, fallback: '5' },
      { id: 'dist', type: 'number', label: 'Distance in km', unit: 'km', min: 0.1, max: 500, step: 0.1, show: function (s) { return s.race === 'custom'; } },
      { id: 'time', type: 'duration', label: 'Time taken', wide: true }],
    calc: function (v) {
      var km = v.race === 'custom' ? v.dist : parseFloat(v.race);
      if (!km || !v.time) return null;
      var perKm = v.time / km, kmh = km / (v.time / 3600);
      var predict = RACES.filter(function (r) { return r[0] !== 'custom' && Math.abs(parseFloat(r[0]) - km) > 0.01; }).map(function (r) {
        return ['Predicted ' + r[1], hms(v.time * Math.pow(parseFloat(r[0]) / km, 1.06))];
      });
      return {
        label: 'Your pace', value: hms(perKm), unit: 'per km',
        meaning: 'Predictions use Riegel\'s formula, which assumes you slow by about 6% each time the distance doubles. They suit trained runners over similar terrain; first-time marathon times usually come in slower.',
        rows: [['Pace per mile', hms(perKm * 1.609344)], ['Speed', kmh.toFixed(1) + ' km/h (' + (kmh * 0.621371).toFixed(1) + ' mph)']].concat(predict),
        save: null
      };
    }
  };

  T['one-rep-max-calculator'] = {
    fields: ['units', { id: 'liftKg', type: 'weight', label: 'Weight lifted', min: 1, max: 600 }, { id: 'reps', type: 'number', label: 'Reps completed', unit: 'reps', min: 1, max: 12, fallback: 5 }],
    calc: function (v) {
      var epley = v.reps === 1 ? v.liftKg : v.liftKg * (1 + v.reps / 30), brz = v.liftKg * 36 / (37 - v.reps), one = (epley + brz) / 2;
      var pct = [[95, '2 reps'], [90, '4 reps'], [85, '6 reps'], [80, '8 reps'], [75, '10 reps'], [70, '12 reps'], [60, '15+ reps, technique work']];
      return {
        label: 'Estimated one-rep max', value: v.units === 'us' ? fmt(one * LB) : fmt(one, 1), unit: v.units === 'us' ? 'lb' : 'kg',
        meaning: 'The average of the Epley and Brzycki formulas. Estimates are most reliable from sets of 2 to 8 reps taken close to failure with good form. You do not need to test a true maximum to train well.',
        rows: [['Epley', wt(epley, v.units)], ['Brzycki', wt(brz, v.units)]].concat(pct.map(function (p) { return [p[0] + '% of max, about ' + p[1], wt(one * p[0] / 100, v.units)]; })),
        save: null
      };
    }
  };

  T['activity-minutes-checker'] = {
    fields: [{ id: 'mod', type: 'number', label: 'Moderate activity a week', unit: 'min', min: 0, max: 3000, fallback: 90, help: 'Brisk walking, easy cycling, dancing: you can talk but not sing.' },
      { id: 'vig', type: 'number', label: 'Vigorous activity a week', unit: 'min', min: 0, max: 2000, fallback: 0, help: 'Running, fast cycling, hard sport: a few words at a time.' },
      { id: 'str', type: 'number', label: 'Days with muscle strengthening', unit: 'days', min: 0, max: 7, fallback: 0, help: 'Weights, bands, body-weight exercises, heavy gardening.' }],
    calc: function (v) {
      var eq = (v.mod || 0) + 2 * (v.vig || 0);
      var band = eq < 150 ? [eq < 30 ? 'Getting started' : 'Below the guideline', 'watch'] : eq <= 300 ? ['Meets the guideline', 'good'] : ['Above the guideline', 'good'];
      var gap = Math.max(0, 150 - eq);
      return {
        label: 'Your weekly total', value: fmt(eq), unit: 'moderate-equivalent minutes', tag: band,
        tape: { min: 0, max: 450, value: eq, text: fmt(eq) + ' min', marks: [0, 150, 300, 450],
          bands: [{ to: 150, c: 'watch', label: 'Below 150' }, { to: 300, c: 'good', label: 'Guideline 150 to 300' }, { to: 450, c: 'low', label: 'Extra benefit' }] },
        meaning: 'The WHO advises adults to get 150 to 300 minutes of moderate activity a week, or 75 to 150 minutes of vigorous activity, plus muscle strengthening on 2 or more days. One vigorous minute counts as two moderate minutes. Any amount beats none.',
        rows: rows([gap ? ['To reach 150', fmt(gap) + ' more minutes, about ' + Math.ceil(gap / 10) + ' ten-minute walks'] : ['Aerobic guideline', 'Met'],
          ['Strength days', (v.str || 0) >= 2 ? 'Met (' + v.str + ' days)' : 'Add ' + (2 - (v.str || 0)) + ' day' + (2 - (v.str || 0) > 1 ? 's' : '')],
          ['Daily average', fmt(eq / 7) + ' minutes']]),
        save: ['Weekly activity', fmt(eq) + ' min']
      };
    }
  };

  T['sleep-calculator'] = {
    fields: [{ id: 'smode', type: 'seg', label: 'I know', options: [['wake', 'When I must wake up'], ['bed', 'When I am going to bed']], fallback: 'wake', wide: true },
      { id: 'stime', type: 'time', label: 'Time', fallback: '07:00' },
      { id: 'latency', type: 'select', label: 'Time to fall asleep', options: [['10', '10 minutes'], ['15', '15 minutes'], ['20', '20 minutes'], ['30', '30 minutes']], fallback: '15' },
      { id: 'sage', type: 'select', label: 'Age group', options: [['30', 'Adult, 18 to 64'], ['70', 'Adult, 65 or over'], ['15', 'Teen, 13 to 17']], fallback: '30' }],
    calc: function (v) {
      var t = toMin(v.stime);
      if (isNaN(t)) return null;
      var need = sleepNeed(+v.sage), lat = +v.latency, list = [6, 5, 4, 3].map(function (c) {
        var asleep = c * 90, at = v.smode === 'wake' ? t - asleep - lat : t + asleep + lat, ok = asleep / 60 >= need[0] && asleep / 60 <= need[1] + 0.01;
        return { c: c, at: at, asleep: asleep, ok: ok };
      });
      var best = list.filter(function (x) { return x.ok; })[0] || list[1];
      return {
        label: v.smode === 'wake' ? 'Be in bed by' : 'Set your alarm for', value: clock(best.at), unit: '',
        meaning: 'People your age generally need ' + need[0] + ' to ' + need[1] + ' hours. Sleep runs in cycles of roughly 90 minutes, and waking near the end of one tends to feel easier. Cycle length varies from person to person and night to night, so use these as starting points, not alarms to obey.',
        rows: list.map(function (x) { return [x.c + ' cycles, ' + hm(x.asleep) + ' asleep' + (x.ok ? '' : x.asleep / 60 < need[0] ? ' (short)' : ''), clock(x.at), x === best]; }),
        save: null
      };
    }
  };

  var DRINKS = [['95', 'Brewed coffee, 240 ml (8 oz)'], ['63', 'Espresso, single shot'], ['150', 'Large coffee-shop coffee, 350 ml (12 oz)'], ['47', 'Black tea, 240 ml'], ['28', 'Green tea, 240 ml'],
    ['34', 'Cola, 355 ml (12 oz)'], ['80', 'Energy drink, 250 ml (8.4 oz)'], ['160', 'Energy drink, 470 ml (16 oz)'], ['200', 'Pre-workout or caffeine tablet (200 mg)'], ['12', 'Dark chocolate, 30 g']];
  T['caffeine-cutoff-calculator'] = {
    fields: [{ id: 'bed', type: 'time', label: 'Bedtime', fallback: '23:00' },
      { id: 'drink', type: 'select', label: 'Your usual caffeine', options: DRINKS, fallback: '95', wide: true },
      { id: 'cups', type: 'number', label: 'Servings a day', unit: 'servings', min: 1, max: 15, fallback: 2 },
      { id: 'half', type: 'select', label: 'How you handle caffeine', options: [['4', 'Clears fast (about 4 hours)'], ['5', 'Typical (about 5 hours)'], ['7', 'Clears slowly (about 7 hours)']], fallback: '5', help: 'Slower in pregnancy and with some medicines; faster in smokers.' }],
    calc: function (v) {
      var bed = toMin(v.bed);
      if (isNaN(bed)) return null;
      var mg = +v.drink, half = +v.half, total = mg * v.cups;
      var needed = mg > 25 ? half * Math.log(mg / 25) / Math.LN2 : 0, hours = Math.min(14, Math.max(8, needed));
      function left(h) { return mg * Math.pow(0.5, h / half); }
      var out = {
        label: 'Have your last one by', value: clock(bed - hours * 60), unit: '',
        meaning: 'Caffeine has a half-life of about 5 hours in most adults, so a quarter of a mid-afternoon coffee can still be in your system at midnight. We leave at least 8 hours before bed, or longer if a bigger dose needs it to fall under 25 mg.',
        rows: [['Left at bedtime if you stop at that time', fmt(left(hours)) + ' mg'], ['Left at bedtime if your last one is 4 hours before', fmt(left(4)) + ' mg'],
          ['Your daily total', fmt(total) + ' mg'], ['Upper level most healthy adults tolerate (FDA)', '400 mg a day']],
        save: ['Caffeine cut-off', clock(bed - hours * 60)]
      };
      if (total > 400) out.alert = ['Your total is above 400 mg a day', 'That is more than the amount the FDA says is not generally associated with negative effects in healthy adults. In pregnancy, most guidance says to stay under 200 mg.'];
      return out;
    }
  };

  T['blood-pressure-checker'] = {
    fields: [{ id: 'sys', type: 'number', label: 'Systolic (top number)', unit: 'mm Hg', min: 60, max: 260 }, { id: 'dia', type: 'number', label: 'Diastolic (bottom number)', unit: 'mm Hg', min: 30, max: 160 }],
    calc: function (v) {
      if (v.dia >= v.sys) return { error: 'The top number should be higher than the bottom number. Check the reading.' };
      function cat(s, d) {
        if (s > 180 || d > 120) return 4;
        if (s >= 140 || d >= 90) return 3;
        if (s >= 130 || d >= 80) return 2;
        if (s >= 120) return 1;
        return 0;
      }
      var names = [['Normal', 'good'], ['Elevated', 'watch'], ['High, stage 1', 'high'], ['High, stage 2', 'alert'], ['Severely high', 'alert']];
      var say = ['A reading under 120/80 is in the normal range. Keep doing what works and re-check from time to time.',
        'A top number of 120 to 129 with a bottom number under 80 is classed as elevated. It often rises further without changes such as more activity, less salt and less alcohol.',
        'A reading of 130 to 139 over 80 to 89 is classed as stage 1 high blood pressure. One reading is not a diagnosis. Measure at home for a week and share the numbers with a doctor.',
        'A reading of 140/90 or higher is classed as stage 2 high blood pressure. See a doctor soon to confirm it and talk about treatment.',
        'A reading above 180/120 needs prompt attention.'];
      var c = cat(v.sys, v.dia), out = {
        label: 'This reading is', value: v.sys + '/' + v.dia, unit: 'mm Hg', tag: names[c], meaning: say[c],
        tape: { min: 90, max: 200, value: v.sys, text: v.sys + ' systolic', marks: [90, 120, 130, 140, 180, 200],
          bands: [{ to: 120, c: 'good', label: 'Normal' }, { to: 130, c: 'watch', label: 'Elevated' }, { to: 140, c: 'high', label: 'Stage 1' }, { to: 180, c: 'alert', label: 'Stage 2' }, { to: 200, c: '#7d1d1a', label: 'Above 180' }] },
        rows: [['Top number alone', names[cat(v.sys, 0)][0]], ['Bottom number alone', names[cat(0, v.dia)][0]], ['Which counts', 'The higher of the two categories']],
        save: ['Blood pressure', v.sys + '/' + v.dia]
      };
      if (c === 4) out.alert = ['Wait a minute, sit quietly and measure again', 'If it is still above 180/120, contact a health professional straight away. If you also have chest pain, shortness of breath, back pain, numbness, weakness, a change in vision or trouble speaking, call your local emergency number now.'];
      else if (v.sys < 90 || v.dia < 60) out.alert = ['This reading is on the low side', 'Low blood pressure is often harmless, but talk to a doctor if you feel dizzy, faint or unusually tired.'];
      return out;
    }
  };

  T['a1c-converter'] = {
    fields: [{ id: 'a1c', type: 'number', label: 'A1C result', unit: '%', min: 4, max: 15, step: 0.1 }],
    calc: function (v) {
      var mg = 28.7 * v.a1c - 46.7, band = v.a1c < 5.7 ? ['Normal range', 'good'] : v.a1c < 6.5 ? ['Prediabetes range', 'watch'] : ['Diabetes range', 'high'];
      return {
        label: 'Estimated average glucose', value: fmt(mg), unit: 'mg/dL', tag: band,
        tape: { min: 4, max: 10, value: v.a1c, text: v.a1c.toFixed(1) + '%', marks: [4, 5.7, 6.5, 8, 10],
          bands: [{ to: 5.7, c: 'good', label: 'Normal: under 5.7%' }, { to: 6.5, c: 'watch', label: 'Prediabetes: 5.7 to 6.4%' }, { to: 10, c: 'high', label: 'Diabetes: 6.5% or more' }] },
        meaning: 'A1C reflects your average blood glucose over about three months. The ranges are the American Diabetes Association cut-offs used for diagnosis, which a doctor confirms with a second test. If you already have diabetes, your personal target may differ.',
        rows: [['In mmol/L', (mg / 18.016).toFixed(1) + ' mmol/L'], ['A1C in IFCC units', fmt((v.a1c - 2.15) * 10.929) + ' mmol/mol'], ['Formula', '28.7 × A1C − 46.7']],
        save: ['A1C', v.a1c.toFixed(1) + '%']
      };
    }
  };

  var BOOZE = [['355|5', 'Beer, 355 ml can or bottle, 5%'], ['568|4', 'Beer, UK pint, 4%'], ['473|6.5', 'Strong beer or IPA, 473 ml, 6.5%'], ['150|12', 'Wine, 150 ml glass, 12%'],
    ['250|13', 'Wine, large 250 ml glass, 13%'], ['44|40', 'Spirits, 44 ml (1.5 oz) shot, 40%'], ['25|40', 'Spirits, UK 25 ml measure, 40%'], ['355|7', 'Hard seltzer or cooler, 355 ml, 7%']];
  T['alcohol-units-calculator'] = {
    fields: [{ id: 'booze', type: 'select', label: 'Drink', options: BOOZE, fallback: '355|5', wide: true },
      { id: 'perweek', type: 'number', label: 'How many in a typical week', unit: 'drinks', min: 0, max: 200, fallback: 4 }],
    calc: function (v) {
      var p = v.booze.split('|'), grams = (+p[0]) * (+p[1]) / 100 * 0.789 * v.perweek, ca = grams / 13.45;
      var band = ca === 0 ? ['None', 'good'] : ca <= 2 ? ['Low risk', 'good'] : ca <= 6 ? ['Moderate risk', 'watch'] : ['Increasingly high risk', 'high'];
      return {
        label: 'Pure alcohol a week', value: fmt(grams), unit: 'grams', tag: band,
        tape: { min: 0, max: 21, value: ca, text: ca.toFixed(1) + ' drinks', marks: [0, 2, 6, 14, 21],
          bands: [{ to: 2, c: 'good', label: 'Low: up to 2 a week' }, { to: 6, c: 'watch', label: 'Moderate: 3 to 6' }, { to: 21, c: 'high', label: 'Higher: 7 or more' }] },
        meaning: 'The scale is Canada\'s 2023 guidance, counted in Canadian standard drinks (13.45 g of alcohol). Countries draw the lines differently, and the WHO says no level is risk-free. Less is better for your health; any cut helps.',
        rows: [['Canadian standard drinks (13.45 g)', ca.toFixed(1)], ['U.S. standard drinks (14 g)', (grams / 14).toFixed(1)], ['UK units (8 g); UK guidance is 14 or fewer a week', (grams / 7.89).toFixed(1)],
          ['Australian standard drinks (10 g)', (grams / 10).toFixed(1)], ['Calories from the alcohol alone', fmt(grams * 7) + ' kcal a week']],
        save: ['Alcohol a week', fmt(grams) + ' g']
      };
    }
  };

  var QUIT = [[20 / 1440, '20 minutes', 'Heart rate starts to drop back towards normal.'], [1, '24 hours', 'Nicotine in the blood falls to zero.'],
    [4, 'Several days', 'Carbon monoxide in the blood drops to the level of someone who does not smoke.'], [30, '1 to 12 months', 'Coughing and shortness of breath ease.'],
    [365, '1 to 2 years', 'Risk of heart attack drops sharply.'], [1095, '3 to 6 years', 'Added risk of coronary heart disease falls by half.'],
    [1825, '5 to 10 years', 'Added risk of mouth, throat and voice-box cancer falls by half; stroke risk decreases.'], [3650, '10 to 15 years', 'Added risk of lung cancer falls by half.'],
    [5475, '15 years', 'Risk of coronary heart disease is close to that of someone who never smoked.']];
  T['smoke-free-calculator'] = {
    fields: [{ id: 'quit', type: 'date', label: 'Quit date' }, { id: 'cigs', type: 'number', label: 'Cigarettes a day before quitting', unit: 'a day', min: 1, max: 100, fallback: 15 },
      { id: 'price', type: 'number', label: 'Price of a pack', unit: 'per pack', min: 0, max: 100, step: 0.01, fallback: 12 }, { id: 'pack', type: 'number', label: 'Cigarettes in a pack', unit: 'in pack', min: 5, max: 50, fallback: 20 }],
    calc: function (v) {
      var q = parseDate(v.quit);
      if (!q) return null;
      var days = (Date.now() - q.getTime()) / 864e5, perDay = v.cigs / v.pack * v.price;
      var line = '<ul class="timeline">' + QUIT.map(function (m) { return '<li class="' + (days >= m[0] ? 'done' : '') + '"><b>' + m[1] + '</b> ' + m[2] + '</li>'; }).join('') + '</ul>';
      if (days < 0) return {
        label: 'Your quit day is in', value: fmt(Math.ceil(-days)), unit: 'days', html: line,
        meaning: 'Setting a date is a proven first step. Tell someone, clear out cigarettes and lighters the night before, and line up support. Medicines and counselling together roughly double the odds of success.',
        rows: [['You will save each week', fmt(perDay * 7, 2)], ['You will save each year', fmt(perDay * 365)]], save: null
      };
      return {
        label: 'Smoke-free for', value: fmt(Math.floor(days)), unit: 'days', html: line,
        meaning: 'Every milestone below comes from the U.S. Surgeon General and CDC summaries of what happens after stopping. The ticks show what your body has already banked.',
        rows: [['Cigarettes not smoked', fmt(days * v.cigs)], ['Money kept', fmt(days * perDay, 2)], ['On track to keep this year', fmt(perDay * 365)]],
        save: ['Smoke-free', fmt(Math.floor(days)) + ' days']
      };
    }
  };

  T['due-date-calculator'] = {
    fields: [{ id: 'dmethod', type: 'select', label: 'Work it out from', wide: true, fallback: 'lmp',
      options: [['lmp', 'First day of my last period'], ['conc', 'Conception date'], ['ivf3', 'IVF transfer, day-3 embryo'], ['ivf5', 'IVF transfer, day-5 embryo']] },
      { id: 'ddate', type: 'date', label: 'Date' },
      { id: 'cycle', type: 'number', label: 'Usual cycle length', unit: 'days', min: 21, max: 40, fallback: 28, show: function (s) { return s.dmethod === 'lmp'; } }],
    calc: function (v) {
      var d = parseDate(v.ddate);
      if (!d) return null;
      var add = { lmp: 280 + ((v.cycle || 28) - 28), conc: 266, ivf3: 263, ivf5: 261 }[v.dmethod], due = addDays(d, add), start = addDays(due, -280);
      var ga = Math.floor((Date.now() - start.getTime()) / 864e5);
      if (ga < 0 || ga > 310) return { error: 'That date gives a pregnancy outside the usual 0 to 44 weeks. Check the date and method.' };
      var w = Math.floor(ga / 7), tri = w < 14 ? 'First trimester' : w < 28 ? 'Second trimester' : 'Third trimester';
      return {
        label: 'Estimated due date', value: HL.niceDate(due), unit: '',
        meaning: 'Only about 1 in 20 babies arrive on their due date. This is the standard 40-week estimate (Naegele\'s rule, adjusted for cycle length). An early ultrasound gives a more accurate date and is what your care team will use.',
        rows: [['Today you are', w + ' weeks, ' + (ga % 7) + ' days'], ['Stage', tri], ['Second trimester starts', HL.niceDate(addDays(start, 98))], ['Third trimester starts', HL.niceDate(addDays(start, 196))],
          ['Full term (39 weeks 0 days to 40 weeks 6 days)', HL.niceDate(addDays(start, 273)) + ' to ' + HL.niceDate(addDays(start, 286))]],
        save: null
      };
    }
  };

  var CHECKS = [
    { n: 'Blood pressure check', w: 'Every adult. At least yearly from 40 or if you are at higher risk; every 3 to 5 years if younger with normal readings.', ok: function () { return true; } },
    { n: 'Cholesterol and heart-risk review', w: 'Ages 40 to 75: a risk assessment that may lead to a conversation about statins.', ok: function (a) { return a >= 40 && a <= 75; } },
    { n: 'Blood sugar (prediabetes and type 2 diabetes)', w: 'Ages 35 to 70 if you are overweight or have obesity; earlier with other risk factors.', ok: function (a) { return a >= 35 && a <= 70; } },
    { n: 'Colorectal cancer screening', w: 'Ages 45 to 75. Stool tests or colonoscopy; several options exist.', ok: function (a) { return a >= 45 && a <= 75; } },
    { n: 'Cervical cancer screening', w: 'Ages 21 to 65, every 3 to 5 years depending on the test.', ok: function (a, s) { return s === 'female' && a >= 21 && a <= 65; } },
    { n: 'Breast cancer screening (mammogram)', w: 'Ages 40 to 74, every 2 years.', ok: function (a, s) { return s === 'female' && a >= 40 && a <= 74; } },
    { n: 'Bone density (osteoporosis)', w: 'Women 65 and over; younger after menopause if at increased risk.', ok: function (a, s) { return s === 'female' && a >= 65; } },
    { n: 'Lung cancer screening (low-dose CT)', w: 'Ages 50 to 80 with a 20 pack-year history, if you smoke now or quit within the past 15 years. Yearly.', ok: function (a, s, k) { return k === 'yes' && a >= 50 && a <= 80; } },
    { n: 'Abdominal aortic aneurysm ultrasound', w: 'Men 65 to 75 who have ever smoked: one-time scan.', ok: function (a, s, k) { return s === 'male' && k === 'yes' && a >= 65 && a <= 75; } },
    { n: 'Prostate cancer: a conversation, not a default test', w: 'Men 55 to 69 can discuss the pros and cons of PSA testing with a doctor.', ok: function (a, s) { return s === 'male' && a >= 55 && a <= 69; }, talk: true },
    { n: 'Hepatitis C and HIV tests', w: 'At least once for adults (hepatitis C ages 18 to 79, HIV ages 15 to 65).', ok: function (a) { return a <= 79; } },
    { n: 'Mood check (depression and anxiety)', w: 'Recommended for adults as part of routine care. A short questionnaire.', ok: function () { return true; } },
    { n: 'Falls prevention', w: 'Ages 65 and over at risk of falling: exercise programmes focused on balance and strength.', ok: function (a) { return a >= 65; } },
    { n: 'Vaccines', w: 'Ask which are due for your age: flu each year, COVID-19, tetanus boosters, shingles and pneumococcal from about 50, RSV for older adults. Schedules differ by country and change.', ok: function () { return true; } },
    { n: 'Teeth, eyes and skin', w: 'Dental and eye checks at the interval your dentist or optometrist advises. Show a doctor any mole that changes.', ok: function () { return true; }, talk: true }
  ];
  T['checkup-checklist'] = {
    fields: ['sex', 'age', { id: 'smoked', type: 'seg', label: 'Smoke now, or quit in the last 15 years', options: [['no', 'No'], ['yes', 'Yes']], fallback: 'no', wide: true }],
    calc: function (v) {
      var list = CHECKS.filter(function (c) { return c.ok(v.age, v.sex, v.smoked); });
      return {
        label: 'Topics to raise at your next checkup', value: String(list.length), unit: 'items',
        meaning: 'Based on U.S. Preventive Services Task Force recommendations for people at average risk. Your country\'s screening programme, family history or health conditions can change the timing, so use this as a list of questions, not instructions.',
        html: '<ul class="checklist">' + list.map(function (c) { return '<li><strong>' + esc(c.n) + '</strong><span>' + esc(c.w) + '</span></li>'; }).join('') + '</ul>',
        rows: [], save: null
      };
    }
  };

  /* ---------- the engine ---------- */
  function resolve(f) { if (typeof f === 'string') { var d = F[f]; d.id = d.id || f; return d; } return f; }
  function keyOf(f) { return f.profile || f.id; }

  function Tool(mount, slug, def, opts) {
    var self = this, profile = HL.profile();
    this.mount = mount; this.slug = slug; this.def = def; this.opts = opts || {};
    this.fields = def.fields.map(resolve);
    this.S = { units: profile.units || 'metric' };
    this.fields.forEach(function (f) {
      var k = keyOf(f), fromUrl = HL.params.get(f.id);
      if (fromUrl !== null && fromUrl !== '') self.S[k] = isNaN(fromUrl) || f.type === 'select' || f.type === 'seg' || f.type === 'time' || f.type === 'date' ? fromUrl : parseFloat(fromUrl);
      else if (f.profile && profile[f.profile] != null) self.S[k] = profile[f.profile];
      else if (f.fallback != null) self.S[k] = f.fallback;
    });
    if (!this.S.sex && this.fields.some(function (f) { return f.id === 'sex'; })) this.S.sex = 'female';
    this.form = el('form', { 'class': 'tool-form', novalidate: '' });
    this.out = el('div', { 'class': 'result', 'aria-live': 'polite' });
    mount.innerHTML = '';
    mount.appendChild(this.form);
    mount.appendChild(this.out);
    this.form.addEventListener('submit', function (e) { e.preventDefault(); });
    this.draw();
    this.update();
  }

  Tool.prototype.input = function (f, part, value, unit, attrs) {
    var self = this, k = keyOf(f), id = 'f-' + this.slug + '-' + f.id + (part || '');
    var node = el('input', Object.assign({ id: id, type: 'number', inputmode: 'decimal', step: f.step || 'any', autocomplete: 'off', value: value == null || isNaN(value) ? '' : value }, attrs || {}));
    node.addEventListener('input', function () { self.read(f); self.update(); });
    var box = el('div', { 'class': 'with-unit' }, [node, unit ? el('span', { text: unit }) : null]);
    box.dataset.key = k;
    return box;
  };

  Tool.prototype.draw = function () {
    var self = this, S = this.S, us = S.units === 'us';
    this.form.innerHTML = '';
    this.fields.forEach(function (f) {
      if (f.show && !f.show(S)) return;
      var k = keyOf(f), v = S[k], id = 'f-' + self.slug + '-' + f.id, control, labelFor = id;
      var r1 = function (x) { return Math.round(x * 10) / 10; };
      if (f.type === 'seg') {
        control = el('div', { 'class': 'seg', role: 'radiogroup', 'aria-label': f.label }, f.options.map(function (o) {
          var radio = el('input', { type: 'radio', name: id, value: o[0] });
          radio.checked = String(v) === o[0];
          radio.addEventListener('change', function () {
            S[k] = o[0];
            if (f.profile) { var p = {}; p[f.profile] = o[0]; HL.profile(p); }
            if (f.id === 'units' || self.fields.some(function (x) { return x.show; })) self.draw();
            self.update();
          });
          return el('label', {}, [radio, el('span', { text: o[1] })]);
        }));
        labelFor = null;
      } else if (f.type === 'select') {
        control = el('select', { id: id }, f.options.map(function (o, i) {
          var opt = el('option', { value: f.byLabel ? String(i) : o[0], text: o[1] });
          if (f.byLabel ? String(S[k + 'Index'] != null ? S[k + 'Index'] : f.options.findIndex(function (x) { return x[0] === String(v); })) === String(i) : String(v) === o[0]) opt.selected = true;
          return opt;
        }));
        control.addEventListener('change', function () {
          if (f.byLabel) { S[k + 'Index'] = +control.value; S[k] = f.options[+control.value][0]; } else S[k] = control.value;
          if (f.profile) { var p = {}; p[f.profile] = S[k]; HL.profile(p); }
          if (self.fields.some(function (x) { return x.show; })) self.draw();
          self.update();
        });
      } else if (f.type === 'height' && us) {
        var totalIn = v ? v / IN : NaN, ft = Math.floor(totalIn / 12), inch = Math.round((totalIn - ft * 12) * 10) / 10;
        if (inch >= 12) { ft += 1; inch = 0; }
        control = el('div', { 'class': 'pair' }, [self.input(f, '', ft, 'ft', { 'aria-label': 'Height, feet' }), self.input(f, '-in', inch, 'in', { 'aria-label': 'Height, inches' })]);
      } else if (f.type === 'height') control = self.input(f, '', v ? r1(v) : v, 'cm');
      else if (f.type === 'weight') control = self.input(f, '', v ? r1(us ? v * LB : v) : v, us ? 'lb' : 'kg');
      else if (f.type === 'length') control = self.input(f, '', v ? r1(us ? v / IN : v) : v, us ? 'in' : 'cm');
      else if (f.type === 'duration') {
        var t = v || 0;
        control = el('div', { 'class': 'pair', style: 'grid-template-columns:repeat(3,1fr)' }, [
          self.input(f, '', t ? Math.floor(t / 3600) : '', 'h', { 'aria-label': 'Hours', min: 0 }),
          self.input(f, '-m', t ? Math.floor(t % 3600 / 60) : '', 'min', { 'aria-label': 'Minutes', min: 0, max: 59 }),
          self.input(f, '-s', t ? t % 60 : '', 's', { 'aria-label': 'Seconds', min: 0, max: 59 })]);
      } else if (f.type === 'time' || f.type === 'date') {
        control = el('input', { id: id, type: f.type, value: v || '' });
        control.addEventListener('input', function () { S[k] = control.value; self.update(); });
      } else control = self.input(f, '', v, f.unit, { min: f.min, max: f.max });
      var wrap = el('div', { 'class': 'field' + (f.wide ? ' wide' : ''), 'data-field': f.id }, [
        labelFor ? el('label', { 'for': labelFor, text: f.label }) : el('span', { 'class': 'label', text: f.label }),
        control, f.help ? el('small', { text: f.help }) : null, el('span', { 'class': 'err', role: 'alert' })]);
      self.form.appendChild(wrap);
    });
  };

  Tool.prototype.read = function (f) {
    var S = this.S, k = keyOf(f), us = S.units === 'us', wrap = this.form.querySelector('[data-field="' + f.id + '"]');
    var nums = HL.$$('input[type="number"]', wrap).map(function (n) { return n.value === '' ? NaN : parseFloat(n.value); });
    var val;
    if (f.type === 'height') val = us ? ((nums[0] || 0) * 12 + (nums[1] || 0)) * IN : nums[0];
    else if (f.type === 'weight') val = us ? nums[0] / LB : nums[0];
    else if (f.type === 'length') val = us ? nums[0] * IN : nums[0];
    else if (f.type === 'duration') val = (nums[0] || 0) * 3600 + (nums[1] || 0) * 60 + (nums[2] || 0);
    else val = nums[0];
    if (f.type === 'height' && us && isNaN(nums[0])) val = NaN;
    S[k] = val;
    var bad = !isNaN(val) && f.min != null && (val < f.min - 0.01 || val > f.max + 0.01) && f.type !== 'duration';
    wrap.classList.toggle('bad', bad);
    wrap.querySelector('.err').textContent = bad ? 'Enter a value between ' + this.show(f, f.min) + ' and ' + this.show(f, f.max) + '.' : '';
    if (!bad && !isNaN(val) && f.profile) { var p = {}; p[f.profile] = val; HL.profile(p); }
  };
  Tool.prototype.show = function (f, x) {
    var us = this.S.units === 'us';
    if (f.type === 'height') return us ? Math.floor(x / IN / 12) + ' ft ' + Math.round(x / IN % 12) + ' in' : x + ' cm';
    if (f.type === 'weight') return us ? Math.round(x * LB) + ' lb' : x + ' kg';
    if (f.type === 'length') return us ? Math.round(x / IN) + ' in' : x + ' cm';
    return x + (f.unit ? ' ' + f.unit : '');
  };

  Tool.prototype.values = function () {
    var S = this.S, ok = true, v = { units: S.units };
    this.fields.forEach(function (f) {
      var k = keyOf(f), x = S[k];
      if (f.show && !f.show(S)) return;
      var numeric = /number|height|weight|length|duration/.test(f.type);
      if (numeric) {
        if (x == null || isNaN(x) || x === '') { if (!f.optional) ok = false; return; }
        if (f.min != null && f.type !== 'duration' && (x < f.min - 0.01 || x > f.max + 0.01)) { if (!f.optional) ok = false; return; }
      } else if (x == null || x === '') { if (!f.optional) ok = false; return; }
      v[k] = x;
    });
    return ok ? v : null;
  };

  Tool.prototype.update = function () {
    var v = this.values(), out = this.out, r = v ? this.def.calc(v) : null, self = this;
    if (this.opts.onResult) { this.opts.onResult(r, v); return; }
    if (!r) { out.innerHTML = '<p class="muted">Fill in the fields above and your result appears here straight away.</p>'; return; }
    if (r.error) { out.innerHTML = '<div class="alert"><strong>Check your entries</strong>' + esc(r.error) + '</div>'; return; }
    var h = '<p class="result-label">' + esc(r.label) + '</p><div class="result-main"><span class="num">' + esc(r.value) + '</span>' +
      (r.unit ? '<span class="unit">' + esc(r.unit) + '</span>' : '') +
      (r.tag ? '<span class="tag" style="--tag:' + HL.rangeColor(r.tag[1]) + '">' + esc(r.tag[0]) + '</span>' : '') + '</div>';
    if (r.tape) h += HL.tape(r.tape);
    if (r.alert) h += '<div class="alert" role="alert"><strong>' + esc(r.alert[0]) + '</strong>' + esc(r.alert[1]) + '</div>';
    if (r.meaning) h += '<p class="result-meaning">' + esc(r.meaning) + '</p>';
    if (r.html) h += r.html;
    if (r.rows && r.rows.length) h += '<dl class="result-rows">' + r.rows.map(function (x) {
      return '<div' + (x[2] ? ' class="is-you"' : '') + '><dt>' + esc(x[0]) + '</dt><dd>' + esc(x[1]) + '</dd></div>';
    }).join('') + '</dl>';
    h += '<div class="result-actions"><button type="button" class="btn btn-small" data-copy>Copy link to this result</button>' +
      '<button type="button" class="btn btn-small" data-print-result>Print</button>' +
      '<a class="btn btn-small" href="' + HL.root + 'my-numbers.html">See all my numbers</a></div>';
    out.innerHTML = h;
    if (r.save) { var saved = HL.get('hl.numbers', {}); saved[this.slug] = { label: r.save[0], value: r.save[1], at: Date.now() }; HL.set('hl.numbers', saved); }
    out.querySelector('[data-print-result]').addEventListener('click', function () { window.print(); });
    out.querySelector('[data-copy]').addEventListener('click', function (ev) {
      var q = new URLSearchParams();
      self.fields.forEach(function (f) { var x = self.S[keyOf(f)]; if (x != null && x !== '' && !(typeof x === 'number' && isNaN(x))) q.set(f.id, typeof x === 'number' ? Math.round(x * 100) / 100 : x); });
      var url = location.origin + location.pathname + '?' + q.toString(), btn = ev.currentTarget;
      var done = function () { btn.textContent = 'Link copied'; setTimeout(function () { btn.textContent = 'Copy link to this result'; }, 2000); };
      if (navigator.clipboard) navigator.clipboard.writeText(url).then(done, function () { prompt('Copy this link', url); }); else prompt('Copy this link', url);
    });
  };

  /* ---------- breathing timer: a tool with no number ---------- */
  var PATTERNS = { box: ['Box breathing', [['Breathe in', 4, 1], ['Hold', 4, 1], ['Breathe out', 4, 0.6], ['Hold', 4, 0.6]]],
    long: ['Longer exhale', [['Breathe in', 4, 1], ['Breathe out', 6, 0.6]]], relax: ['4-7-8', [['Breathe in', 4, 1], ['Hold', 7, 1], ['Breathe out', 8, 0.6]]],
    even: ['Slow and even', [['Breathe in', 5.5, 1], ['Breathe out', 5.5, 0.6]]] };
  function breathing(mount) {
    var state = { pattern: 'box', minutes: 2, timer: null };
    mount.innerHTML = '<div class="tool-form"><div class="field"><label for="br-p">Pattern</label><select id="br-p">' +
      Object.keys(PATTERNS).map(function (k) { return '<option value="' + k + '">' + PATTERNS[k][0] + ' (' + PATTERNS[k][1].map(function (s) { return s[1]; }).join('-') + ')</option>'; }).join('') +
      '</select></div><div class="field"><label for="br-m">Length</label><select id="br-m"><option value="1">1 minute</option><option value="2" selected>2 minutes</option><option value="3">3 minutes</option><option value="5">5 minutes</option></select></div></div>' +
      '<div class="breath"><div class="breath-ring"><b aria-live="assertive">Ready</b></div><p class="muted" data-left>Press start, then follow the circle.</p>' +
      '<div class="btn-row"><button type="button" class="btn btn-accent" data-go>Start</button></div></div>';
    var ring = mount.querySelector('.breath-ring'), word = ring.querySelector('b'), left = mount.querySelector('[data-left]'), go = mount.querySelector('[data-go]');
    function stop(msg) {
      clearTimeout(state.timer); state.timer = null; ring.style.transform = 'scale(.6)'; ring.style.transitionDuration = '.6s';
      word.textContent = msg || 'Ready'; go.textContent = 'Start';
    }
    function run() {
      var steps = PATTERNS[state.pattern][1], end = Date.now() + state.minutes * 60000, i = 0;
      go.textContent = 'Stop';
      (function next() {
        if (Date.now() >= end) { stop('Done'); left.textContent = 'Nicely done. Notice how you feel.'; var n = HL.get('hl.breaths', 0) + 1; HL.set('hl.breaths', n); return; }
        var s = steps[i % steps.length];
        word.textContent = s[0]; ring.style.transitionDuration = s[1] + 's'; ring.style.transform = 'scale(' + s[2] + ')';
        left.textContent = Math.ceil((end - Date.now()) / 1000) + ' seconds left';
        i += 1; state.timer = setTimeout(next, s[1] * 1000);
      })();
    }
    go.addEventListener('click', function () { if (state.timer) { stop(); left.textContent = 'Stopped.'; } else run(); });
    mount.querySelector('#br-p').addEventListener('change', function (e) { state.pattern = e.target.value; if (state.timer) stop(); });
    mount.querySelector('#br-m').addEventListener('change', function (e) { state.minutes = +e.target.value; if (state.timer) stop(); });
  }

  /* ---------- home page: three inputs, six numbers ---------- */
  var HERO = { fields: ['units', 'sex', 'age', 'height', 'weight'], calc: function (v) { return v; } };
  function hero(mount) {
    var form = el('div'), out = el('div', { 'class': 'readouts', 'aria-live': 'polite' });
    mount.appendChild(form); mount.appendChild(out);
    return new Tool(form, 'hero', HERO, { onResult: function (v) {
      if (!v) { out.innerHTML = '<p class="muted">Enter your age, height and weight to see your numbers.</p>'; return; }
      var b = bmi(v), h = v.heightCm / 100, band = bmiBand(b), max = tanaka(v.age), need = sleepNeed(v.age), kcal = Math.round(mifflin(v) * 1.375 / 10) * 10;
      out.innerHTML = '<div class="readout"><span class="num">' + b.toFixed(1) + '</span><span class="label">BMI, ' + band[0].toLowerCase() + '</span>' +
        HL.tape({ min: 15, max: 40, value: b, text: b.toFixed(1), marks: [15, 18.5, 25, 30, 40], bands: BMI_BANDS, key: false }) + '</div>' +
        '<dl class="result-rows"><div><dt>Healthy weight for your height</dt><dd>' + wtRange(18.5 * h * h, 24.9 * h * h, v.units) + '</dd></div>' +
        '<div><dt>Calories to hold your weight, light activity</dt><dd>' + fmt(kcal) + ' kcal</dd></div>' +
        '<div><dt>Protein to aim for</dt><dd>' + fmt(v.weightKg * 1.2) + '–' + fmt(v.weightKg * 1.6) + ' g</dd></div>' +
        '<div><dt>Easy-effort heart rate (zone 2)</dt><dd>' + Math.round(max * 0.6) + '–' + Math.round(max * 0.7) + ' bpm</dd></div>' +
        '<div><dt>Sleep you need</dt><dd>' + need[0] + '–' + need[1] + ' hours</dd></div></dl>' +
        '<div class="btn-row" style="margin-top:.5rem"><a class="btn btn-accent" href="' + HL.root + 'my-numbers.html">See all my numbers</a></div>';
    } });
  }

  /* ---------- public API and start-up ---------- */
  window.HLTools = {
    defs: T, fields: F, Tool: Tool,
    run: function (slug, v) { try { return T[slug].calc(v); } catch (e) { return null; } },
    bmi: bmi, mifflin: mifflin, tanaka: tanaka, sleepNeed: sleepNeed, wtRange: wtRange, wt: wt, len: len, vol: vol, bmiBands: BMI_BANDS, activity: ACTIVITY
  };
  HL.$$('[data-tool]').forEach(function (mount) {
    var slug = mount.getAttribute('data-tool');
    if (slug === 'breathing-timer') breathing(mount);
    else if (slug === 'hero') hero(mount);
    else if (T[slug]) new Tool(mount, slug, T[slug]);
  });
})();
