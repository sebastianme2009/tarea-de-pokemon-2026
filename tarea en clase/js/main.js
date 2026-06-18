const form = document.querySelector('#search-form');
const input = document.querySelector('#pokemon-input');
const statusArea = document.querySelector('#status-area');
const loadingState = document.querySelector('#loading-state');
const featuredGrid = document.querySelector('#featured-grid');
const featuredCount = document.querySelector('#featured-count');
const pokemonDetail = document.querySelector('#pokemon-detail');
const typeChips = document.querySelector('#type-chips');
const typeCount = document.querySelector('#type-count');
const typeLibrary = document.querySelector('#type-library');
const generationChips = document.querySelector('#generation-chips');
const generationCount = document.querySelector('#generation-count');
const generationLibrary = document.querySelector('#generation-library');
const viewTabs = document.querySelectorAll('[data-scroll-to]');

const DEFAULT_QUERY = 'charizard';
const FEATURED_POKEMON = [
  'pikachu',
  'charizard',
  'bulbasaur',
  'squirtle',
  'eevee',
  'mewtwo',
  'gengar',
  'lucario',
  'greninja',
  'snorlax',
  'dragonite',
  'arcanine'
];

const DEFAULT_TYPE_ORDER = [
  'normal', 'fire', 'water', 'electric', 'grass', 'ice', 'fighting', 'poison',
  'ground', 'flying', 'psychic', 'bug', 'rock', 'ghost', 'dragon', 'dark', 'steel', 'fairy'
];

const typeColors = {
  normal: '#A8A77A',
  fire: '#EE8130',
  water: '#6390F0',
  electric: '#F7D02C',
  grass: '#7AC74C',
  ice: '#96D9D6',
  fighting: '#C22E28',
  poison: '#A33EA1',
  ground: '#E2BF65',
  flying: '#A98FF3',
  psychic: '#F95587',
  bug: '#A6B91A',
  rock: '#B6A136',
  ghost: '#735797',
  dragon: '#6F35FC',
  dark: '#705746',
  steel: '#B7B7CE',
  fairy: '#D685AD'
};

const state = {
  currentQuery: '',
  requestId: 0,
  activeView: 'featured-section',
  pokemonCache: new Map(),
  typeRosterCache: new Map(),
  generationRosterCache: new Map(),
  typeNames: [],
  generationNames: [],
  featuredRoster: [],
  selectedType: '',
  selectedGeneration: ''
};

function normalizeQuery(value) {
  return value.trim().toLowerCase();
}

function capitalize(value) {
  return String(value)
    .replace(/-/g, ' ')
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function toPokemonId(value) {
  return `#${String(value).padStart(4, '0')}`;
}

function getTypeColor(type) {
  return typeColors[type] || '#64748b';
}

function getPrimaryType(types) {
  return types[0] || 'normal';
}

function buildSvgFallback(name, subtitle, accentA, accentB) {
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="900" height="900" viewBox="0 0 900 900">
      <defs>
        <linearGradient id="g" x1="0" x2="1" y1="0" y2="1">
          <stop offset="0%" stop-color="${accentA}" />
          <stop offset="100%" stop-color="${accentB}" />
        </linearGradient>
      </defs>
      <rect width="900" height="900" rx="48" fill="#090d16" />
      <circle cx="650" cy="220" r="200" fill="${accentA}" opacity="0.16" />
      <circle cx="230" cy="690" r="240" fill="${accentB}" opacity="0.14" />
      <rect x="70" y="70" width="760" height="760" rx="36" fill="url(#g)" opacity="0.16" />
      <text x="450" y="390" fill="#f6f7fb" font-family="Fraunces, Georgia, serif" font-size="78" font-weight="700" text-anchor="middle">${name}</text>
      <text x="450" y="470" fill="#acb5c7" font-family="JetBrains Mono, Arial, sans-serif" font-size="28" text-anchor="middle">${subtitle}</text>
      <rect x="220" y="550" width="460" height="14" rx="7" fill="rgba(255,255,255,0.34)" />
      <rect x="260" y="596" width="380" height="14" rx="7" fill="rgba(255,255,255,0.22)" />
      <text x="450" y="760" fill="#f97373" font-family="JetBrains Mono, Arial, sans-serif" font-size="26" text-anchor="middle">Biblioteca Pokédex</text>
    </svg>
  `;

  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg.replace(/\s+/g, ' ').trim())}`;
}

function createFallbackPokemon(query) {
  return {
    id: 0,
    slug: normalizeQuery(query || 'pokemon'),
    name: capitalize(query || 'pokemon'),
    sprite: buildSvgFallback('Pokémon', 'Fallback visual', '#ef4444', '#fbbf24'),
    artwork: buildSvgFallback('Pokémon', 'Fallback visual', '#ef4444', '#fbbf24'),
    types: ['normal'],
    height: 0,
    weight: 0,
    generation: 'N/D',
    genus: 'Pokémon de respaldo',
    habitat: 'N/D',
    captureRate: 'N/D',
    growthRate: 'N/D',
    baseFriendship: 'N/D',
    color: 'N/D',
    shape: 'N/D',
    abilities: ['N/D'],
    stats: {
      hp: 0,
      attack: 0,
      defense: 0,
      specialAttack: 0,
      specialDefense: 0,
      speed: 0
    },
    description: 'PokeAPI no respondió a tiempo. Se muestra una ficha de respaldo para mantener activa la biblioteca.'
  };
}

function createFallbackCollection() {
  return FEATURED_POKEMON.slice(0, 8).map((name, index) => ({
    id: index + 1,
    slug: name,
    name: capitalize(name),
    sprite: buildSvgFallback(capitalize(name), 'Colección local', '#ef4444', '#f97373'),
    artwork: buildSvgFallback(capitalize(name), 'Colección local', '#ef4444', '#f97373'),
    types: ['normal'],
    height: 10,
    weight: 100,
    generation: 'N/D',
    genus: 'Pokémon destacado',
    habitat: 'N/D',
    captureRate: 'N/D',
    growthRate: 'N/D',
    baseFriendship: 'N/D',
    color: 'N/D',
    shape: 'N/D',
    abilities: ['N/D'],
    stats: {
      hp: 0,
      attack: 0,
      defense: 0,
      specialAttack: 0,
      specialDefense: 0,
      speed: 0
    },
    description: 'Ficha local utilizada como respaldo visual.'
  }));
}

function setStatus(message, isError = false) {
  statusArea.textContent = message;
  statusArea.classList.toggle('is-error', isError);
}

function setLoading(isLoading) {
  loadingState.classList.toggle('is-hidden', !isLoading);
}

function setActiveTab(targetId) {
  state.activeView = targetId;
  viewTabs.forEach((button) => {
    button.classList.toggle('is-active', button.dataset.scrollTo === targetId);
  });
}

function scrollToSection(targetId) {
  const target = document.getElementById(targetId);
  if (!target) {
    return;
  }

  setActiveTab(targetId);
  target.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

async function fetchJson(url, { timeout = 12000, retries = 1 } = {}) {
  let lastError = null;

  for (let attempt = 0; attempt <= retries; attempt += 1) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
      const response = await fetch(url, { signal: controller.signal });
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      lastError = error;
    } finally {
      clearTimeout(timeoutId);
    }
  }

  throw lastError;
}

async function getPokemonProfile(identifier) {
  const key = String(identifier).toLowerCase();
  if (state.pokemonCache.has(key)) {
    return state.pokemonCache.get(key);
  }

  const pokemon = await fetchJson(`https://pokeapi.co/api/v2/pokemon/${encodeURIComponent(key)}`);
  const species = await fetchJson(pokemon.species.url);
  const genusEntry = species.genera.find((entry) => entry.language.name === 'es')
    || species.genera.find((entry) => entry.language.name === 'en');
  const flavorEntry = species.flavor_text_entries.find((entry) => entry.language.name === 'es')
    || species.flavor_text_entries.find((entry) => entry.language.name === 'en');

  const profile = {
    id: pokemon.id,
    slug: pokemon.name,
    name: capitalize(pokemon.name),
    sprite: pokemon.sprites.other?.['official-artwork']?.front_default || pokemon.sprites.front_default || buildSvgFallback(capitalize(pokemon.name), 'Sin sprite', '#ef4444', '#fbbf24'),
    artwork: pokemon.sprites.other?.['official-artwork']?.front_default || pokemon.sprites.front_default || buildSvgFallback(capitalize(pokemon.name), 'Sin sprite', '#ef4444', '#fbbf24'),
    types: pokemon.types.map((entry) => entry.type.name),
    height: pokemon.height,
    weight: pokemon.weight,
    generation: species.generation?.name || 'N/D',
    genus: genusEntry?.genus || 'Pokémon',
    habitat: species.habitat?.name || 'Desconocido',
    captureRate: species.capture_rate ?? 'N/D',
    growthRate: species.growth_rate?.name || 'N/D',
    baseFriendship: species.base_happiness ?? 'N/D',
    color: species.color?.name || 'N/D',
    shape: species.shape?.name || 'N/D',
    abilities: pokemon.abilities.map((entry) => capitalize(entry.ability.name)),
    stats: {
      hp: pokemon.stats.find((stat) => stat.stat.name === 'hp')?.base_stat ?? 0,
      attack: pokemon.stats.find((stat) => stat.stat.name === 'attack')?.base_stat ?? 0,
      defense: pokemon.stats.find((stat) => stat.stat.name === 'defense')?.base_stat ?? 0,
      specialAttack: pokemon.stats.find((stat) => stat.stat.name === 'special-attack')?.base_stat ?? 0,
      specialDefense: pokemon.stats.find((stat) => stat.stat.name === 'special-defense')?.base_stat ?? 0,
      speed: pokemon.stats.find((stat) => stat.stat.name === 'speed')?.base_stat ?? 0
    },
    description: (flavorEntry?.flavor_text || 'No se encontró descripción disponible.')
      .replace(/\f|\n|\r/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
  };

  state.pokemonCache.set(key, profile);
  return profile;
}

function normalizeEntries(entries) {
  return [...new Set(entries.map((entry) => entry.toLowerCase()))];
}

function renderTypeChips() {
  typeChips.innerHTML = '';
  state.typeNames.forEach((typeName) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'chip-button';
    button.dataset.type = typeName;
    button.textContent = capitalize(typeName);
    button.style.borderColor = `${getTypeColor(typeName)}55`;
    button.style.boxShadow = `inset 0 0 0 1px ${getTypeColor(typeName)}22`;
    typeChips.appendChild(button);
  });
}

function renderGenerationChips() {
  generationChips.innerHTML = '';
  state.generationNames.forEach((generationName) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'chip-button';
    button.dataset.generation = generationName;
    button.textContent = capitalize(generationName.replace('generation-', 'gen '));
    generationChips.appendChild(button);
  });
}

function buildPillMarkup(values) {
  return values.map((value) => {
    const color = getTypeColor(value);
    return `<span class="type-pill" style="background:${color}22;border-color:${color}55;color:${color}">${capitalize(value)}</span>`;
  }).join('');
}

function buildStatMarkup(label, value, max = 255) {
  const width = Math.max(0, Math.min(100, Math.round((value / max) * 100)));
  return `
    <article class="stat-card">
      <header>
        <span class="stat-label">${label}</span>
        <strong>${value}</strong>
      </header>
      <div class="stat-bar" aria-hidden="true">
        <div class="stat-fill" style="width:${width}%"></div>
      </div>
    </article>
  `;
}

function buildLibraryCard(profile) {
  const primaryType = getPrimaryType(profile.types);
  return `
    <button class="library-card reveal" type="button" data-pokemon="${profile.slug}" style="--card-accent:${getTypeColor(primaryType)}">
      <div class="library-card__art">
        <img src="${profile.artwork}" alt="${profile.name}">
      </div>
      <div class="library-card__body">
        <p class="meta">${toPokemonId(profile.id)} · ${capitalize(profile.generation)}</p>
        <h3 class="card-name">${profile.name}</h3>
        <p class="card-note">${profile.genus}</p>
        <div class="type-row">${buildPillMarkup(profile.types)}</div>
      </div>
    </button>
  `;
}

function buildCatalogCard(profile, subtitle) {
  const primaryType = getPrimaryType(profile.types);
  return `
    <button class="catalog-card reveal" type="button" data-pokemon="${profile.slug}" style="--card-accent:${getTypeColor(primaryType)}">
      <div class="mini-card">
        <div class="mini-card__art">
          <img src="${profile.sprite}" alt="${profile.name}">
        </div>
        <div class="mini-card__body">
          <h3>${profile.name}</h3>
          <p class="chip-meta">${subtitle}</p>
        </div>
      </div>
    </button>
  `;
}

function buildDetailMarkup(profile) {
  return `
    <section class="pokemon-sheet reveal">
      <div class="detail-hero">
        <div class="detail-art" style="box-shadow: 0 0 0 1px ${getTypeColor(getPrimaryType(profile.types))}33, 0 24px 42px rgba(0,0,0,0.35);">
          <img src="${profile.artwork}" alt="Imagen de ${profile.name}">
        </div>
        <div class="detail-copy">
          <div>
            <p class="meta">${toPokemonId(profile.id)} · ${capitalize(profile.generation)} · ${profile.color}</p>
            <h3 class="detail-title">${profile.name}</h3>
            <p class="card-note">${profile.genus}</p>
          </div>
          <div class="pill-row">${buildPillMarkup(profile.types)}</div>
          <p class="card-note">${profile.description}</p>
        </div>
      </div>

      <div class="bio-grid">
        <article class="bio-card"><span class="bio-label">Altura</span><strong class="bio-value">${(profile.height / 10).toFixed(1)} m</strong></article>
        <article class="bio-card"><span class="bio-label">Peso</span><strong class="bio-value">${(profile.weight / 10).toFixed(1)} kg</strong></article>
        <article class="bio-card"><span class="bio-label">Hábitat</span><strong class="bio-value">${capitalize(profile.habitat)}</strong></article>
        <article class="bio-card"><span class="bio-label">Captura</span><strong class="bio-value">${profile.captureRate}</strong></article>
        <article class="bio-card"><span class="bio-label">Crecimiento</span><strong class="bio-value">${capitalize(profile.growthRate)}</strong></article>
        <article class="bio-card"><span class="bio-label">Habilidad</span><strong class="bio-value">${profile.abilities[0] || 'N/D'}</strong></article>
      </div>

      <div class="stats-panel">
        <div class="stats-grid">
          ${buildStatMarkup('HP', profile.stats.hp)}
          ${buildStatMarkup('Ataque', profile.stats.attack)}
          ${buildStatMarkup('Defensa', profile.stats.defense)}
          ${buildStatMarkup('Ataque Esp.', profile.stats.specialAttack)}
          ${buildStatMarkup('Defensa Esp.', profile.stats.specialDefense)}
          ${buildStatMarkup('Velocidad', profile.stats.speed)}
        </div>
      </div>
    </section>
  `;
}

function renderFeaturedCollection(collection) {
  featuredGrid.innerHTML = collection.map((profile) => buildLibraryCard(profile)).join('');
  featuredCount.textContent = `${collection.length} Pokémon cargados`;
}

function renderCatalogSection(targetElement, roster, subtitleBuilder) {
  if (roster.length === 0) {
    targetElement.innerHTML = '<div class="empty-state"><p>No se encontraron resultados para esta categoría.</p></div>';
    return;
  }

  targetElement.innerHTML = roster.map((profile) => buildCatalogCard(profile, subtitleBuilder(profile))).join('');
}

async function loadCollectionByType(typeName) {
  if (state.typeRosterCache.has(typeName)) {
    return state.typeRosterCache.get(typeName);
  }

  const payload = await fetchJson(`https://pokeapi.co/api/v2/type/${encodeURIComponent(typeName)}`);
  const roster = payload.pokemon
    .map((entry) => entry.pokemon.name)
    .filter((name) => !name.includes('totem'))
    .slice(0, 12);
  const profiles = await Promise.allSettled(roster.map((name) => getPokemonProfile(name)));
  const collection = profiles.filter((entry) => entry.status === 'fulfilled').map((entry) => entry.value);

  state.typeRosterCache.set(typeName, collection);
  return collection;
}

async function loadCollectionByGeneration(generationName) {
  if (state.generationRosterCache.has(generationName)) {
    return state.generationRosterCache.get(generationName);
  }

  const payload = await fetchJson(`https://pokeapi.co/api/v2/generation/${encodeURIComponent(generationName)}`);
  const roster = payload.pokemon_species
    .map((entry) => entry.name)
    .slice(0, 12);
  const profiles = await Promise.allSettled(roster.map((name) => getPokemonProfile(name)));
  const collection = profiles.filter((entry) => entry.status === 'fulfilled').map((entry) => entry.value);

  state.generationRosterCache.set(generationName, collection);
  return collection;
}

async function selectPokemon(identifier) {
  const query = normalizeQuery(identifier);
  if (!query) {
    setStatus('Ingresa un nombre o número válido.', true);
    return;
  }

  state.currentQuery = query;
  const requestId = ++state.requestId;
  setLoading(true);
  setStatus(`Cargando la ficha de ${capitalize(query)}...`);

  try {
    const profile = await getPokemonProfile(query);
    if (state.currentQuery !== query || state.requestId !== requestId) {
      return;
    }

    pokemonDetail.className = 'panel-body';
    pokemonDetail.innerHTML = buildDetailMarkup(profile);
    setStatus(`Ficha lista para ${profile.name}.`);
    setActiveTab('detail-section');
  } catch (error) {
    console.error(error);
    const fallback = createFallbackPokemon(query);
    pokemonDetail.className = 'panel-body';
    pokemonDetail.innerHTML = buildDetailMarkup(fallback);
    setStatus('PokeAPI no respondió; se mostró una ficha de respaldo.', true);
  } finally {
    setLoading(false);
  }
}

async function selectType(typeName) {
  const nextType = typeName === state.selectedType ? '' : typeName;
  state.selectedType = nextType;
  typeChips.querySelectorAll('[data-type]').forEach((button) => {
    button.classList.toggle('is-active', button.dataset.type === nextType);
  });

  if (!nextType) {
    typeLibrary.innerHTML = '<div class="empty-state"><p>Selecciona un tipo para abrir su mini biblioteca.</p></div>';
    return;
  }

  setLoading(true);
  setStatus(`Abriendo la biblioteca del tipo ${capitalize(nextType)}...`);

  try {
    const collection = await loadCollectionByType(nextType);
    renderCatalogSection(typeLibrary, collection, (profile) => `${capitalize(nextType)} · ${toPokemonId(profile.id)}`);
    setStatus(`Se cargaron ${collection.length} Pokémon del tipo ${capitalize(nextType)}.`);
    setActiveTab('type-section');
  } catch (error) {
    console.error(error);
    typeLibrary.innerHTML = '<div class="empty-state"><p>No se pudo cargar esta categoría por el momento.</p></div>';
    setStatus('No se pudo consultar la categoría por tipo.', true);
  } finally {
    setLoading(false);
  }
}

async function selectGeneration(generationName) {
  const nextGeneration = generationName === state.selectedGeneration ? '' : generationName;
  state.selectedGeneration = nextGeneration;
  generationChips.querySelectorAll('[data-generation]').forEach((button) => {
    button.classList.toggle('is-active', button.dataset.generation === nextGeneration);
  });

  if (!nextGeneration) {
    generationLibrary.innerHTML = '<div class="empty-state"><p>Selecciona una generación para abrir su archivo.</p></div>';
    return;
  }

  setLoading(true);
  setStatus(`Abriendo el archivo de ${capitalize(nextGeneration.replace('generation-', 'generación '))}...`);

  try {
    const collection = await loadCollectionByGeneration(nextGeneration);
    renderCatalogSection(generationLibrary, collection, (profile) => `${capitalize(nextGeneration)} · ${profile.genus}`);
    setStatus(`Se cargaron ${collection.length} Pokémon de ${capitalize(nextGeneration.replace('generation-', 'generación '))}.`);
    setActiveTab('generation-section');
  } catch (error) {
    console.error(error);
    generationLibrary.innerHTML = '<div class="empty-state"><p>No se pudo cargar esta generación por el momento.</p></div>';
    setStatus('No se pudo consultar la categoría por generación.', true);
  } finally {
    setLoading(false);
  }
}

function clearPanels() {
  featuredGrid.innerHTML = '<div class="skeleton-stack"><div class="skeleton skeleton-lg"></div><div class="skeleton skeleton-md"></div><div class="skeleton skeleton-sm"></div></div>';
  pokemonDetail.className = 'panel-body empty-state';
  pokemonDetail.innerHTML = '<div class="skeleton-stack"><div class="skeleton skeleton-poster"></div><div class="skeleton skeleton-md"></div><div class="skeleton skeleton-sm"></div></div>';
  typeLibrary.innerHTML = '<div class="skeleton-stack"><div class="skeleton skeleton-card"></div><div class="skeleton skeleton-md"></div></div>';
  generationLibrary.innerHTML = '<div class="skeleton-stack"><div class="skeleton skeleton-card"></div><div class="skeleton skeleton-md"></div></div>';
}

async function loadStaticCatalog() {
  const [typesResult, generationsResult, featuredResult] = await Promise.allSettled([
    fetchJson('https://pokeapi.co/api/v2/type'),
    fetchJson('https://pokeapi.co/api/v2/generation'),
    Promise.allSettled(FEATURED_POKEMON.map((name) => getPokemonProfile(name)))
  ]);

  state.typeNames = typesResult.status === 'fulfilled'
    ? normalizeEntries(typesResult.value.results.map((entry) => entry.name).filter((name) => DEFAULT_TYPE_ORDER.includes(name)))
    : DEFAULT_TYPE_ORDER;

  state.generationNames = generationsResult.status === 'fulfilled'
    ? generationsResult.value.results.map((entry) => entry.name)
    : ['generation-i', 'generation-ii', 'generation-iii', 'generation-iv', 'generation-v', 'generation-vi', 'generation-vii', 'generation-viii'];

  state.featuredRoster = featuredResult.status === 'fulfilled'
    ? featuredResult.value.filter((entry) => entry.status === 'fulfilled').map((entry) => entry.value)
    : createFallbackCollection();

  if (state.featuredRoster.length === 0) {
    state.featuredRoster = createFallbackCollection();
  }

  renderTypeChips();
  renderGenerationChips();
  renderFeaturedCollection(state.featuredRoster);
  typeCount.textContent = `${state.typeNames.length} tipos`;
  generationCount.textContent = `${state.generationNames.length} generaciones`;
}

async function initializeApp() {
  clearPanels();
  setLoading(true);
  setStatus('Preparando la biblioteca Pokémon...');

  try {
    await loadStaticCatalog();

    if (state.featuredRoster[0]) {
      await selectPokemon(state.featuredRoster[0].slug);
    }

    typeLibrary.innerHTML = '<div class="empty-state"><p>Selecciona un tipo para abrir su mini biblioteca.</p></div>';
    generationLibrary.innerHTML = '<div class="empty-state"><p>Selecciona una generación para abrir su archivo.</p></div>';
    setStatus('Biblioteca lista. Usa la búsqueda o navega por tipos y generaciones.');
  } catch (error) {
    console.error(error);
    state.featuredRoster = createFallbackCollection();
    renderFeaturedCollection(state.featuredRoster);
    featuredCount.textContent = `${state.featuredRoster.length} Pokémon cargados`;
    typeCount.textContent = `${DEFAULT_TYPE_ORDER.length} tipos`;
    generationCount.textContent = '8 generaciones';
    pokemonDetail.className = 'panel-body';
    pokemonDetail.innerHTML = buildDetailMarkup(createFallbackPokemon('pokemon'));
    typeLibrary.innerHTML = '<div class="empty-state"><p>No fue posible cargar los filtros por ahora.</p></div>';
    generationLibrary.innerHTML = '<div class="empty-state"><p>No fue posible cargar los filtros por ahora.</p></div>';
    setStatus('La biblioteca se cargó con respaldo local porque PokeAPI no respondió.', true);
  } finally {
    setLoading(false);
  }
}

featuredGrid.addEventListener('click', (event) => {
  const button = event.target.closest('[data-pokemon]');
  if (!button) {
    return;
  }

  selectPokemon(button.dataset.pokemon);
});

typeLibrary.addEventListener('click', (event) => {
  const button = event.target.closest('[data-pokemon]');
  if (!button) {
    return;
  }

  selectPokemon(button.dataset.pokemon);
});

generationLibrary.addEventListener('click', (event) => {
  const button = event.target.closest('[data-pokemon]');
  if (!button) {
    return;
  }

  selectPokemon(button.dataset.pokemon);
});

typeChips.addEventListener('click', (event) => {
  const button = event.target.closest('[data-type]');
  if (!button) {
    return;
  }

  selectType(button.dataset.type);
});

generationChips.addEventListener('click', (event) => {
  const button = event.target.closest('[data-generation]');
  if (!button) {
    return;
  }

  selectGeneration(button.dataset.generation);
});

viewTabs.forEach((button) => {
  button.addEventListener('click', () => {
    scrollToSection(button.dataset.scrollTo);
  });
});

form.addEventListener('submit', (event) => {
  event.preventDefault();
  selectPokemon(input.value);
});

input.value = DEFAULT_QUERY;
initializeApp().then(() => {
  selectPokemon(DEFAULT_QUERY);
});
