const iconSignal = '<span class="station-indicator" aria-hidden="true"><i></i><i></i><i></i></span>';

const baseStations = [
  {
    id: "local",
    name: "Onde Locale",
    label: "OL",
    genre: "En direct",
    city: "Lille Metropole",
    frequency: "101.2 FM",
    program: "Matin Local",
    host: "Claire & Max",
    time: "07:00 - 10:00",
    description: "L'actu locale, la meteo, vos infos et la vie de quartier.",
    tones: [164.8, 220, 329.6],
    colors: ["#2fe0d1", "#ff6b5f"],
    stats: [
      ["12 458", "Auditeurs maintenant", "icon-users"],
      ["101.2 FM", "Lille Metropole", "icon-radio"],
      ["24h/24", "Direct et proximite", "icon-radio"],
      ["120", "Emissions cette semaine", "icon-calendar"]
    ],
    queue: [
      ["Je te laisse", "Appaloosa", "09:12", "#f2a55f", "#dd5f58"],
      ["Lumiere d'hiver", "Louise Combier", "09:07", "#e0bb67", "#7eb6a4"],
      ["Les murs ont des oreilles", "La Nuit Verite", "09:03", "#6f889f", "#d3a15d"],
      ["On s'ra la", "Les Hortensias", "08:59", "#52afa2", "#ef735c"],
      ["Tout recommencer", "Mil", "08:55", "#c75d41", "#232a31"],
      ["Rivages", "Isaac Delusion", "08:50", "#7ab0c4", "#f1d27b"]
    ],
    schedule: [
      ["07:00 - 10:00", "Matin Local", "Claire & Max", "en cours"],
      ["10:00 - 12:00", "Pause Cafe", "Thomas", ""],
      ["12:00 - 13:00", "Info Midi", "Redaction", ""],
      ["13:00 - 15:00", "A Contre-Courant", "Camille", ""],
      ["15:00 - 17:00", "After Local", "Max", ""]
    ],
    spotlights: [
      ["Reportage", "Dans la cour de l'ecole", "Une matinale speciale education.", "#2fe0d1", "#144d53"],
      ["Concert local", "Scene ouverte vendredi", "Les groupes du coin en direct.", "#ff6b5f", "#7b1f42"],
      ["Marche", "Voix de Wazemmes", "Micro-trottoir et bons plans.", "#f3bf45", "#5f4420"]
    ]
  },
  {
    id: "hits",
    name: "Onde Locale Hits",
    label: "HIT",
    genre: "Pop & Hits",
    city: "Playlist nationale",
    frequency: "DAB+",
    program: "Hit Parade",
    host: "Nora",
    time: "09:00 - 12:00",
    description: "Les titres qui bougent le plus cette semaine.",
    tones: [196, 246.9, 392],
    colors: ["#ff6b5f", "#ffd166"],
    stats: [
      ["8 940", "Auditeurs maintenant", "icon-users"],
      ["DAB+", "Flux numerique", "icon-radio"],
      ["64 kb/s", "Demo locale", "icon-cast"],
      ["42", "Nouveautes", "icon-calendar"]
    ],
    queue: [
      ["Rythme clair", "Mara Sol", "09:18", "#ff6b5f", "#ffd166"],
      ["Encore plus haut", "Lena V", "09:14", "#c44ed0", "#f4b849"],
      ["Nuit electrique", "Malo", "09:10", "#2fe0d1", "#144d53"],
      ["Ligne de basse", "Tess", "09:06", "#ff925f", "#28313b"],
      ["Main dans la main", "Joan B.", "09:02", "#f3bf45", "#f06a7c"]
    ],
    schedule: [
      ["08:00 - 10:00", "Wake Up Hits", "Nora", "en cours"],
      ["10:00 - 12:00", "Top Local", "Mika", ""],
      ["12:00 - 14:00", "Mix Lunch", "Nora", ""],
      ["14:00 - 17:00", "Hits Club", "Diane", ""],
      ["17:00 - 19:00", "Drive", "Leo", ""]
    ],
    spotlights: [
      ["Playlist", "Top 12 des auditeurs", "Vote ouvert jusqu'a midi.", "#ff6b5f", "#ffd166"],
      ["Session", "Live electro pop", "Invite studio a 18h.", "#9b5cff", "#2fe0d1"],
      ["Jeu antenne", "Gagnez vos places", "Tirage pendant le Drive.", "#f3bf45", "#ff6b5f"]
    ]
  },
  {
    id: "culture",
    name: "Onde Locale Culture",
    label: "CUL",
    genre: "Culture & Decouvertes",
    city: "Metropole",
    frequency: "Web",
    program: "Carnet Culture",
    host: "Salome",
    time: "09:30 - 11:00",
    description: "Sorties, lectures, scenes independantes et conversations longues.",
    tones: [146.8, 220, 293.6],
    colors: ["#57c7ff", "#f3bf45"],
    stats: [
      ["3 214", "Auditeurs maintenant", "icon-users"],
      ["Web", "Flux culturel", "icon-radio"],
      ["18", "Chroniques", "icon-podcast"],
      ["36", "Rendez-vous", "icon-calendar"]
    ],
    queue: [
      ["Exposition sonore", "Musee voisin", "09:21", "#57c7ff", "#f3bf45"],
      ["Lire la ville", "Ana Torres", "09:13", "#a5d6a7", "#334d5c"],
      ["Plateau theatre", "Collectif Nord", "09:04", "#f3bf45", "#243238"],
      ["Atelier ouvert", "Maison Folie", "08:56", "#57c7ff", "#8e6d4f"]
    ],
    schedule: [
      ["08:00 - 09:30", "Agenda Culture", "Salome", "en cours"],
      ["09:30 - 11:00", "Carnet Culture", "Salome", ""],
      ["11:00 - 12:00", "Long Format", "Rami", ""],
      ["12:00 - 14:00", "Bande Originale", "Ines", ""],
      ["14:00 - 16:00", "Atelier Radio", "Collectif", ""]
    ],
    spotlights: [
      ["Livre", "Bibliotheque de nuit", "Emission speciale vendredi.", "#57c7ff", "#112e43"],
      ["Cinema", "Avant-premiere locale", "Debat apres la seance.", "#f3bf45", "#5f4420"],
      ["Expo", "Dix lieux a visiter", "Le guide audio du week-end.", "#a5d6a7", "#21362f"]
    ]
  },
  {
    id: "chill",
    name: "Onde Locale Chill",
    label: "CHL",
    genre: "Lounge & Chill",
    city: "Session douce",
    frequency: "Web",
    program: "Respiration",
    host: "Imane",
    time: "09:00 - 12:00",
    description: "Ambiances calmes, downtempo, voix posees et pauses lentes.",
    tones: [110, 164.8, 220],
    colors: ["#64df87", "#2fe0d1"],
    stats: [
      ["5 680", "Auditeurs maintenant", "icon-users"],
      ["Web", "Flux chill", "icon-radio"],
      ["Zen", "Mode doux", "icon-cast"],
      ["28", "Sets cette semaine", "icon-calendar"]
    ],
    queue: [
      ["Maree basse", "Sora", "09:16", "#64df87", "#2fe0d1"],
      ["Velours", "Aube Noire", "09:09", "#2fe0d1", "#485563"],
      ["A l'ombre", "Nael", "09:01", "#9dd8c8", "#1e3136"],
      ["Slow City", "Dima", "08:54", "#64df87", "#f3bf45"]
    ],
    schedule: [
      ["07:00 - 09:00", "Reveil Lent", "Imane", "en cours"],
      ["09:00 - 12:00", "Respiration", "Imane", ""],
      ["12:00 - 14:00", "Sieste Urbaine", "Noe", ""],
      ["14:00 - 17:00", "Cafe Glace", "Maya", ""],
      ["17:00 - 20:00", "Retour Doux", "Noe", ""]
    ],
    spotlights: [
      ["Set", "Deux heures sans voix", "Un continuum pour travailler.", "#64df87", "#2fe0d1"],
      ["Balade", "Carnet sonore du port", "Paysages calmes en stereo.", "#8dd7ff", "#213843"],
      ["Nuit", "Chill apres minuit", "Ambiance basse lumiere.", "#f3bf45", "#2b3335"]
    ]
  },
  {
    id: "rock",
    name: "Onde Locale Rock",
    label: "RCK",
    genre: "Rock & Inde",
    city: "Garage local",
    frequency: "Web",
    program: "Ampli Nord",
    host: "Jo",
    time: "09:00 - 11:00",
    description: "Guitares, scenes independantes, demos et lives en cave.",
    tones: [130.8, 196, 261.6],
    colors: ["#ff6b5f", "#bfdb38"],
    stats: [
      ["4 102", "Auditeurs maintenant", "icon-users"],
      ["Web", "Flux rock", "icon-radio"],
      ["Live", "Sessions amplifiees", "icon-cast"],
      ["31", "Groupes suivis", "icon-calendar"]
    ],
    queue: [
      ["Plein volume", "Les Hublots", "09:22", "#ff6b5f", "#bfdb38"],
      ["Rue de nuit", "Orage Sec", "09:17", "#c94236", "#24313a"],
      ["Batterie libre", "Motel Nord", "09:08", "#bfdb38", "#5a2f25"],
      ["Dernier accord", "Rive Gauche", "09:00", "#ff8f5c", "#131b1f"]
    ],
    schedule: [
      ["08:00 - 09:30", "Garage Matin", "Jo", "en cours"],
      ["09:30 - 11:00", "Ampli Nord", "Jo", ""],
      ["11:00 - 13:00", "Inde Radar", "Lise", ""],
      ["13:00 - 15:00", "Riffs & Actus", "Malo", ""],
      ["15:00 - 18:00", "Live Room", "Lise", ""]
    ],
    spotlights: [
      ["Live", "Session garage", "Captation brute ce soir.", "#ff6b5f", "#3c1615"],
      ["Inde", "Nouveaux riffs", "Cinq sorties regionales.", "#bfdb38", "#343a1d"],
      ["Archive", "Affiches et amplis", "Une histoire locale du rock.", "#f3bf45", "#442515"]
    ]
  },
  {
    id: "retro",
    name: "Onde Locale 90s",
    label: "90s",
    genre: "Annees 90 & 2000",
    city: "Souvenirs",
    frequency: "Web",
    program: "Retour Neon",
    host: "Val",
    time: "09:00 - 12:00",
    description: "Dance, pop, RnB et souvenirs de cassettes.",
    tones: [123.5, 185, 277],
    colors: ["#f3bf45", "#57c7ff"],
    stats: [
      ["6 771", "Auditeurs maintenant", "icon-users"],
      ["Web", "Flux retro", "icon-radio"],
      ["1998", "Mood antenne", "icon-cast"],
      ["54", "Classiques", "icon-calendar"]
    ],
    queue: [
      ["Cassette bleue", "The Pagers", "09:19", "#f3bf45", "#57c7ff"],
      ["Minuit minitel", "Lola 2000", "09:12", "#7ad7ff", "#db6b57"],
      ["Club du samedi", "Station 98", "09:06", "#f3bf45", "#4b3422"],
      ["Photos floues", "Mylene K", "08:58", "#57c7ff", "#24343d"]
    ],
    schedule: [
      ["08:00 - 10:00", "Retour Neon", "Val", "en cours"],
      ["10:00 - 12:00", "Mixtape 2000", "Sonia", ""],
      ["12:00 - 14:00", "Pause K7", "Val", ""],
      ["14:00 - 16:00", "Dancefloor", "Sonia", ""],
      ["16:00 - 18:00", "Slow & RnB", "Yanis", ""]
    ],
    spotlights: [
      ["Archive", "Une K7 retrouvee", "La playlist choisie par vous.", "#f3bf45", "#57c7ff"],
      ["Soiree", "Special 1999", "Deux heures de dance locale.", "#ff6b5f", "#352533"],
      ["Duel", "90s contre 2000", "Vote en direct a 17h.", "#64df87", "#2f4741"]
    ]
  }
];

const storage = {
  get(key, fallback) {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch {
      return fallback;
    }
  },
  set(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
  }
};

const state = {
  activeId: storage.get("onde-active-station", "local"),
  favorites: new Set(storage.get("onde-favorites", ["local", "culture", "chill"])),
  customStations: storage.get("onde-custom-stations", []),
  query: "",
  playing: false,
  volume: storage.get("onde-volume", 64) / 100,
  quality: storage.get("onde-quality", "HQ")
};

const els = {
  body: document.body,
  stationList: document.querySelector("#stationList"),
  favoriteList: document.querySelector("#favoriteList"),
  globalSearch: document.querySelector("#globalSearch"),
  stationCover: document.querySelector("#stationCover"),
  coverLabel: document.querySelector("#coverLabel"),
  stationMeta: document.querySelector("#stationMeta"),
  programTitle: document.querySelector("#programTitle"),
  hostLine: document.querySelector("#hostLine"),
  programTime: document.querySelector("#programTime"),
  inlinePlay: document.querySelector("#inlinePlay"),
  mainPlayButton: document.querySelector("#mainPlayButton"),
  miniPlay: document.querySelector("#miniPlay"),
  favoriteButton: document.querySelector("#favoriteButton"),
  shareButton: document.querySelector("#shareButton"),
  moreButton: document.querySelector("#moreButton"),
  qualityButton: document.querySelector("#qualityButton"),
  statsRow: document.querySelector("#statsRow"),
  scheduleGrid: document.querySelector("#scheduleGrid"),
  spotlightGrid: document.querySelector("#spotlightGrid"),
  trackList: document.querySelector("#trackList"),
  miniCover: document.querySelector("#miniCover"),
  miniTitle: document.querySelector("#miniTitle"),
  miniSubtitle: document.querySelector("#miniSubtitle"),
  volumeRange: document.querySelector("#volumeRange"),
  miniVolumeRange: document.querySelector("#miniVolumeRange"),
  waveCanvas: document.querySelector("#waveCanvas"),
  streamAudio: document.querySelector("#streamAudio"),
  addStationForm: document.querySelector("#addStationForm"),
  studioButton: document.querySelector("#studioButton"),
  notifyButton: document.querySelector("#notifyButton"),
  toastRegion: document.querySelector("#toastRegion")
};

let audioContext;
let masterGain;
let demoNodes = [];
let drawFrame = 0;
let playStartedAt = Date.now();

function stations() {
  return [...baseStations, ...state.customStations];
}

function activeStation() {
  return stations().find((station) => station.id === state.activeId) || stations()[0];
}

function initials(name) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
}

function stationMatches(station, query) {
  if (!query) return true;
  const haystack = [station.name, station.genre, station.city, station.program, station.host].join(" ").toLowerCase();
  return haystack.includes(query.toLowerCase());
}

function styleVars(colors) {
  return `--tone-a:${colors[0]};--tone-b:${colors[1]};`;
}

function renderStationList() {
  const filtered = stations().filter((station) => stationMatches(station, state.query));
  els.stationList.innerHTML = filtered.map((station) => `
    <button class="station-card ${station.id === state.activeId ? "is-active" : ""}" type="button" data-station="${station.id}">
      <span class="station-logo" style="${styleVars(station.colors)}"><span>${station.label || initials(station.name)}</span></span>
      <span>
        <strong>${station.name}</strong>
        <small>${station.genre}</small>
      </span>
      ${iconSignal}
    </button>
  `).join("");

  if (!filtered.length) {
    els.stationList.innerHTML = `<p class="empty-state">Aucune station ne correspond a votre recherche.</p>`;
  }
}

function renderFavorites() {
  const favorites = stations().filter((station) => state.favorites.has(station.id));
  els.favoriteList.innerHTML = favorites.map((station) => `
    <button class="favorite-card" type="button" data-station="${station.id}">
      <span class="station-logo" style="${styleVars(station.colors)}"><span>${station.label || initials(station.name)}</span></span>
      <span>
        <strong>${station.name}</strong>
        <small>${station.city}</small>
      </span>
      <span class="more-dot" aria-hidden="true"></span>
    </button>
  `).join("");

  if (!favorites.length) {
    els.favoriteList.innerHTML = `<p class="empty-state">Ajoutez une station en favori pour la retrouver ici.</p>`;
  }
}

function renderStats(station) {
  els.statsRow.innerHTML = station.stats.map(([value, label, icon]) => `
    <div class="stat-item">
      <svg aria-hidden="true"><use href="#${icon}"></use></svg>
      <div>
        <dt>${value}</dt>
        <dd>${label}</dd>
      </div>
    </div>
  `).join("");
}

function renderSchedule(station) {
  els.scheduleGrid.innerHTML = station.schedule.map(([time, title, host, status], index) => `
    <article class="schedule-card ${status ? "is-current" : ""}">
      ${status ? `<span>${status}</span>` : ""}
      <time>${time}</time>
      <h3>${title}</h3>
      <p>${host}</p>
      <p>${index === 0 ? station.description : "Selection antenne, infos pratiques et decouvertes locales."}</p>
    </article>
  `).join("");
}

function renderSpotlights(station) {
  els.spotlightGrid.innerHTML = station.spotlights.map(([type, title, copy, colorA, colorB]) => `
    <article class="spotlight-card" style="--tone-a:${colorA};--tone-b:${colorB};">
      <small>${type}</small>
      <h3>${title}</h3>
      <p>${copy}</p>
    </article>
  `).join("");
}

function renderTracks(station) {
  els.trackList.innerHTML = station.queue.map(([title, artist, time, colorA, colorB], index) => `
    <article class="track-card ${index === 0 ? "is-current" : ""}">
      <span class="track-art" style="--tone-a:${colorA};--tone-b:${colorB};"><span>${initials(title)}</span></span>
      <span class="track-copy">
        <strong>${title}</strong>
        <span>${artist}</span>
        <small>${time}</small>
      </span>
      <span class="more-dot" aria-hidden="true"></span>
    </article>
  `).join("");
}

function iconForPlay() {
  return state.playing ? "#icon-pause" : "#icon-play";
}

function setPlayIcons() {
  const icon = iconForPlay();
  [els.mainPlayButton, els.miniPlay].forEach((button) => {
    button.innerHTML = `<svg><use href="${icon}"></use></svg>`;
    button.setAttribute("aria-label", state.playing ? "Mettre en pause" : "Lancer la lecture");
  });
  els.inlinePlay.innerHTML = `<svg><use href="${icon}"></use></svg><span>${state.playing ? "Pause" : "Ecouter"}</span>`;
  els.body.classList.toggle("is-playing", state.playing);
}

function renderActiveStation() {
  const station = activeStation();
  document.documentElement.style.setProperty("--accent", station.colors[0]);
  els.stationCover.setAttribute("style", styleVars(station.colors));
  els.miniCover.setAttribute("style", styleVars(station.colors));
  els.coverLabel.textContent = station.label || initials(station.name);
  els.stationMeta.textContent = `${station.name} - ${station.frequency} - ${station.city}`;
  els.programTitle.textContent = station.program;
  els.hostLine.textContent = `avec ${station.host}`;
  els.programTime.textContent = station.time;
  els.miniTitle.textContent = station.program;
  els.miniSubtitle.textContent = `avec ${station.host} - ${station.time}`;
  els.favoriteButton.classList.toggle("is-active", state.favorites.has(station.id));
  els.favoriteButton.setAttribute("aria-pressed", String(state.favorites.has(station.id)));
  els.qualityButton.textContent = state.quality;
  renderStationList();
  renderFavorites();
  renderStats(station);
  renderSchedule(station);
  renderSpotlights(station);
  renderTracks(station);
  drawWave();
}

function selectStation(id, shouldPlay = false) {
  if (state.activeId === id && !shouldPlay) return;
  state.activeId = id;
  storage.set("onde-active-station", id);
  renderActiveStation();
  if (state.playing || shouldPlay) {
    startPlayback();
  }
}

function ensureAudioContext() {
  if (!audioContext) {
    audioContext = new AudioContext();
    masterGain = audioContext.createGain();
    masterGain.gain.value = state.volume;
    masterGain.connect(audioContext.destination);
  }
  return audioContext.resume();
}

function stopDemo() {
  demoNodes.forEach((node) => {
    try {
      if (node.stop) node.stop();
      if (node.disconnect) node.disconnect();
    } catch {
      // Already stopped.
    }
  });
  demoNodes = [];
}

async function startDemo(station) {
  await ensureAudioContext();
  stopDemo();
  const now = audioContext.currentTime;
  const filter = audioContext.createBiquadFilter();
  filter.type = "lowpass";
  filter.frequency.value = 920;
  filter.Q.value = 0.7;
  filter.connect(masterGain);
  demoNodes.push(filter);

  station.tones.forEach((frequency, index) => {
    const oscillator = audioContext.createOscillator();
    const gain = audioContext.createGain();
    const lfo = audioContext.createOscillator();
    const lfoGain = audioContext.createGain();

    oscillator.type = index === 0 ? "sine" : index === 1 ? "triangle" : "sawtooth";
    oscillator.frequency.value = frequency;
    gain.gain.value = 0.012 + index * 0.004;
    lfo.frequency.value = 0.08 + index * 0.035;
    lfoGain.gain.value = 0.008;

    lfo.connect(lfoGain);
    lfoGain.connect(gain.gain);
    oscillator.connect(gain);
    gain.connect(filter);
    oscillator.start(now);
    lfo.start(now);
    demoNodes.push(oscillator, gain, lfo, lfoGain);
  });
}

async function startPlayback() {
  const station = activeStation();
  playStartedAt = Date.now();
  state.playing = true;
  setPlayIcons();

  if (station.streamUrl) {
    stopDemo();
    els.streamAudio.src = station.streamUrl;
    els.streamAudio.volume = state.volume;
    try {
      await els.streamAudio.play();
      toast(`Lecture de ${station.name}`);
    } catch {
      state.playing = false;
      setPlayIcons();
      toast("Le navigateur bloque ce flux. Verifiez l'URL ou essayez un autre format.");
    }
    return;
  }

  els.streamAudio.pause();
  els.streamAudio.removeAttribute("src");
  await startDemo(station);
  toast(`Lecture demo de ${station.name}`);
}

function pausePlayback() {
  state.playing = false;
  els.streamAudio.pause();
  stopDemo();
  setPlayIcons();
}

function togglePlayback() {
  if (state.playing) {
    pausePlayback();
  } else {
    startPlayback();
  }
}

function setVolume(value) {
  state.volume = value / 100;
  storage.set("onde-volume", value);
  els.volumeRange.value = value;
  els.miniVolumeRange.value = value;
  els.streamAudio.volume = state.volume;
  if (masterGain) {
    masterGain.gain.value = state.volume;
  }
}

function toggleFavorite() {
  const station = activeStation();
  if (state.favorites.has(station.id)) {
    state.favorites.delete(station.id);
    toast(`${station.name} retiree des favoris`);
  } else {
    state.favorites.add(station.id);
    toast(`${station.name} ajoutee aux favoris`);
  }
  storage.set("onde-favorites", [...state.favorites]);
  renderActiveStation();
}

function addCustomStation(formData) {
  const name = formData.get("name").toString().trim();
  const url = formData.get("url").toString().trim();
  const city = formData.get("city").toString().trim() || "Flux personnel";
  const id = `custom-${Date.now()}`;
  const colors = ["#2fe0d1", "#f3bf45"];
  const station = {
    id,
    name,
    label: initials(name),
    genre: "Station ajoutee",
    city,
    frequency: "Stream",
    streamUrl: url,
    program: "Flux en direct",
    host: name,
    time: "Maintenant",
    description: "Station ajoutee depuis une URL de flux.",
    tones: [120, 180, 240],
    colors,
    stats: [
      ["Perso", "Station ajoutee", "icon-users"],
      ["Stream", city, "icon-radio"],
      [state.quality, "Qualite demandee", "icon-cast"],
      ["1", "Flux configure", "icon-calendar"]
    ],
    queue: [
      ["Flux en direct", name, "Live", colors[0], colors[1]],
      ["Connexion au stream", city, "Maintenant", "#57c7ff", "#2fe0d1"]
    ],
    schedule: [
      ["Maintenant", "Flux en direct", name, "en cours"],
      ["Ensuite", "Programme du flux", city, ""],
      ["Plus tard", "Emission distante", "Station", ""],
      ["Archive", "A configurer", "Studio", ""],
      ["Nuit", "Flux continu", "Auto", ""]
    ],
    spotlights: [
      ["Nouveau", name, "Station ajoutee a votre navigateur.", colors[0], colors[1]],
      ["Stream", city, "Lecture depuis l'URL fournie.", "#57c7ff", "#263b46"],
      ["Favori", "Gardez ce flux", "Ajoutez-le a vos favoris.", "#f3bf45", "#5f4420"]
    ]
  };
  state.customStations.push(station);
  storage.set("onde-custom-stations", state.customStations);
  state.favorites.add(id);
  storage.set("onde-favorites", [...state.favorites]);
  selectStation(id, false);
  toast(`${name} a ete ajoutee`);
}

function toast(message) {
  const item = document.createElement("div");
  item.className = "toast";
  item.textContent = message;
  els.toastRegion.append(item);
  window.setTimeout(() => item.remove(), 3600);
}

function drawWave() {
  const canvas = els.waveCanvas;
  const context = canvas.getContext("2d");
  const rect = canvas.getBoundingClientRect();
  const scale = window.devicePixelRatio || 1;
  const width = Math.max(1, Math.floor(rect.width * scale));
  const height = Math.max(1, Math.floor(rect.height * scale));
  if (canvas.width !== width || canvas.height !== height) {
    canvas.width = width;
    canvas.height = height;
  }
  context.clearRect(0, 0, width, height);
  const station = activeStation();
  const bars = Math.max(36, Math.floor(width / 12));
  const gap = 4 * scale;
  const barWidth = Math.max(2 * scale, width / bars - gap);
  const time = Date.now() / 600;
  for (let index = 0; index < bars; index += 1) {
    const tone = station.tones[index % station.tones.length] / 110;
    const motion = state.playing ? Math.sin(time + index * 0.55) * 0.5 + Math.cos(time * 0.68 + index * 0.23) * 0.5 : 0.18;
    const base = state.playing ? 0.34 : 0.12;
    const amplitude = base + Math.abs(motion) * (0.28 + tone * 0.04);
    const barHeight = Math.max(6 * scale, height * Math.min(0.9, amplitude));
    const x = index * (barWidth + gap);
    const y = (height - barHeight) / 2;
    const gradient = context.createLinearGradient(0, y, 0, y + barHeight);
    gradient.addColorStop(0, station.colors[1]);
    gradient.addColorStop(0.45, station.colors[0]);
    gradient.addColorStop(1, "rgba(47,224,209,0.45)");
    context.fillStyle = gradient;
    context.fillRect(x, y, barWidth, barHeight);
  }
  cancelAnimationFrame(drawFrame);
  drawFrame = requestAnimationFrame(drawWave);
}

function updateElapsed() {
  if (!state.playing) return;
  const diff = Date.now() - playStartedAt + 5025000;
  const total = Math.floor(diff / 1000);
  const hours = String(Math.floor(total / 3600)).padStart(2, "0");
  const minutes = String(Math.floor((total % 3600) / 60)).padStart(2, "0");
  const seconds = String(total % 60).padStart(2, "0");
  document.querySelector("#elapsedTime").textContent = `${hours}:${minutes}:${seconds}`;
}

function handleNav(action, button) {
  document.querySelectorAll(".nav-button").forEach((item) => item.classList.remove("is-active"));
  button.classList.add("is-active");
  if (action === "programs") {
    document.querySelector("#scheduleSection").scrollIntoView({ behavior: "smooth", block: "start" });
  } else if (action === "podcasts") {
    document.querySelector("#spotlightSection").scrollIntoView({ behavior: "smooth", block: "start" });
    toast("Les replays et podcasts arrivent dans cette selection.");
  } else if (action === "local") {
    toast("Infos locales: circulation fluide, meteo douce, agenda charge ce soir.");
  } else if (action === "about") {
    toast("Onde Locale est une radio web de proximite, pensee pour les quartiers et associations.");
  } else {
    document.querySelector("#livePanel").scrollIntoView({ behavior: "smooth", block: "start" });
  }
}

document.addEventListener("click", (event) => {
  const stationButton = event.target.closest("[data-station]");
  if (stationButton) {
    selectStation(stationButton.dataset.station, false);
    return;
  }

  const navButton = event.target.closest(".nav-button");
  if (navButton) {
    handleNav(navButton.dataset.action, navButton);
  }
});

[els.inlinePlay, els.mainPlayButton, els.miniPlay].forEach((button) => {
  button.addEventListener("click", togglePlayback);
});

[document.querySelector("#rewindButton"), document.querySelector("#miniRewind")].forEach((button) => {
  button.addEventListener("click", () => toast("Retour de 10 secondes simule sur le direct."));
});

[document.querySelector("#forwardButton"), document.querySelector("#miniForward")].forEach((button) => {
  button.addEventListener("click", () => toast("Le direct reprend au point le plus recent."));
});

els.favoriteButton.addEventListener("click", toggleFavorite);

els.shareButton.addEventListener("click", async () => {
  const station = activeStation();
  const text = `J'ecoute ${station.name} sur Onde Locale`;
  if (navigator.share) {
    await navigator.share({ title: station.name, text, url: location.href });
  } else {
    await navigator.clipboard?.writeText(`${text} - ${location.href}`);
    toast("Lien copie dans le presse-papiers");
  }
});

els.moreButton.addEventListener("click", () => toast("Options: alarme, historique et export M3U peuvent etre branches ici."));
els.notifyButton.addEventListener("click", () => toast("Notifications antenne activees pour cette session."));
document.querySelector("#castButton").addEventListener("click", () => toast("Cast detectera les appareils disponibles dans une integration complete."));
document.querySelector("#queueButton").addEventListener("click", () => document.querySelector(".queue-panel").scrollIntoView({ behavior: "smooth" }));
document.querySelector("#fullSchedule").addEventListener("click", () => toast("Grille complete: vue jour/semaine prete a connecter."));
document.querySelector("#seeAllSpotlights").addEventListener("click", () => toast("Toutes les selections seront affichees dans la vue podcasts."));
document.querySelector("#manageFavorites").addEventListener("click", () => toast("Cliquez sur Favori dans le lecteur pour ajouter ou retirer la station."));
document.querySelector("#whatsappLink").addEventListener("click", (event) => {
  event.preventDefault();
  toast("Connectez un numero WhatsApp Business pour ouvrir la conversation.");
});

els.qualityButton.addEventListener("click", () => {
  state.quality = state.quality === "HQ" ? "Eco" : "HQ";
  storage.set("onde-quality", state.quality);
  els.qualityButton.textContent = state.quality;
  toast(`Mode ${state.quality} selectionne`);
});

els.globalSearch.addEventListener("input", (event) => {
  state.query = event.target.value.trim();
  renderStationList();
});

document.addEventListener("keydown", (event) => {
  if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") {
    event.preventDefault();
    els.globalSearch.focus();
  }
  if (event.code === "Space" && event.target === document.body) {
    event.preventDefault();
    togglePlayback();
  }
});

els.volumeRange.addEventListener("input", (event) => setVolume(Number(event.target.value)));
els.miniVolumeRange.addEventListener("input", (event) => setVolume(Number(event.target.value)));

els.studioButton.addEventListener("click", () => {
  els.addStationForm.scrollIntoView({ behavior: "smooth", block: "center" });
  els.addStationForm.querySelector("input").focus({ preventScroll: true });
});

els.addStationForm.addEventListener("submit", (event) => {
  event.preventDefault();
  addCustomStation(new FormData(els.addStationForm));
  els.addStationForm.reset();
});

els.streamAudio.addEventListener("ended", pausePlayback);
els.streamAudio.addEventListener("error", () => {
  if (state.playing && activeStation().streamUrl) {
    state.playing = false;
    setPlayIcons();
    toast("Impossible de lire ce flux. Certains streams bloquent la lecture web.");
  }
});

window.addEventListener("resize", drawWave);
setInterval(updateElapsed, 1000);

setVolume(Math.round(state.volume * 100));
renderActiveStation();
setPlayIcons();
