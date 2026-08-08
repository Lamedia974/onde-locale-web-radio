/* La Réunion en chiffres — moteur de compteurs façon Worldometers.
   Chaque compteur extrapole une moyenne annuelle publiée (voir la note de
   sources dans la page) : ce sont des estimations lissées, pas des mesures.

   data-rate-year : unités par an
   data-mode      : "day"  → cumul depuis minuit (heure de La Réunion)
                    "year" → cumul depuis le 1er janvier (heure de La Réunion)
                    "abs"  → data-base + cumul depuis le 1er janvier 2026 */
(() => {
  'use strict';

  // La Réunion : UTC+4 toute l'année, pas d'heure d'été.
  const TZ_OFFSET_MS = 4 * 60 * 60 * 1000;
  const YEAR_MS = 365.25 * 24 * 60 * 60 * 1000;
  // 1er janvier 2026, 00:00 heure de La Réunion.
  const BASE_EPOCH = Date.UTC(2025, 11, 31, 20, 0, 0);
  // En deçà de ~1 incrément toutes les 3 s, chaque tick est signalé en rouge.
  const TICK_FLASH_MAX_RATE = 10_000_000;

  const fmt = new Intl.NumberFormat('fr-FR');

  const startOfDay = (t) => {
    const d = new Date(t + TZ_OFFSET_MS);
    return Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()) - TZ_OFFSET_MS;
  };
  const startOfYear = (t) => {
    const d = new Date(t + TZ_OFFSET_MS);
    return Date.UTC(d.getUTCFullYear(), 0, 1) - TZ_OFFSET_MS;
  };

  const counters = Array.from(document.querySelectorAll('.counter')).map((el) => ({
    el,
    mode: el.dataset.mode || 'year',
    ratePerMs: Number(el.dataset.rateYear) / YEAR_MS,
    base: Number(el.dataset.base || 0),
    flash: Number(el.dataset.rateYear) < TICK_FLASH_MAX_RATE,
    shown: null,
    flashTimer: 0
  }));

  function update() {
    const now = Date.now();
    for (const c of counters) {
      let value;
      if (c.mode === 'day') value = (now - startOfDay(now)) * c.ratePerMs;
      else if (c.mode === 'abs') value = c.base + (now - BASE_EPOCH) * c.ratePerMs;
      else value = (now - startOfYear(now)) * c.ratePerMs;
      const shown = Math.max(0, Math.floor(value));
      if (shown === c.shown) continue;
      const first = c.shown === null;
      c.shown = shown;
      c.el.textContent = fmt.format(shown);
      if (c.flash && !first) {
        c.el.classList.add('is-tick');
        clearTimeout(c.flashTimer);
        c.flashTimer = setTimeout(() => c.el.classList.remove('is-tick'), 450);
      }
    }
  }

  const clock = document.getElementById('clock-time');
  function updateClock() {
    if (!clock) return;
    const d = new Date(Date.now() + TZ_OFFSET_MS);
    const p = (n) => String(n).padStart(2, '0');
    clock.textContent = `${p(d.getUTCHours())}:${p(d.getUTCMinutes())}:${p(d.getUTCSeconds())}`;
  }

  update();
  updateClock();
  setInterval(update, 100);
  setInterval(updateClock, 250);
})();
