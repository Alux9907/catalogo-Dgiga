// =====================================================
// CONFIGURACIÓN
// =====================================================

function getBasePath() {
    const path = window.location.pathname;
    
    if (path.includes('/catalogo-Dgiga/')) {
        return '/catalogo-Dgiga/';
    }
    
    if (path.includes('/catalogo/')) {
        return '/catalogo/';
    }
    
    if (path === '/' || path === '') {
        return '/';
    }
    
    const partes = path.split('/');
    partes.pop();
    return partes.join('/') + '/';
}

const BASE_PATH = getBasePath();
const ARCHIVO_DATOS = BASE_PATH + 'catalogo.json';

console.log('🔍 Ruta base detectada:', BASE_PATH);
console.log('📁 Cargando datos desde:', ARCHIVO_DATOS);

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
// MODAL - DOM Elements
// =====================================================

const modal = document.getElementById('modal');
const modalClose = document.getElementById('modal-close');
const modalPoster = document.getElementById('modal-poster');
const modalTitulo = document.getElementById('modal-titulo');
const modalAnio = document.getElementById('modal-anio');
const modalDuracion = document.getElementById('modal-duracion');
const modalPuntuacion = document.getElementById('modal-puntuacion');
const modalGeneros = document.getElementById('modal-generos');
const modalDirector = document.getElementById('modal-director');
const modalReparto = document.getElementById('modal-reparto');
const modalSinopsis = document.getElementById('modal-sinopsis');
const modalRuta = document.getElementById('modal-ruta');

// =====================================================
// MODAL - Funciones
// =====================================================

function abrirModal(pelicula) {
    // Título
    modalTitulo.textContent = pelicula.titulo_tmdb || pelicula.titulo;
    
    // Año
    modalAnio.textContent = pelicula.anio || 'Sin año';
    
    // Duración
    modalDuracion.textContent = pelicula.duracion ? `${pelicula.duracion} min` : 'Duración desconocida';
    
    // Puntuación
    modalPuntuacion.textContent = pelicula.puntuacion > 0 ? `⭐ ${pelicula.puntuacion.toFixed(1)}` : '⭐ Sin puntuación';
    
    // Géneros
    if (pelicula.generos && pelicula.generos.length > 0) {
        modalGeneros.innerHTML = pelicula.generos.map(g => `<span>${g}</span>`).join('');
    } else {
        modalGeneros.innerHTML = '<span>Sin género</span>';
    }
    
    // Director
    modalDirector.textContent = pelicula.director || 'No disponible';
    
    // Reparto
    if (pelicula.reparto && pelicula.reparto.length > 0) {
        modalReparto.textContent = pelicula.reparto.join(' · ');
    } else {
        modalReparto.textContent = 'No disponible';
    }
    
    // Sinopsis
    modalSinopsis.textContent = pelicula.sinopsis || 'Sin sinopsis disponible';
    
    // Ruta
    modalRuta.textContent = pelicula.ruta_relativa || 'Ruta no disponible';
    
    // =============================================
    // PÓSTER - VERSIÓN MEJORADA PARA MÓVIL
    // =============================================
    
    // Primero, mostrar un placeholder mientras carga
    modalPoster.innerHTML = `
        <div class="sin-poster" style="display:flex;align-items:center;justify-content:center;width:100%;height:100%;background:var(--bg-input);font-size:3rem;color:var(--text-muted);">
            🎬
        </div>
    `;
    
    if (pelicula.poster_url) {
        // Crear una nueva imagen para asegurar que se cargue correctamente
        const img = new Image();
        img.alt = pelicula.titulo_tmdb || pelicula.titulo;
        img.style.width = '100%';
        img.style.height = '100%';
        img.style.objectFit = 'cover';
        img.style.display = 'block';
        
        // Cuando la imagen se carga, la mostramos
        img.onload = function() {
            modalPoster.innerHTML = '';
            modalPoster.appendChild(img);
        };
        
        // Si hay error al cargar, mostramos el placeholder
        img.onerror = function() {
            modalPoster.innerHTML = `
                <div class="sin-poster" style="display:flex;align-items:center;justify-content:center;width:100%;height:100%;background:var(--bg-input);font-size:3rem;color:var(--text-muted);">
                    🎬
                </div>
            `;
        };
        
        // Iniciar la carga de la imagen
        img.src = pelicula.poster_url;
        
        // Fallback: Si la imagen no se carga en 5 segundos, mostrar placeholder
        setTimeout(() => {
            // Si después de 5 segundos el poster sigue siendo el placeholder
            const currentContent = modalPoster.innerHTML;
            if (currentContent.includes('sin-poster') || currentContent === '') {
                modalPoster.innerHTML = `
                    <div class="sin-poster" style="display:flex;align-items:center;justify-content:center;width:100%;height:100%;background:var(--bg-input);font-size:3rem;color:var(--text-muted);">
                        🎬
                    </div>
                `;
            }
        }, 5000);
        
    } else {
        // Si no hay URL de póster, mostrar placeholder
        modalPoster.innerHTML = `
            <div class="sin-poster" style="display:flex;align-items:center;justify-content:center;width:100%;height:100%;background:var(--bg-input);font-size:3rem;color:var(--text-muted);">
                🎬
            </div>
        `;
    }
    
    // Mostrar modal
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
}

function cerrarModal() {
    modal.classList.remove('active');
    document.body.style.overflow = '';
}

if (modalClose) {
    modalClose.addEventListener('click', cerrarModal);
}

modal.addEventListener('click', function(e) {
    if (e.target === modal) {
        cerrarModal();
    }
});

document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape' && modal.classList.contains('active')) {
        cerrarModal();
    }
});

// =====================================================
// TEMA (CLARO/OSCURO)
// =====================================================

function getPreferredTheme() {
    const saved = localStorage.getItem('theme');
    if (saved === 'dark' || saved === 'light') {
        return saved;
    }
    
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches) {
        return 'light';
    }
    return 'dark';
}

function setTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
    
    const themeIcon = document.querySelector('.theme-icon');
    if (themeIcon) {
        themeIcon.textContent = theme === 'dark' ? '🌙' : '☀️';
    }
}

function toggleTheme() {
    const current = document.documentElement.getAttribute('data-theme');
    const newTheme = current === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);
}

(function initTheme() {
    const theme = getPreferredTheme();
    setTheme(theme);
})();

document.addEventListener('DOMContentLoaded', function() {
    const themeToggle = document.getElementById('theme-toggle');
    if (themeToggle) {
        themeToggle.addEventListener('click', toggleTheme);
    }
});

// =====================================================
// CARGAR DATOS
// =====================================================

async function cargarDatos() {
    try {
        console.log('📡 Intentando cargar:', ARCHIVO_DATOS);
        const response = await fetch(ARCHIVO_DATOS);
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        todasLasPeliculas = await response.json();
        console.log('✅ Películas cargadas:', todasLasPeliculas.length);
        return true;
    } catch (error) {
        console.error('❌ Error al cargar los datos:', error);
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
        
        if (generoSeleccionado && pelicula.generos) {
            if (!pelicula.generos.includes(generoSeleccionado)) return false;
        }
        
        if (anioSeleccionado) {
            if (pelicula.anio !== anioSeleccionado) return false;
        }
        
        return true;
    });
    
    ordenarPeliculas();
    contador.textContent = peliculasFiltradas.length;
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
    
    peliculasFiltradas.forEach((pelicula, index) => {
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
            <div class="pelicula-card" onclick="verDetalle(${index})">
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
// DETALLE DE PELÍCULA (CON MODAL)
// =====================================================

function verDetalle(index) {
    const pelicula = peliculasFiltradas[index];
    if (!pelicula) return;
    abrirModal(pelicula);
}

// =====================================================
// CARGAR FILTROS
// =====================================================

function cargarFiltros() {
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
    
    const generos = Array.from(generosSet).sort();
    generos.forEach(genero => {
        const option = document.createElement('option');
        option.value = genero;
        option.textContent = genero;
        selectGenero.appendChild(option);
    });
    
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
    loading.style.display = 'block';
    
    const cargado = await cargarDatos();
    
    if (!cargado) {
        grid.innerHTML = `
            <div class="sin-resultados">
                <h2>❌ Error al cargar los datos</h2>
                <p>Archivo: ${ARCHIVO_DATOS}</p>
                <p>Verifica que el archivo <strong>catalogo.json</strong> existe</p>
            </div>
        `;
        loading.style.display = 'none';
        return;
    }
    
    loading.style.display = 'none';
    cargarFiltros();
    filtrarPeliculas();
    
    const fecha = new Date();
    document.getElementById('fecha-actualizacion').textContent = fecha.toLocaleDateString('es-ES');
}

iniciar();