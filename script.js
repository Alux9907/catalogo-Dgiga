// =====================================================
// CONFIGURACIÓN
// =====================================================

const ARCHIVO_DATOS = 'catalogo.json';

let todasLasPeliculas = [];
let peliculasFiltradas = [];

// =====================================================
// DOM Elements
// =====================================================

const grid = document.getElementById('grid-peliculas');
const loading = document.getElementById('loading');
const contador = document.getElementById('contador');
const inputBuscar = document.getElementById('buscar');
const selectGenero = document.getElementById('genero');
const selectAnio = document.getElementById('anio');
const selectOrden = document.getElementById('orden');

// =====================================================
// CARGAR DATOS
// =====================================================

async function cargarDatos() {
    try {
        const response = await fetch(ARCHIVO_DATOS);
        if (!response.ok) throw new Error('Error al cargar los datos');
        todasLasPeliculas = await response.json();
        return true;
    } catch (error) {
        console.error('Error:', error);
        return false;
    }
}

// =====================================================
// FILTRADO
// =====================================================

function filtrarPeliculas() {
    const textoBusqueda = inputBuscar.value.toLowerCase().trim();
    const generoSeleccionado = selectGenero.value;
    const anioSeleccionado = selectAnio.value;
    
    peliculasFiltradas = todasLasPeliculas.filter(pelicula => {
        // Búsqueda por texto
        if (textoBusqueda) {
            const titulo = pelicula.titulo_tmdb?.toLowerCase() || '';
            const tituloOriginal = pelicula.titulo?.toLowerCase() || '';
            const reparto = pelicula.reparto?.join(' ').toLowerCase() || '';
            const director = pelicula.director?.toLowerCase() || '';
            const busquedaMatch = titulo.includes(textoBusqueda) || 
                                 tituloOriginal.includes(textoBusqueda) ||
                                 reparto.includes(textoBusqueda) ||
                                 director.includes(textoBusqueda);
            if (!busquedaMatch) return false;
        }
        
        // Filtro por género
        if (generoSeleccionado && pelicula.generos) {
            if (!pelicula.generos.includes(generoSeleccionado)) return false;
        }
        
        // Filtro por año
        if (anioSeleccionado) {
            if (pelicula.anio !== anioSeleccionado) return false;
        }
        
        return true;
    });
    
    // Aplicar ordenamiento
    ordenarPeliculas();
    
    // Actualizar contador
    contador.textContent = peliculasFiltradas.length;
    
    // Renderizar
    renderizarPeliculas();
}

// =====================================================
// ORDENAMIENTO
// =====================================================

function ordenarPeliculas() {
    const orden = selectOrden.value;
    
    peliculasFiltradas.sort((a, b) => {
        switch (orden) {
            case 'titulo':
                return (a.titulo_tmdb || a.titulo).localeCompare(b.titulo_tmdb || b.titulo);
            case 'titulo_desc':
                return (b.titulo_tmdb || b.titulo).localeCompare(a.titulo_tmdb || a.titulo);
            case 'anio':
                return parseInt(b.anio || 0) - parseInt(a.anio || 0);
            case 'anio_asc':
                return parseInt(a.anio || 0) - parseInt(b.anio || 0);
            case 'puntuacion':
                return (b.puntuacion || 0) - (a.puntuacion || 0);
            default:
                return 0;
        }
    });
}

// =====================================================
// RENDERIZADO
// =====================================================

function renderizarPeliculas() {
    if (peliculasFiltradas.length === 0) {
        grid.innerHTML = `
            <div class="sin-resultados">
                <h2>🎬 No se encontraron películas</h2>
                <p>Prueba con otros filtros o palabras de búsqueda</p>
            </div>
        `;
        return;
    }
    
    let html = '';
    
    peliculasFiltradas.forEach(pelicula => {
        const poster = pelicula.poster_url ? 
            `<img src="${pelicula.poster_url}" alt="${pelicula.titulo_tmdb || pelicula.titulo}" loading="lazy">` :
            `<div class="sin-poster">🎬</div>`;
        
        const generos = pelicula.generos && pelicula.generos.length > 0 ?
            pelicula.generos.slice(0, 3).join(' · ') :
            '';
        
        const puntuacion = pelicula.puntuacion > 0 ?
            `<span class="puntuacion">⭐ ${pelicula.puntuacion.toFixed(1)}</span>` :
            '';
        
        html += `
            <div class="pelicula-card" onclick="verDetalle(${peliculasFiltradas.indexOf(pelicula)})">
                <div class="poster">
                    ${poster}
                </div>
                <div class="info">
                    <div class="titulo">${pelicula.titulo_tmdb || pelicula.titulo}</div>
                    <div class="anio">${pelicula.anio || 'Sin año'} ${puntuacion}</div>
                    ${generos ? `<div class="generos">${generos}</div>` : ''}
                </div>
            </div>
        `;
    });
    
    grid.innerHTML = html;
}

// =====================================================
// DETALLE DE PELÍCULA (Modal)
// =====================================================

function verDetalle(index) {
    const pelicula = peliculasFiltradas[index];
    if (!pelicula) return;
    
    const generos = pelicula.generos && pelicula.generos.length > 0 ?
        pelicula.generos.join(' · ') :
        'Sin género';
    
    const reparto = pelicula.reparto && pelicula.reparto.length > 0 ?
        pelicula.reparto.join(' · ') :
        'No disponible';
    
    // Puedes usar un alert o crear un modal más elaborado
    alert(`
🎬 ${pelicula.titulo_tmdb || pelicula.titulo}
📅 ${pelicula.anio || 'Sin año'} | ⭐ ${pelicula.puntuacion > 0 ? pelicula.puntuacion.toFixed(1) : 'Sin puntuación'}
🎭 ${generos}
👤 Director: ${pelicula.director || 'No disponible'}
🎭 Reparto: ${reparto}
⏱️ Duración: ${pelicula.duracion ? `${pelicula.duracion} min` : 'No disponible'}
📝 ${pelicula.sinopsis || 'Sin sinopsis disponible'}
    `);
}

// =====================================================
// CARGAR FILTROS (Géneros y Años)
// =====================================================

function cargarFiltros() {
    // Obtener géneros únicos
    const generosSet = new Set();
    const aniosSet = new Set();
    
    todasLasPeliculas.forEach(pelicula => {
        if (pelicula.generos) {
            pelicula.generos.forEach(g => generosSet.add(g));
        }
        if (pelicula.anio) {
            aniosSet.add(pelicula.anio);
        }
    });
    
    // Ordenar géneros alfabéticamente
    const generos = Array.from(generosSet).sort();
    generos.forEach(genero => {
        const option = document.createElement('option');
        option.value = genero;
        option.textContent = genero;
        selectGenero.appendChild(option);
    });
    
    // Ordenar años (más reciente primero)
    const anios = Array.from(aniosSet).sort((a, b) => parseInt(b) - parseInt(a));
    anios.forEach(anio => {
        const option = document.createElement('option');
        option.value = anio;
        option.textContent = anio;
        selectAnio.appendChild(option);
    });
}

// =====================================================
// EVENTOS
// =====================================================

inputBuscar.addEventListener('input', filtrarPeliculas);
selectGenero.addEventListener('change', filtrarPeliculas);
selectAnio.addEventListener('change', filtrarPeliculas);
selectOrden.addEventListener('change', filtrarPeliculas);

// =====================================================
// INICIALIZACIÓN
// =====================================================

async function iniciar() {
    // Mostrar loading
    loading.style.display = 'block';
    
    const cargado = await cargarDatos();
    
    if (!cargado) {
        grid.innerHTML = `
            <div class="sin-resultados">
                <h2>❌ Error al cargar los datos</h2>
                <p>Asegúrate de que el archivo ${ARCHIVO_DATOS} existe</p>
            </div>
        `;
        loading.style.display = 'none';
        return;
    }
    
    // Ocultar loading
    loading.style.display = 'none';
    
    // Cargar filtros
    cargarFiltros();
    
    // Mostrar todas
    filtrarPeliculas();
    
    // Actualizar fecha
    const fecha = new Date();
    document.getElementById('fecha-actualizacion').textContent = fecha.toLocaleDateString('es-ES');
}

// Iniciar
iniciar();