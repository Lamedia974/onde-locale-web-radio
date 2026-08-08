/* La carte du 974 — couches open data (OpenStreetMap/ODbL) sur Leaflet.
   Les GeoJSON de data/ sont générés depuis l'API Overpass : sentiers
   (relations route=hiking, dont GR R1/R2/R3), toilettes publiques, eau
   potable, aires de pique-nique, mairies, santé, écoles. */
(() => {
  'use strict';

  const map = L.map('map', {
    center: [-21.115, 55.532],
    zoom: 10,
    minZoom: 9,
    maxBounds: [[-21.75, 54.8], [-20.5, 56.3]],
    zoomControl: true
  });

  L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
  }).addTo(map);
  L.control.scale({ imperial: false, position: 'bottomleft' }).addTo(map);

  // Un seul canvas pour ~1 400 points : fluide même sur mobile.
  const canvas = L.canvas({ padding: .3 });

  const popup = (cat, name, meta) =>
    `<span class="pop-cat">${cat}</span><span class="pop-name">${name}</span>` +
    (meta ? `<span class="pop-meta">${meta}</span>` : '');

  const esc = (s) => String(s).replace(/[<>&"]/g, (c) => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', '"': '&quot;' }[c]));

  const LAYERS = {
    sentiers: {
      label: 'Sentiers & GR', line: true, sw: '#ec3013', on: true,
      make(gj) {
        return L.geoJSON(gj, {
          style: (f) => f.properties.cat === 'GR'
            ? { color: '#ec3013', weight: 3, opacity: .9 }
            : { color: '#ff7a60', weight: 2.2, opacity: .85, dashArray: '7 5' },
          onEachFeature: (f, l) => {
            const p = f.properties;
            l.bindPopup(popup(
              p.cat === 'GR' ? 'Grande randonnée' : 'Sentier',
              esc(p.n || 'Sentier'),
              p.ref && p.ref !== p.n ? esc(p.ref) : ''
            ));
            l.on('mouseover', () => l.setStyle({ weight: p.cat === 'GR' ? 5 : 4 }));
            l.on('mouseout', () => l.setStyle({ weight: p.cat === 'GR' ? 3 : 2.2 }));
          }
        });
      }
    },
    toilettes: { label: 'Toilettes publiques', sw: '#ec3013', on: true, cat: 'Toilettes publiques',
      meta: (p) => [p.fee === 'yes' ? 'payantes' : p.fee === 'no' ? 'gratuites' : '', p.wc === 'yes' ? 'accès PMR' : ''].filter(Boolean).join(' · ') },
    eau: { label: 'Eau potable', sw: '#201e1d', on: true, cat: 'Point d\'eau potable' },
    picnic: { label: 'Aires de pique-nique', sw: '#ff9783', on: true, cat: 'Aire de pique-nique' },
    mairies: { label: 'Mairies & annexes', sw: '#ae1800', on: true, cat: 'Mairie', r: 6 },
    sante: { label: 'Hôpitaux & cliniques', sw: '#7c1405', on: true, cat: 'Santé', r: 6,
      meta: (p) => [p.type === 'hospital' ? 'hôpital' : p.type === 'clinic' ? 'clinique' : '', p.urg === 'yes' ? 'urgences' : ''].filter(Boolean).join(' · ') },
    ecoles: { label: 'Écoles', sw: '#9b9797', on: false, cat: 'École', r: 4 }
  };

  const groups = {};
  const rows = {};
  let total = 0;

  function pointLayer(gj, def) {
    return L.geoJSON(gj, {
      pointToLayer: (f, latlng) => L.circleMarker(latlng, {
        renderer: canvas,
        radius: def.r || 5,
        fillColor: def.sw,
        fillOpacity: .88,
        color: '#ffffff',
        weight: 1.4
      }),
      onEachFeature: (f, l) => {
        const p = f.properties;
        const meta = [def.meta && def.meta(p), p.op && esc(p.op)].filter(Boolean).join(' · ');
        l.bindPopup(popup(def.cat, esc(p.n || def.cat), meta));
      }
    });
  }

  async function load() {
    const names = Object.keys(LAYERS);
    const results = await Promise.allSettled(
      names.map((n) => fetch(`data/${n}.geojson`).then((r) => {
        if (!r.ok) throw new Error(r.status);
        return r.json();
      }))
    );
    results.forEach((res, i) => {
      const name = names[i];
      const def = LAYERS[name];
      const row = rows[name];
      if (res.status === 'rejected') {
        if (row) { row.classList.add('off'); row.querySelector('b').textContent = '—'; }
        return;
      }
      const gj = res.value;
      const n = gj.features.length;
      total += n;
      groups[name] = def.line ? def.make(gj) : pointLayer(gj, def);
      if (def.on) groups[name].addTo(map);
      if (row) row.querySelector('b').textContent = new Intl.NumberFormat('fr-FR').format(n);
    });
    const totalEl = document.getElementById('total-count');
    if (totalEl) totalEl.textContent = new Intl.NumberFormat('fr-FR').format(total);
  }

  // Panneau de couches.
  const panel = document.getElementById('layers-rows');
  for (const [name, def] of Object.entries(LAYERS)) {
    const row = document.createElement('label');
    row.className = 'layer-row' + (def.on ? '' : ' off');
    row.dataset.layer = name;
    row.innerHTML = `<i class="swatch${def.line ? ' line' : ''}" style="--sw:${def.sw}"></i><span>${def.label}</span><b>…</b><input type="checkbox" ${def.on ? 'checked' : ''}>`;
    row.querySelector('input').addEventListener('change', (e) => {
      const g = groups[name];
      if (!g) return;
      if (e.target.checked) { g.addTo(map); row.classList.remove('off'); }
      else { map.removeLayer(g); row.classList.add('off'); }
    });
    panel.appendChild(row);
    rows[name] = row;
  }

  // « Ma position » — utile sur le terrain.
  const locateBtn = document.getElementById('locate');
  let userMarker = null;
  if (locateBtn) locateBtn.addEventListener('click', () => {
    if (!navigator.geolocation) { locateBtn.textContent = 'Géolocalisation indisponible'; return; }
    locateBtn.textContent = 'Localisation…';
    navigator.geolocation.getCurrentPosition((pos) => {
      const ll = [pos.coords.latitude, pos.coords.longitude];
      if (userMarker) userMarker.remove();
      userMarker = L.marker(ll, {
        icon: L.divIcon({ className: '', html: '<i class="user-dot"></i>', iconSize: [14, 14], iconAnchor: [7, 7] })
      }).addTo(map).bindPopup(popup('Vous êtes ici', 'Ma position', ''));
      map.setView(ll, 14);
      locateBtn.textContent = 'Ma position';
    }, () => { locateBtn.textContent = 'Position refusée'; setTimeout(() => { locateBtn.textContent = 'Ma position'; }, 2500); },
    { enableHighAccuracy: true, timeout: 12000 });
  });

  load();
})();
