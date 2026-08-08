/* La Réunion en chiffres — moteur de compteurs façon Worldometers.
   Chaque compteur extrapole une moyenne annuelle publiée (voir la note de
   sources dans la page) : ce sont des estimations lissées, pas des mesures.

   .counter     data-rate-year : unités par an
                data-mode      : "day"  → cumul depuis minuit (heure de La Réunion)
                                 "year" → cumul depuis le 1er janvier
                                 "abs"  → data-base + cumul depuis le 1er janvier 2026
                data-decimals  : décimales affichées (défaut 0)
                data-unit      : unité affichée dans le « +N » flottant
                data-confetti  : burst de confettis à chaque vrai incrément
   .countdown   data-rate-year : temps estimé avant le prochain événement
   .meter-fill  data-rate-year : progression vers le prochain événement
   [data-fx]    ambiance de la cellule : euros, coins, bolt, drops, fuel, rain,
                smoke, volcano, stack, plane, sun, windows, containers, trace,
                mountain, clock */
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

  // Les grandes valeurs et la table roulent comme des odomètres.
  document.querySelectorAll('.cell-big, .cell-value, .live-card-value, .wm-table td .counter').forEach(
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
  const rnd = (a, b) => a + Math.random() * (b - a);

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
    const x = Math.min(rect.right + 6 + rnd(-7, 7), innerWidth - 72);
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
        { transform: `translate(${(Math.cos(a) * r).toFixed(0)}px, ${(Math.sin(a) * r - 26).toFixed(0)}px) rotate(${rnd(-200, 200).toFixed(0)}deg)`, opacity: 0 }
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

  /* — horloges, anneau de journée, vague, aiguilles — */
  const clocks = document.querySelectorAll('.clock-time');
  const dayRing = document.getElementById('day-ring');
  const dayPct = document.getElementById('day-pct');
  const waveLevel = document.querySelector('.wave-level');
  const fxClockHands = [];
  const reunionDate = () => new Date(Date.now() + TZ_OFFSET_MS);
  function updateClock() {
    const now = Date.now();
    const d = reunionDate();
    const text = `${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())}:${pad(d.getUTCSeconds())}`;
    clocks.forEach((el) => { el.textContent = text; });
    const frac = (now - startOfDay(now)) / 86_400_000;
    if (dayRing) dayRing.style.strokeDashoffset = String(100 - frac * 100);
    if (dayPct) dayPct.textContent = `${Math.round(frac * 100)} %`;
    if (waveLevel) waveLevel.style.height = `${(12 + frac * 76).toFixed(2)}%`;
    for (const c of fxClockHands) {
      const h = d.getUTCHours() % 12, m = d.getUTCMinutes(), s = d.getUTCSeconds();
      c.h.setAttribute('transform', `rotate(${h * 30 + m * .5} 18 18)`);
      c.m.setAttribute('transform', `rotate(${m * 6} 18 18)`);
      c.s.setAttribute('transform', `rotate(${s * 6} 18 18)`);
    }
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
  if (mapPing && mapPlace && !reduceMotion) {
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

  /* ————————————————————————————————————————————————————————————————
     Le moteur d'ambiances : chaque cellule marquée data-fx vit selon
     sa nature. Tout est coupé hors écran, onglet caché et reduced-motion.
     ———————————————————————————————————————————————————————————————— */
  const ambient = !reduceMotion;
  const fxVisible = new WeakSet();
  const svgNS = 'http://www.w3.org/2000/svg';
  const svgEl = (tag, attrs) => {
    const el = document.createElementNS(svgNS, tag);
    for (const k in attrs) el.setAttribute(k, attrs[k]);
    return el;
  };
  const isDarkCell = (cell) =>
    cell.classList.contains('cell-dark') || cell.classList.contains('cell-red') ||
    (cell.matches && cell.matches('.live-grid .live-card:first-child'));

  const FX = {
    // Il pleut des « € » — chaque glyphe ≈ ce que l'île produit pendant sa chute.
    euros: { every: 900, tick(cell, layer) {
      const d = document.createElement('span');
      d.className = 'fx-euro';
      d.textContent = '€';
      d.style.left = `${rnd(6, 92).toFixed(1)}%`;
      d.style.setProperty('--rot', `${rnd(-120, 120).toFixed(0)}deg`);
      layer.appendChild(d);
      setTimeout(() => d.remove(), 2100);
    } },

    // Des pièces qui tombent — les prestations versées.
    coins: { every: 780, tick(cell, layer) {
      const c = document.createElement('i');
      c.className = 'fx-coin';
      c.style.left = `${rnd(8, 88).toFixed(1)}%`;
      c.style.setProperty('--dx', `${rnd(-18, 18).toFixed(0)}px`);
      layer.appendChild(c);
      setTimeout(() => c.remove(), 1600);
    } },

    // Un éclair génératif — jamais deux identiques.
    bolt: { layer: 'svg', every: 1500, tick(cell, layer) {
      const pts = [];
      let x = rnd(12, 88), y = -2;
      while (y < 102) {
        pts.push(`${x.toFixed(1)},${y.toFixed(1)}`);
        y += rnd(11, 26);
        x += rnd(-13, 13);
      }
      const p = svgEl('polyline', { points: pts.join(' ') });
      layer.appendChild(p);
      setTimeout(() => p.remove(), 620);
    } },

    // Des gouttes qui s'écrasent au fond de la cellule.
    drops: { every: 1100, tick(cell, layer) {
      const h = cell.clientHeight;
      const drop = document.createElement('i');
      drop.className = 'fx-drop';
      drop.style.left = `${rnd(8, 90).toFixed(1)}%`;
      layer.appendChild(drop);
      const fall = h - 14;
      drop.animate(
        [{ transform: 'translateY(0)', opacity: .95 }, { transform: `translateY(${fall}px)`, opacity: 1 }],
        { duration: 650, easing: 'cubic-bezier(.55,0,1,.45)' }
      ).onfinish = () => {
        drop.animate(
          [{ transform: `translateY(${fall}px) scale(1)`, opacity: .8 }, { transform: `translateY(${fall}px) scale(3.2)`, opacity: 0 }],
          { duration: 340, easing: 'ease-out' }
        ).onfinish = () => drop.remove();
      };
    } },

    // Le carburant, même chute, goutte sombre et lourde.
    fuel: { every: 1400, tick(cell, layer) {
      FX.drops.tick(cell, layer);
      const last = layer.lastElementChild;
      if (last) last.classList.add('fuel');
    } },

    // La pluie de Cilaos — record du monde oblige.
    rain: { every: 170, tick(cell, layer) {
      for (let i = 0, n = 1 + (Math.random() < .5 ? 1 : 0); i < n; i++) {
        const r = document.createElement('i');
        r.className = 'fx-rain';
        r.style.left = `${rnd(4, 98).toFixed(1)}%`;
        layer.appendChild(r);
        setTimeout(() => r.remove(), 600);
      }
    } },

    // Des volutes qui montent et se dissipent.
    smoke: { every: 620, color: 'rgba(155,151,151,.4)', tick(cell, layer, opts) {
      const h = cell.clientHeight;
      const s = document.createElement('i');
      s.className = 'fx-smoke';
      const size = rnd(9, 17);
      s.style.width = s.style.height = `${size.toFixed(0)}px`;
      s.style.background = opts.color;
      s.style.left = `${(opts.volcano ? rnd(38, 58) : rnd(12, 84)).toFixed(1)}%`;
      s.style.top = `${h - 10}px`;
      layer.appendChild(s);
      s.animate([
        { transform: 'translate(0,0) scale(.6)', opacity: 0 },
        { transform: `translate(${rnd(-10, 10).toFixed(0)}px, ${(-h * .45).toFixed(0)}px) scale(1.4)`, opacity: .5, offset: .45 },
        { transform: `translate(${rnd(-22, 22).toFixed(0)}px, ${(-h * .9).toFixed(0)}px) scale(2.4)`, opacity: 0 }
      ], { duration: 2600, easing: 'linear' }).onfinish = () => s.remove();
    } },

    // Le volcan : fumée chaude, et parfois un lapilli.
    volcano: { every: 620, tick(cell, layer) {
      FX.smoke.tick(cell, layer, { color: 'rgba(255,151,131,.5)', volcano: true });
      if (Math.random() < .18) {
        const h = cell.clientHeight;
        const l = document.createElement('i');
        l.className = 'fx-coin';
        l.style.left = `${rnd(44, 54).toFixed(1)}%`;
        l.style.top = `${h - 12}px`;
        l.style.width = l.style.height = '5px';
        layer.appendChild(l);
        l.animate([
          { transform: 'translateY(0)', opacity: 1 },
          { transform: `translateY(${(-h * .6).toFixed(0)}px) translateX(${rnd(-16, 16).toFixed(0)}px)`, opacity: 0 }
        ], { duration: 700, easing: 'cubic-bezier(.2,.8,.6,1)' }).onfinish = () => l.remove();
        l.style.animation = 'none';
      }
    } },

    // Les déchets s'empilent en Tetris, puis la benne passe.
    stack: { every: 1200, init(cell, layer, state) { state.cols = null; state.blocks = []; }, tick(cell, layer, opts, state) {
      const w = cell.clientWidth, h = cell.clientHeight;
      const size = 9, gap = 2, unit = size + gap;
      const n = Math.max(4, Math.floor((w - 16) / unit));
      if (!state.cols || state.cols.length !== n) { state.cols = new Array(n).fill(0); }
      const maxRows = Math.max(3, Math.floor(h * .4 / unit));
      const col = Math.floor(Math.random() * n);
      const b = document.createElement('i');
      b.className = 'fx-block';
      b.style.left = `${8 + col * unit}px`;
      b.style.top = '-10px';
      b.style.opacity = String(rnd(.35, .8));
      layer.appendChild(b);
      state.blocks.push(b);
      const restY = h - 6 - (state.cols[col] + 1) * unit + gap;
      state.cols[col]++;
      b.animate(
        [{ transform: 'translateY(0)' }, { transform: `translateY(${restY + 10}px)` }],
        { duration: 460, easing: 'cubic-bezier(.5,0,1,.6)', fill: 'forwards' }
      );
      if (state.cols[col] >= maxRows) {
        const blocks = state.blocks;
        state.blocks = [];
        state.cols = new Array(n).fill(0);
        setTimeout(() => {
          for (const bl of blocks) {
            bl.animate([{ opacity: bl.style.opacity }, { opacity: 0 }], { duration: 420 })
              .onfinish = () => bl.remove();
          }
        }, 500);
      }
    } },

    // Un avion arrive au-dessus de la carte, se pose sur la piste et roule
    // jusqu'en bout — ombre au sol pour la profondeur, fumée au toucher.
    plane: { every: 8200, kickoff: true, build(cell, layer) {
      const strip = document.createElement('i');
      strip.className = 'fx-runway';
      layer.appendChild(strip);
    }, tick(cell, layer) {
      const w = cell.clientWidth, h = cell.clientHeight;
      const ground = h - 30;    // position du fuselage posé
      const td = w * .52;       // point de toucher des roues
      const D = 5200;
      const ease = 'cubic-bezier(.35,.25,.35,1)';
      const p = document.createElement('span');
      p.className = 'fx-plane';
      // Avion Lucide (le set d'icônes du design system), nez orienté sens du vol.
      p.innerHTML = '<svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" style="transform:rotate(45deg)"><path d="M17.8 19.2 16 11l3.5-3.5C21 6 21.5 4 21 3c-1-.5-3 0-4.5 1.5L13 8 4.8 6.2c-.5-.1-.9.1-1.1.5l-.3.5c-.2.5-.1 1 .3 1.3L9 12l-2 3H4l-1 1 3 2 2 3 1-1v-3l3-2 3.5 5.3c.3.4.8.5 1.3.3l.5-.2c.4-.3.6-.7.5-1.2z"/></svg>';
      const sh = document.createElement('i');
      sh.className = 'fx-plane-shadow';
      layer.appendChild(sh);
      layer.appendChild(p);
      p.animate([
        { transform: `translate(-26px, ${(ground - h * .52).toFixed(0)}px) rotate(13deg)`, opacity: 0 },
        { transform: `translate(4px, ${(ground - h * .47).toFixed(0)}px) rotate(13deg)`, opacity: 1, offset: .07 },
        { transform: `translate(${(td * .8).toFixed(0)}px, ${(ground - 9).toFixed(0)}px) rotate(8deg)`, offset: .52 },
        { transform: `translate(${td.toFixed(0)}px, ${ground}px) rotate(0deg)`, offset: .64 },
        { transform: `translate(${(w * .86).toFixed(0)}px, ${ground}px) rotate(0deg)`, opacity: 1, offset: .94 },
        { transform: `translate(${(w * .88).toFixed(0)}px, ${ground}px) rotate(0deg)`, opacity: 0 }
      ], { duration: D, easing: ease }).onfinish = () => p.remove();
      sh.animate([
        { transform: `translate(-20px, ${ground + 18}px) scale(.45, .5)`, opacity: 0 },
        { transform: `translate(${(td * .8 + 2).toFixed(0)}px, ${ground + 18}px) scale(.8, .8)`, opacity: .16, offset: .52 },
        { transform: `translate(${(td + 2).toFixed(0)}px, ${ground + 18}px) scale(1, 1)`, opacity: .3, offset: .64 },
        { transform: `translate(${(w * .86 + 2).toFixed(0)}px, ${ground + 18}px) scale(1, 1)`, opacity: .26, offset: .94 },
        { transform: `translate(${(w * .88).toFixed(0)}px, ${ground + 18}px)`, opacity: 0 }
      ], { duration: D, easing: ease }).onfinish = () => sh.remove();
      setTimeout(() => {
        if (!layer.isConnected) return;
        for (let i = 0; i < 3; i++) {
          const puff = document.createElement('i');
          puff.className = 'fx-smoke';
          puff.style.width = puff.style.height = `${rnd(4, 8).toFixed(0)}px`;
          puff.style.background = 'rgba(155,151,151,.55)';
          puff.style.left = `${(td + rnd(-4, 12)).toFixed(0)}px`;
          puff.style.top = `${ground + 16}px`;
          layer.appendChild(puff);
          puff.animate([
            { transform: 'translate(0,0) scale(.6)', opacity: .6 },
            { transform: `translate(${rnd(-18, -6).toFixed(0)}px, ${rnd(-11, -4).toFixed(0)}px) scale(1.9)`, opacity: 0 }
          ], { duration: 900, easing: 'ease-out' }).onfinish = () => puff.remove();
        }
      }, D * .64);
    } },

    // Le soleil péi tourne — et la nuit, la lune veille.
    sun: { build(cell, layer) {
      const day = (() => { const hh = reunionDate().getUTCHours(); return hh >= 6 && hh < 19; })();
      const svg = svgEl('svg', { class: 'fx-static', viewBox: '0 0 100 100', preserveAspectRatio: 'xMaxYMin meet' });
      if (day) {
        const g = svgEl('g', { class: 'fx-sun-rays' });
        for (let i = 0; i < 8; i++) {
          g.appendChild(svgEl('line', {
            x1: 74, y1: 4.5, x2: 74, y2: 12,
            stroke: '#ff9783', 'stroke-width': 2.6, 'stroke-linecap': 'round',
            transform: `rotate(${i * 45} 74 26)`
          }));
        }
        svg.appendChild(g);
        svg.appendChild(svgEl('circle', { cx: 74, cy: 26, r: 9.5, fill: '#ff9783' }));
      } else {
        svg.appendChild(svgEl('path', {
          d: 'M80 15a11 11 0 1 0 3 21.6A11.5 11.5 0 0 1 80 15z', fill: '#bab6b6'
        }));
        [[58, 14], [64, 34], [86, 42]].forEach(([x, y], i) => {
          const st = svgEl('circle', { cx: x, cy: y, r: 1.6, fill: '#d7d3d3', class: 'fx-star' });
          st.style.animationDelay = `${i * .7}s`;
          svg.appendChild(st);
        });
      }
      layer.appendChild(svg);
    } },

    // La skyline des entreprises — des fenêtres s'allument.
    windows: { every: 460, build(cell, layer, state) {
      const svg = svgEl('svg', { class: 'fx-static fx-sky', viewBox: '0 0 100 40', preserveAspectRatio: 'xMidYMax meet' });
      state.win = [];
      const buildings = [[4, 16, 22], [30, 12, 30], [46, 18, 18], [68, 14, 26], [86, 11, 20]];
      for (const [bx, bw, bh] of buildings) {
        svg.appendChild(svgEl('rect', { x: bx, y: 40 - bh, width: bw, height: bh, fill: 'rgba(32,30,29,.08)' }));
        for (let wx = bx + 2; wx < bx + bw - 2; wx += 4) {
          for (let wy = 42 - bh; wy < 37; wy += 5) {
            const r = svgEl('rect', { x: wx, y: wy, width: 2, height: 2.6, fill: 'rgba(32,30,29,.16)' });
            svg.appendChild(r);
            state.win.push(r);
          }
        }
      }
      layer.appendChild(svg);
    }, tick(cell, layer, opts, state) {
      if (!state.win || !state.win.length) return;
      const r = state.win[Math.floor(Math.random() * state.win.length)];
      const lit = r.getAttribute('fill') === '#ec3013';
      r.setAttribute('fill', lit ? 'rgba(32,30,29,.16)' : '#ec3013');
    } },

    // Les conteneurs de l'octroi de mer défilent sur le quai.
    containers: { every: 2100, tick(cell, layer) {
      const w = cell.clientWidth;
      const dark = isDarkCell(cell);
      const b = document.createElement('i');
      b.className = 'fx-box';
      const bw = rnd(14, 22).toFixed(0);
      b.style.width = `${bw}px`;
      b.style.height = `${rnd(8, 11).toFixed(0)}px`;
      b.style.left = '0';
      b.style.background = dark ? 'rgba(255,255,255,.16)' : 'rgba(32,30,29,.08)';
      b.style.border = `1.5px solid ${dark ? 'rgba(255,255,255,.42)' : 'rgba(32,30,29,.3)'}`;
      layer.appendChild(b);
      b.animate(
        [{ transform: 'translateX(-26px)' }, { transform: `translateX(${w + 8}px)` }],
        { duration: 3400, easing: 'linear' }
      ).onfinish = () => b.remove();
    } },

    // L'île se trace en boucle.
    trace: { build(cell, layer) {
      const svg = svgEl('svg', { class: 'fx-static', viewBox: '0 0 100 60', preserveAspectRatio: 'xMaxYMid meet' });
      svg.appendChild(svgEl('path', {
        class: 'fx-trace', pathLength: 100,
        d: 'M62 8 Q76 6 84 16 Q94 28 90 40 Q86 52 72 54 Q58 57 46 52 Q32 47 28 36 Q24 24 34 15 Q46 5 62 8 Z'
      }));
      layer.appendChild(svg);
    } },

    // Le profil du Piton des Neiges, sommet qui pulse.
    mountain: { build(cell, layer) {
      const svg = svgEl('svg', { class: 'fx-static', viewBox: '0 0 100 40', preserveAspectRatio: 'xMidYMax slice' });
      svg.appendChild(svgEl('polyline', {
        class: 'fx-trace', pathLength: 100,
        points: '0,38 16,26 28,31 44,8 56,20 70,14 84,28 100,22'
      }));
      svg.appendChild(svgEl('circle', { cx: 44, cy: 8, r: 2.2, fill: '#ec3013', class: 'fx-peak' }));
      layer.appendChild(svg);
    } },

    // Une vraie petite horloge à l'heure de La Réunion.
    clock: { build(cell, layer) {
      const svg = svgEl('svg', { class: 'fx-static fx-clock', viewBox: '0 0 36 36', preserveAspectRatio: 'xMaxYMid meet' });
      svg.appendChild(svgEl('circle', { cx: 18, cy: 18, r: 14, fill: 'none', stroke: 'rgba(32,30,29,.14)', 'stroke-width': 2 }));
      const h = svgEl('line', { x1: 18, y1: 18, x2: 18, y2: 11, stroke: '#201e1d', 'stroke-width': 2.2, 'stroke-linecap': 'round' });
      const m = svgEl('line', { x1: 18, y1: 18, x2: 18, y2: 7.5, stroke: '#201e1d', 'stroke-width': 1.5, 'stroke-linecap': 'round' });
      const s = svgEl('line', { x1: 18, y1: 20.5, x2: 18, y2: 6.5, stroke: '#ec3013', 'stroke-width': 1, 'stroke-linecap': 'round' });
      svg.appendChild(h); svg.appendChild(m); svg.appendChild(s);
      layer.appendChild(svg);
      fxClockHands.push({ h, m, s });
    } }
  };

  const fxCells = document.querySelectorAll('[data-fx]');
  if (ambient && fxCells.length) {
    const io = 'IntersectionObserver' in window
      ? new IntersectionObserver((entries) => {
          for (const e of entries) {
            if (e.isIntersecting) fxVisible.add(e.target);
            else fxVisible.delete(e.target);
          }
        }, { threshold: .2 })
      : null;
    fxCells.forEach((cell) => {
      const kind = FX[cell.dataset.fx];
      if (!kind) return;
      let layer;
      if (kind.layer === 'svg') {
        layer = svgEl('svg', { class: 'bolt-layer', viewBox: '0 0 100 100', preserveAspectRatio: 'none' });
      } else {
        layer = document.createElement('div');
        layer.className = 'fx-layer';
      }
      cell.prepend(layer);
      const state = {};
      if (kind.build) kind.build(cell, layer, state);
      if (kind.init) kind.init(cell, layer, state);
      if (io) io.observe(cell); else fxVisible.add(cell);
      if (kind.tick && kind.every) {
        setInterval(() => {
          if (!fxVisible.has(cell) || document.hidden) return;
          kind.tick(cell, layer, kind, state);
        }, kind.every);
        // Certaines ambiances jouent une première fois sans attendre l'intervalle.
        if (kind.kickoff) setTimeout(() => {
          if (fxVisible.has(cell) && !document.hidden) kind.tick(cell, layer, kind, state);
        }, 1300);
      }
    });
  }

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

  /* — apparition au scroll + décollage des compteurs — */
  document.body.classList.add('js-anim');
  const revealables = document.querySelectorAll('.cell, .live-card, .fact, .wm-table-wrap, .facts-title, .sec-head');
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
  // Les compteurs hors de tout bloc révélable (ticker) démarrent direct.
  for (const c of counters) {
    if (c.introStart === null && !c.el.closest('.reveal')) c.introStart = 0;
  }

  update();
  updateClock();
  setInterval(update, 100);
  setInterval(updateClock, 250);
})();
