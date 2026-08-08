/* La Réunion en chiffres — moteur de compteurs façon Worldometers.
   Chaque compteur extrapole une moyenne annuelle publiée (voir la note de
   sources dans la page) : ce sont des estimations lissées, pas des mesures.

   .counter   data-rate-year : unités par an
              data-mode      : "day"  → cumul depuis minuit (heure de La Réunion)
                               "year" → cumul depuis le 1er janvier
                               "abs"  → data-base + cumul depuis le 1er janvier 2026
              data-decimals  : décimales affichées (défaut 0)
              data-unit      : unité affichée dans le « +N » flottant
   .countdown data-rate-year : temps estimé avant le prochain événement */
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

  const pad = (n) => String(n).padStart(2, '0');

  // « +N » flottant : la petite récompense visuelle à chaque incrément.
  function spawnPop(c, delta, now) {
    if (reduceMotion || document.hidden) { c.accum = 0; return; }
    if (now - c.lastPop < POP_INTERVAL_MS) return;
    if (document.getElementsByClassName('tick-pop').length >= POP_MAX_ONSCREEN) { c.accum = 0; return; }
    const rect = c.el.getBoundingClientRect();
    if (rect.bottom < 0 || rect.top > innerHeight) { c.accum = 0; return; }
    const pop = document.createElement('span');
    pop.className = 'tick-pop';
    pop.textContent = `+${fmt(delta, 0)}${c.unit ? ' ' + c.unit : ''}`;
    const x = Math.min(rect.right + 6 + (Math.random() * 14 - 7), innerWidth - 72);
    pop.style.left = `${Math.max(8, x)}px`;
    pop.style.top = `${rect.top - 6}px`;
    document.body.appendChild(pop);
    setTimeout(() => pop.remove(), 950);
    c.lastPop = now;
    c.accum = 0;
  }

  function update() {
    const now = Date.now();

    for (const c of counters) {
      const raw = Math.max(0, rawValue(c.mode, c.base, c.ratePerMs, now));
      const value = c.decimals
        ? Math.floor(raw * 10 ** c.decimals) / 10 ** c.decimals
        : Math.floor(raw);
      if (c.value !== null) {
        const delta = value - c.value;
        // delta négatif = remise à zéro de minuit : on repart de zéro.
        c.accum = delta < 0 ? 0 : c.accum + delta;
      }
      c.value = value;
      if (c.pops && c.accum >= 1) spawnPop(c, Math.floor(c.accum), now);

      const shown = fmt(value, c.decimals);
      if (shown === c.shown) continue;
      const first = c.shown === null;
      c.shown = shown;
      c.el.textContent = shown;
      if (c.flash && !first) {
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
  }

  const clock = document.getElementById('clock-time');
  function updateClock() {
    if (!clock) return;
    const d = new Date(Date.now() + TZ_OFFSET_MS);
    clock.textContent = `${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())}:${pad(d.getUTCSeconds())}`;
  }

  update();
  updateClock();
  setInterval(update, 100);
  setInterval(updateClock, 250);
})();
