/* La Réunion en chiffres — moteur de compteurs façon Worldometers.
   Chaque compteur extrapole une moyenne annuelle publiée (voir la note de
   sources dans la page) : ce sont des estimations lissées, pas des mesures.

   .counter   data-rate-year : unités par an
              data-mode      : "day"  → cumul depuis minuit (heure de La Réunion)
                               "year" → cumul depuis le 1er janvier
                               "abs"  → data-base + cumul depuis le 1er janvier 2026
              data-decimals  : décimales affichées (défaut 0)
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
    flash: Number(el.dataset.rateYear) < TICK_FLASH_MAX_RATE,
    shown: null,
    flashTimer: 0
  }));

  const countdowns = Array.from(document.querySelectorAll('.countdown')).map((el) => ({
    el,
    ratePerMs: Number(el.dataset.rateYear) / YEAR_MS,
    shown: null
  }));

  const pad = (n) => String(n).padStart(2, '0');

  function update() {
    const now = Date.now();

    for (const c of counters) {
      const value = Math.max(0, rawValue(c.mode, c.base, c.ratePerMs, now));
      const shown = c.decimals
        ? fmt(Math.floor(value * 10 ** c.decimals) / 10 ** c.decimals, c.decimals)
        : fmt(Math.floor(value), 0);
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
