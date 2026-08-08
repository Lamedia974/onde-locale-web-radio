/* La Réunion en chiffres — moteur de compteurs façon Worldometers.
   Chaque compteur extrapole une moyenne annuelle publiée (voir la note de
   sources dans la page) : ce sont des estimations lissées, pas des mesures.

   .counter     data-rate-year : unités par an
                data-mode      : "day"  → cumul depuis minuit (heure de La Réunion)
                                 "year" → cumul depuis le 1er janvier
                                 "abs"  → data-base + cumul depuis le 1er janvier 2026
                data-decimals  : décimales affichées (défaut 0)
                data-unit      : unité affichée dans le « +N » flottant
   .countdown   data-rate-year : temps estimé avant le prochain événement
   .meter-fill  data-rate-year : progression vers le prochain événement */
(() => {
  'use strict';

  // La Réunion : UTC+4 toute l'année, pas d'heure d'été.
  const TZ_OFFSET_MS = 4 * 60 * 60 * 1000;
  const YEAR_MS = 365.25 * 24 * 60 * 60 * 1000;
  // 1er janvier 2026, 00:00 heure de La Réunion.
  const BASE_EPOCH = Date.UTC(2025, 11, 31, 20, 0, 0);
  // En deçà de ~1 incrément toutes les 3 s, chaque tick est signalé en rouge.
  const TICK_FLASH_MAX_RATE = 10_000_000;
  // Un « +N » flottant au plus tous les 700 ms par compteur, 24 à l'écran max.
  const POP_INTERVAL_MS = 700;
  const POP_MAX_ONSCREEN = 24;
  // Décollage des compteurs : montée de 0 à la valeur réelle en 1,1 s.
  const INTRO_MS = 1100;

  const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;

  const fmts = {};
  const fmt = (n, d) => (fmts[d] ||= new Intl.NumberFormat('fr-FR', {
    minimumFractionDigits: d, maximumFractionDigits: d
  })).format(n);

  const startOfDay = (t) => {
    const d = new Date(t + TZ_OFFSET_MS);
    return Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()) - TZ_OFFSET_MS;
  };
  const startOfYear = (t) => {
    const d = new Date(t + TZ_OFFSET_MS);
    return Date.UTC(d.getUTCFullYear(), 0, 1) - TZ_OFFSET_MS;
  };

  // Le bandeau défilant est dupliqué pour boucler sans couture — avant de
  // recenser les compteurs, pour que les clones vivent aussi.
  const track = document.querySelector('.ticker-track');
  if (track) track.innerHTML = track.innerHTML.repeat(4);

  // Les grandes valeurs roulent comme un odomètre.
  document.querySelectorAll('.cell-big, .cell-value, .live-card-value').forEach(
    (el) => el.classList.contains('counter') && el.classList.add('odo')
  );

  const rawValue = (mode, base, ratePerMs, now) => {
    if (mode === 'day') return (now - startOfDay(now)) * ratePerMs;
    if (mode === 'abs') return base + (now - BASE_EPOCH) * ratePerMs;
    return (now - startOfYear(now)) * ratePerMs;
  };

  const counters = Array.from(document.querySelectorAll('.counter')).map((el) => ({
    el,
    mode: el.dataset.mode || 'year',
    ratePerMs: Number(el.dataset.rateYear) / YEAR_MS,
    base: Number(el.dataset.base || 0),
    decimals: Number(el.dataset.decimals || 0),
    unit: el.dataset.unit || '',
    flash: Number(el.dataset.rateYear) < TICK_FLASH_MAX_RATE,
    pops: !el.closest('.ticker'),
    odo: el.classList.contains('odo'),
    odoKey: null,
    odoStrips: null,
    introStart: el.closest('.ticker') ? 0 : null, // 0 = décollage déjà fini
    value: null,
    shown: null,
    accum: 0,
    lastPop: 0,
    flashTimer: 0
  }));

  const countdowns = Array.from(document.querySelectorAll('.countdown')).map((el) => ({
    el,
    ratePerMs: Number(el.dataset.rateYear) / YEAR_MS,
    shown: null
  }));

  const meters = Array.from(document.querySelectorAll('.meter-fill')).map((el) => ({
    el,
    ratePerMs: Number(el.dataset.rateYear) / YEAR_MS
  }));

  const pad = (n) => String(n).padStart(2, '0');
  const easeOut = (t) => 1 - (1 - t) ** 3;

  /* — odomètre à rouleaux : chaque chiffre glisse vers sa nouvelle valeur — */
  function renderOdo(c, str) {
    const key = str.replace(/\d/g, '0');
    if (c.odoKey !== key) {
      c.el.textContent = '';
      c.odoStrips = [];
      for (const ch of str) {
        if (/\d/.test(ch)) {
          const d = document.createElement('span');
          d.className = 'odo-d';
          const strip = document.createElement('span');
          strip.className = 'odo-strip';
          for (let i = 0; i <= 9; i++) {
            const n = document.createElement('span');
            n.textContent = String(i);
            strip.appendChild(n);
          }
          strip.style.transform = `translateY(-${ch}em)`;
          d.appendChild(strip);
          c.el.appendChild(d);
          c.odoStrips.push(strip);
        } else {
          const s = document.createElement('span');
          s.className = 'odo-s';
          s.textContent = ch;
          c.el.appendChild(s);
          c.odoStrips.push(null);
        }
      }
      c.odoKey = key;
      return;
    }
    for (let i = 0; i < str.length; i++) {
      const strip = c.odoStrips[i];
      if (strip) strip.style.transform = `translateY(-${str[i]}em)`;
    }
  }

  /* — « +N » flottant : la petite récompense visuelle à chaque incrément — */
  function spawnPop(c, delta, now) {
    if (reduceMotion || document.hidden) { c.accum = 0; return; }
    if (now - c.lastPop < POP_INTERVAL_MS) return;
    if (document.getElementsByClassName('tick-pop').length >= POP_MAX_ONSCREEN) { c.accum = 0; return; }
    const rect = c.el.getBoundingClientRect();
    if (rect.bottom < 0 || rect.top > innerHeight) { c.accum = 0; return; }
    const pop = document.createElement('span');
    pop.className = 'tick-pop';
    pop.textContent = `+${fmt(delta, 0)}${c.unit ? ' ' + c.unit : ''}`;
    const x = Math.min(rect.right + 6 + (Math.random() * 14 - 7), innerWidth - 72);
    pop.style.left = `${Math.max(8, x)}px`;
    pop.style.top = `${rect.top - 6}px`;
    document.body.appendChild(pop);
    setTimeout(() => pop.remove(), 950);
    if ('confetti' in c.el.dataset) burst(rect);
    c.lastPop = now;
    c.accum = 0;
  }

  /* — confettis : un vrai événement (naissance, mariage, arrivée) se fête — */
  function burst(rect) {
    const colors = ['#ec3013', '#ff9783', '#201e1d'];
    for (let i = 0; i < 10; i++) {
      const s = document.createElement('i');
      s.className = 'confetti';
      s.style.background = colors[i % 3];
      s.style.left = `${rect.left + rect.width / 2}px`;
      s.style.top = `${rect.top + rect.height / 2}px`;
      document.body.appendChild(s);
      const a = Math.random() * Math.PI * 2;
      const r = 26 + Math.random() * 44;
      s.animate([
        { transform: 'translate(0,0) rotate(0)', opacity: 1 },
        { transform: `translate(${(Math.cos(a) * r).toFixed(0)}px, ${(Math.sin(a) * r - 26).toFixed(0)}px) rotate(${(Math.random() * 400 - 200).toFixed(0)}deg)`, opacity: 0 }
      ], { duration: 800, easing: 'cubic-bezier(.16,1,.3,1)' }).onfinish = () => s.remove();
    }
  }

  function update() {
    const now = Date.now();
    const perf = performance.now();

    for (const c of counters) {
      if (c.introStart === null) continue; // pas encore révélé à l'écran
      const raw = Math.max(0, rawValue(c.mode, c.base, c.ratePerMs, now));
      let value = c.decimals
        ? Math.floor(raw * 10 ** c.decimals) / 10 ** c.decimals
        : Math.floor(raw);

      // Décollage : le compteur monte de zéro à sa valeur réelle.
      let intro = false;
      if (c.introStart > 0) {
        const t = (perf - c.introStart) / INTRO_MS;
        if (t >= 1) c.introStart = 0;
        else { intro = true; value = c.decimals ? value : Math.floor(value * easeOut(t)); }
      }

      if (!intro) {
        if (c.value !== null) {
          const delta = value - c.value;
          // delta négatif = remise à zéro de minuit : on repart de zéro.
          c.accum = delta < 0 ? 0 : c.accum + delta;
        }
        c.value = value;
        if (c.pops && c.accum >= 1) spawnPop(c, Math.floor(c.accum), now);
      }

      const shown = fmt(value, c.decimals);
      if (shown === c.shown) continue;
      const first = c.shown === null;
      c.shown = shown;
      if (c.odo) renderOdo(c, shown);
      else c.el.textContent = shown;
      if (c.flash && !first && !intro) {
        c.el.classList.add('is-tick');
        clearTimeout(c.flashTimer);
        c.flashTimer = setTimeout(() => c.el.classList.remove('is-tick'), 450);
      }
    }

    for (const c of countdowns) {
      const elapsed = (now - startOfDay(now)) * c.ratePerMs;
      const secs = Math.max(0, Math.ceil((Math.floor(elapsed) + 1 - elapsed) / (c.ratePerMs * 1000)));
      const h = Math.floor(secs / 3600), m = Math.floor((secs % 3600) / 60), s = secs % 60;
      const shown = h > 0 ? `${h} h ${pad(m)} min` : m > 0 ? `${m} min ${pad(s)} s` : `${s} s`;
      if (shown !== c.shown) { c.shown = shown; c.el.textContent = shown; }
    }

    for (const m of meters) {
      const elapsed = (now - startOfDay(now)) * m.ratePerMs;
      m.el.style.width = `${((elapsed - Math.floor(elapsed)) * 100).toFixed(1)}%`;
    }
  }

  /* — horloges + anneau de la journée écoulée — */
  const clocks = document.querySelectorAll('.clock-time');
  const dayRing = document.getElementById('day-ring');
  const dayPct = document.getElementById('day-pct');
  const waveLevel = document.querySelector('.wave-level');
  function updateClock() {
    const now = Date.now();
    const d = new Date(now + TZ_OFFSET_MS);
    const text = `${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())}:${pad(d.getUTCSeconds())}`;
    clocks.forEach((el) => { el.textContent = text; });
    const frac = (now - startOfDay(now)) / 86_400_000;
    if (dayRing) dayRing.style.strokeDashoffset = String(100 - frac * 100);
    if (dayPct) dayPct.textContent = `${Math.round(frac * 100)} %`;
    if (waveLevel) waveLevel.style.height = `${(12 + frac * 76).toFixed(2)}%`;
  }

  /* — la carte : le point rouge visite l'île — */
  const mapPing = document.getElementById('map-ping');
  const mapPlace = document.querySelector('.map-place');
  const STOPS = [
    { x: 373, y: 31, name: 'Saint-Denis', region: 'Nord · préfecture' },
    { x: 160, y: 89, name: 'Route du Littoral', region: 'Ouest · RN1' },
    { x: 411, y: 453, name: 'Les Cirques', region: 'Mafate · Cilaos · Salazie' },
    { x: 721, y: 564, name: 'Piton de la Fournaise', region: 'Sud-Est · volcan' },
    { x: 422, y: 789, name: 'Saint-Pierre', region: 'Sud · sous-préfecture' }
  ];
  let stopIndex = 0;
  if (mapPing && mapPlace) {
    const nameEl = mapPlace.querySelector('b');
    const regionEl = mapPlace.querySelector('span');
    setInterval(() => {
      stopIndex = (stopIndex + 1) % STOPS.length;
      const s = STOPS[stopIndex];
      mapPing.style.transform = `translate(${s.x}px, ${s.y}px)`;
      mapPlace.classList.add('swap');
      setTimeout(() => {
        nameEl.textContent = s.name;
        regionEl.textContent = s.region;
        mapPlace.classList.remove('swap');
      }, 400);
    }, 4200);
  }

  /* — apparition au scroll + décollage des compteurs — */
  document.body.classList.add('js-anim');
  const revealables = document.querySelectorAll('.cell, .live-card, .fact, .wm-table-wrap, .facts-title');
  revealables.forEach((el, i) => { el.classList.add('reveal'); el.style.transitionDelay = `${(i % 5) * 70}ms`; });
  const started = (el) => {
    for (const c of counters) {
      if (c.introStart === null && el.contains(c.el)) {
        c.introStart = reduceMotion ? 0 : performance.now();
      }
    }
  };
  if ('IntersectionObserver' in window && !reduceMotion) {
    const io = new IntersectionObserver((entries) => {
      for (const e of entries) {
        if (!e.isIntersecting) continue;
        e.target.classList.add('in-view');
        started(e.target);
        io.unobserve(e.target);
      }
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.1 });
    revealables.forEach((el) => io.observe(el));
  } else {
    revealables.forEach((el) => { el.classList.add('in-view'); started(el); });
  }
  // Les compteurs hors de tout bloc révélable (tableau, ticker) démarrent direct.
  for (const c of counters) {
    if (c.introStart === null && !c.el.closest('.reveal')) c.introStart = 0;
  }

  /* — ambiances : chaque cellule vit selon sa nature — */
  const ambient = !reduceMotion;
  const ambientVisible = new WeakSet();
  const ambientCells = document.querySelectorAll('.cell-pib, .cell-elec, .cell-water');
  if (ambient && 'IntersectionObserver' in window) {
    const aio = new IntersectionObserver((entries) => {
      for (const e of entries) {
        if (e.isIntersecting) ambientVisible.add(e.target);
        else ambientVisible.delete(e.target);
      }
    }, { threshold: .25 });
    ambientCells.forEach((el) => aio.observe(el));
  } else {
    ambientCells.forEach((el) => ambientVisible.add(el));
  }
  const onScreen = (el) => el && ambientVisible.has(el) && !document.hidden;

  // La pluie d'euros de la cellule PIB — un « € » par ≈ 640 € produits.
  const pibCell = document.querySelector('.cell-pib');
  if (ambient && pibCell) setInterval(() => {
    if (!onScreen(pibCell)) return;
    const d = document.createElement('span');
    d.className = 'euro-drop';
    d.textContent = '€';
    d.style.left = `${(6 + Math.random() * 86).toFixed(1)}%`;
    d.style.setProperty('--rot', `${(Math.random() * 240 - 120).toFixed(0)}deg`);
    pibCell.appendChild(d);
    setTimeout(() => d.remove(), 2100);
  }, 900);

  // Les éclairs génératifs de la cellule électricité — jamais deux identiques.
  const elecCell = document.querySelector('.cell-elec');
  const boltLayer = elecCell && elecCell.querySelector('.bolt-layer');
  if (ambient && boltLayer) setInterval(() => {
    if (!onScreen(elecCell)) return;
    const pts = [];
    let x = 12 + Math.random() * 76, y = -2;
    while (y < 102) {
      pts.push(`${x.toFixed(1)},${y.toFixed(1)}`);
      y += 11 + Math.random() * 15;
      x += Math.random() * 26 - 13;
    }
    const p = document.createElementNS('http://www.w3.org/2000/svg', 'polyline');
    p.setAttribute('points', pts.join(' '));
    boltLayer.appendChild(p);
    setTimeout(() => p.remove(), 620);
  }, 1500);

  // Les gouttes qui tombent dans la vague de la cellule eau.
  const waterCell = document.querySelector('.cell-water');
  if (ambient && waterCell) setInterval(() => {
    if (!onScreen(waterCell)) return;
    const h = waterCell.clientHeight;
    const level = waveLevel ? h * (parseFloat(waveLevel.style.height) || 30) / 100 : h * .3;
    const fall = Math.max(20, h - level - 4);
    const drop = document.createElement('i');
    drop.className = 'water-drop';
    drop.style.left = `${(8 + Math.random() * 84).toFixed(1)}%`;
    waterCell.appendChild(drop);
    drop.animate(
      [{ transform: 'translateY(0)', opacity: .95 }, { transform: `translateY(${fall}px)`, opacity: 1 }],
      { duration: 650, easing: 'cubic-bezier(.55,0,1,.45)' }
    ).onfinish = () => {
      drop.animate(
        [{ transform: `translateY(${fall}px) scale(1)`, opacity: .8 }, { transform: `translateY(${fall}px) scale(3.2)`, opacity: 0 }],
        { duration: 340, easing: 'ease-out' }
      ).onfinish = () => drop.remove();
    };
  }, 1100);

  // Le halo qui suit la souris dans chaque tuile.
  if (ambient && matchMedia('(pointer: fine)').matches) {
    document.addEventListener('pointermove', (e) => {
      const cell = e.target.closest && e.target.closest('.cell, .live-card, .fact');
      if (!cell) return;
      const r = cell.getBoundingClientRect();
      cell.style.setProperty('--mx', `${((e.clientX - r.left) / r.width * 100).toFixed(1)}%`);
      cell.style.setProperty('--my', `${((e.clientY - r.top) / r.height * 100).toFixed(1)}%`);
    }, { passive: true });
  }

  update();
  updateClock();
  setInterval(update, 100);
  setInterval(updateClock, 250);
})();
