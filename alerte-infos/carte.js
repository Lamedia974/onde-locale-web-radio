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

  // Fond de tuiles OSM — désactivable (aperçus hors ligne / artifacts).
  let tiles = null;
  let tilesLoaded = false;
  if (!window.CARTE_NO_TILES) {
    tiles = L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
    }).addTo(map);
  }
  L.control.scale({ imperial: false, position: 'bottomleft' }).addTo(map);

  // La carte s'affiche toujours : le littoral réel de l'île sert de fond de
  // secours (île blanche cerclée d'encre, façon Modernist). Dès que les
  // tuiles OSM répondent, l'île s'efface pour laisser voir le terrain.
  map.createPane('ile');
  map.getPane('ile').style.zIndex = 250;
  let ileLayer = null;
  const ghostIle = () => {
    if (ileLayer && tilesLoaded) ileLayer.setStyle({ fillOpacity: 0, opacity: .4, weight: 1.5 });
  };
  if (tiles) tiles.once('tileload', () => { tilesLoaded = true; ghostIle(); });

  // Pictogrammes des épingles — glyphes maison dans l'esprit Lucide du
  // design system (fill currentColor, 24×24).
  const GLYPHS = {
    wc: '<b class="pin-wc">WC</b>',
    eau: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 3c3.6 4.3 5.7 7 5.7 9.6a5.7 5.7 0 0 1-11.4 0C6.3 10 8.4 7.3 12 3z"/></svg>',
    picnic: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M4.5 8.5h15M9.7 8.5l-3.4 11M14.3 8.5l3.4 11M6.9 14.5h10.2"/></svg>',
    mairie: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 3 3.5 8.5h17L12 3zM5 10h2.4v6.2H5zm5.8 0h2.4v6.2h-2.4zm5.8 0H19v6.2h-2.4zM4 17.8h16v2.4H4z"/></svg>',
    sante: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M9.5 4h5v5.5H20v5h-5.5V20h-5v-5.5H4v-5h5.5z"/></svg>',
    ecole: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 4 2.5 8.8 12 13.6l7.5-3.8v5h2v-6L12 4zM6.5 13v3.2c0 1.8 2.5 3.2 5.5 3.2s5.5-1.4 5.5-3.2V13L12 15.8 6.5 13z"/></svg>'
  };

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
    toilettes: { label: 'Toilettes publiques', sw: '#ec3013', on: true, cat: 'Toilettes publiques', icon: GLYPHS.wc,
      meta: (p) => [p.fee === 'yes' ? 'payantes' : p.fee === 'no' ? 'gratuites' : '', p.wc === 'yes' ? 'accès PMR' : ''].filter(Boolean).join(' · ') },
    eau: { label: 'Eau potable', sw: '#201e1d', on: true, cat: 'Point d\'eau potable', icon: GLYPHS.eau },
    picnic: { label: 'Aires de pique-nique', sw: '#ff7a60', on: true, cat: 'Aire de pique-nique', icon: GLYPHS.picnic },
    mairies: { label: 'Mairies & annexes', sw: '#ae1800', on: true, cat: 'Mairie', icon: GLYPHS.mairie },
    sante: { label: 'Hôpitaux & cliniques', sw: '#7c1405', on: true, cat: 'Santé', icon: GLYPHS.sante,
      meta: (p) => [p.type === 'hospital' ? 'hôpital' : p.type === 'clinic' ? 'clinique' : '', p.urg === 'yes' ? 'urgences' : ''].filter(Boolean).join(' · ') },
    ecoles: { label: 'Écoles', sw: '#9b9797', on: false, cat: 'École', icon: GLYPHS.ecole }
  };

  const groups = {};
  const rows = {};
  let total = 0;

  // Épingles à pictogrammes, regroupées en grappes quand on dézoome.
  function pointLayer(gj, def) {
    const cluster = L.markerClusterGroup({
      maxClusterRadius: 46,
      showCoverageOnHover: false,
      spiderfyOnMaxZoom: true,
      iconCreateFunction: (c) => {
        const n = c.getChildCount();
        const s = n < 10 ? 30 : n < 50 ? 37 : 45;
        return L.divIcon({
          className: '',
          html: `<i class="poi-cluster" style="--c:${def.sw};width:${s}px;height:${s}px">${n}</i>`,
          iconSize: [s, s]
        });
      }
    });
    const icon = L.divIcon({
      className: '',
      html: `<i class="poi-pin" style="--c:${def.sw}">${def.icon}</i>`,
      iconSize: [28, 34],
      iconAnchor: [14, 32],
      popupAnchor: [0, -30]
    });
    cluster.addLayer(L.geoJSON(gj, {
      pointToLayer: (f, latlng) => L.marker(latlng, { icon }),
      onEachFeature: (f, l) => {
        const p = f.properties;
        const meta = [def.meta && def.meta(p), p.op && esc(p.op)].filter(Boolean).join(' · ');
        l.bindPopup(popup(def.cat, esc(p.n || def.cat), meta));
      }
    }));
    return cluster;
  }

  // Données : soit injectées dans la page (window.CARTE_DATA), soit chargées
  // depuis data/*.geojson.
  const getData = (name) => {
    if (window.CARTE_DATA) {
      return window.CARTE_DATA[name]
        ? Promise.resolve(window.CARTE_DATA[name])
        : Promise.reject(new Error('absent'));
    }
    return fetch(`data/${name}.geojson`).then((r) => {
      if (!r.ok) throw new Error(r.status);
      return r.json();
    });
  };

  getData('ile').then((gj) => {
    ileLayer = L.geoJSON(gj, {
      pane: 'ile',
      interactive: false,
      style: { color: '#201e1d', weight: 2, fillColor: '#ffffff', fillOpacity: 1 }
    }).addTo(map);
    ghostIle();
  }).catch(() => {});

  async function load() {
    const names = Object.keys(LAYERS);
    const results = await Promise.allSettled(names.map(getData));
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
