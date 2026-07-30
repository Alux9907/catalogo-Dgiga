// =====================================================
// CONFIGURACIÓN
// =====================================================

function getBasePath() {
    const path = window.location.pathname;
    
    if (path.includes('/catalogo-Dgiga/')) return '/catalogo-Dgiga/';
    if (path.includes('/catalogo/')) return '/catalogo/';
    if (path === '/' || path === '') return '/';
    
    const partes = path.split('/');
    partes.pop();
    return partes.join('/') + '/';
}

const BASE_PATH = getBasePath();
const ARCHIVO_DATOS = BASE_PATH + 'catalogo.json';

console.log('🔍 Ruta base:', BASE_PATH);

// =====================================================
// DOM REFERENCES
// =====================================================

const $ = id => document.getElementById(id);

const grid = $('grid-peliculas');
const loading = $('loading');
const contador = $('contador');
const inputBuscar = $('buscar');
const selectGenero = $('genero');
const selectAnio = $('anio');
const selectOrden = $('orden');

// Modal
const modal = $('modal');
const modalClose = $('modal-close');
const modalPoster = $('modal-poster');
const modalTitulo = $('modal-titulo');
const modalAnio = $('modal-anio');
const modalDuracion = $('modal-duracion');
const modalPuntuacion = $('modal-puntuacion');
const modalGeneros = $('modal-generos');
const modalDirector = $('modal-director');
const modalReparto = $('modal-reparto');
const modalSinopsis = $('modal-sinopsis');
const modalRuta = $('modal-ruta');

// =====================================================
// ESTADO
// =====================================================

let todasLasPeliculas = [];
let peliculasFiltradas = [];

// =====================================================
// MODAL - VERSIÓN MEJORADA PARA MÓVIL
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
    modalGeneros.innerHTML = (pelicula.generos?.length) 
        ? pelicula.generos.map(g => `<span>${g}</span>`).join('') 
        : '<span>Sin género</span>';
    
    // Director
    modalDirector.textContent = pelicula.director || 'No disponible';
    
    // Reparto
    modalReparto.textContent = pelicula.reparto?.length ? pelicula.reparto.join(' · ') : 'No disponible';
    
    // Sinopsis
    modalSinopsis.textContent = pelicula.sinopsis || 'Sin sinopsis disponible';
    
    // Ruta
    modalRuta.textContent = pelicula.ruta_relativa || 'Ruta no disponible';
    
    // =============================================
    // PÓSTER - VERSIÓN MEJORADA PARA MÓVIL
    // =============================================
    
    // Mostrar placeholder inmediatamente
    modalPoster.innerHTML = `<div class="sin-poster">🎬</div>`;
    
    if (pelicula.poster_url) {
        // Intentar cargar con fetch (más fiable en móvil)
        fetch(pelicula.poster_url)
            .then(response => {
                if (!response.ok) throw new Error('Error al cargar la imagen');
                return response.blob();
            })
            .then(blob => {
                const url = URL.createObjectURL(blob);
                const img = document.createElement('img');
                img.src = url;
                img.alt = pelicula.titulo_tmdb || pelicula.titulo;
                img.style.cssText = 'width:100%;height:100%;object-fit:cover;display:block';
                
                img.onload = () => {
                    modalPoster.innerHTML = '';
                    modalPoster.appendChild(img);
                    URL.revokeObjectURL(url);
                };
                
                img.onerror = () => {
                    modalPoster.innerHTML = `<div class="sin-poster">🎬</div>`;
                    URL.revokeObjectURL(url);
                };
            })
            .catch(() => {
                // Fallback: cargar directamente con Image
                const img = new Image();
                img.alt = pelicula.titulo_tmdb || pelicula.titulo;
                img.style.cssText = 'width:100%;height:100%;object-fit:cover;display:block';
                
                let loaded = false;
                
                img.onload = () => {
                    if (!loaded) {
                        loaded = true;
                        modalPoster.innerHTML = '';
                        modalPoster.appendChild(img);
                    }
                };
                
                img.onerror = () => {
                    if (!loaded) {
                        loaded = true;
                        modalPoster.innerHTML = `<div class="sin-poster">🎬</div>`;
                    }
                };
                
                // Timeout de seguridad
                const timeoutId = setTimeout(() => {
                    if (!loaded) {
                        loaded = true;
                        modalPoster.innerHTML = `<div class="sin-poster">🎬</div>`;
                    }
                }, 8000);
                
                // Sobrescribir onload para limpiar timeout
                const originalOnload = img.onload;
                img.onload = function(e) {
                    clearTimeout(timeoutId);
                    if (!loaded) {
                        loaded = true;
                        modalPoster.innerHTML = '';
                        modalPoster.appendChild(this);
                    }
                };
                
                img.src = pelicula.poster_url;
            });
    }
    
    // Mostrar modal
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
}

function cerrarModal() {
    modal.classList.remove('active');
    document.body.style.overflow = '';
}

modalClose?.addEventListener('click', cerrarModal);
modal.addEventListener('click', e => { if (e.target === modal) cerrarModal(); });
document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && modal.classList.contains('active')) cerrarModal();
});

// =====================================================
// TEMA
// =====================================================

const themeIcon = document.querySelector('.theme-icon');

function getPreferredTheme() {
    const saved = localStorage.getItem('theme');
    if (saved === 'dark' || saved === 'light') return saved;
    return window.matchMedia?.('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
}

function setTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
    if (themeIcon) themeIcon.textContent = theme === 'dark' ? '🌙' : '☀️';
}

function toggleTheme() {
    const current = document.documentElement.getAttribute('data-theme');
    setTheme(current === 'dark' ? 'light' : 'dark');
}

setTheme(getPreferredTheme());

document.addEventListener('DOMContentLoaded', () => {
    const btn = document.getElementById('theme-toggle');
    if (btn) btn.addEventListener('click', toggleTheme);
});

// =====================================================
// DATOS
// =====================================================

async function cargarDatos() {
    try {
        const response = await fetch(ARCHIVO_DATOS);
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        todasLasPeliculas = await response.json();
        console.log(`✅ ${todasLasPeliculas.length} películas cargadas`);
        return true;
    } catch (error) {
        console.error('❌ Error:', error);
        return false;
    }
}

// =====================================================
// FILTRADO Y ORDEN
// =====================================================

function filtrarPeliculas() {
    const texto = inputBuscar.value.toLowerCase().trim();
    const genero = selectGenero.value;
    const anio = selectAnio.value;
    
    peliculasFiltradas = todasLasPeliculas.filter(p => {
        if (texto) {
            const titulo = (p.titulo_tmdb || p.titulo).toLowerCase();
            const reparto = (p.reparto || []).join(' ').toLowerCase();
            const director = (p.director || '').toLowerCase();
            if (!titulo.includes(texto) && !reparto.includes(texto) && !director.includes(texto)) {
                return false;
            }
        }
        if (genero && !(p.generos || []).includes(genero)) return false;
        if (anio && p.anio !== anio) return false;
        return true;
    });
    
    ordenarPeliculas();
    contador.textContent = peliculasFiltradas.length;
    renderizarPeliculas();
}

function ordenarPeliculas() {
    const orden = selectOrden.value;
    const comparators = {
        titulo: (a, b) => (a.titulo_tmdb || a.titulo).localeCompare(b.titulo_tmdb || b.titulo),
        titulo_desc: (a, b) => (b.titulo_tmdb || b.titulo).localeCompare(a.titulo_tmdb || a.titulo),
        anio: (a, b) => parseInt(b.anio || 0) - parseInt(a.anio || 0),
        anio_asc: (a, b) => parseInt(a.anio || 0) - parseInt(b.anio || 0),
        puntuacion: (a, b) => (b.puntuacion || 0) - (a.puntuacion || 0)
    };
    peliculasFiltradas.sort(comparators[orden] || comparators.titulo);
}

// =====================================================
// RENDER
// =====================================================

function renderizarPeliculas() {
    if (!peliculasFiltradas.length) {
        grid.innerHTML = `
            <div class="sin-resultados">
                <h2>🎬 No se encontraron películas</h2>
                <p>Prueba con otros filtros o palabras de búsqueda</p>
            </div>
        `;
        return;
    }
    
    let html = '';
    
    peliculasFiltradas.forEach((p, i) => {
        const poster = p.poster_url 
            ? `<img src="${p.poster_url}" alt="${p.titulo_tmdb || p.titulo}" loading="lazy">` 
            : `<div class="sin-poster">🎬</div>`;
        
        const generos = (p.generos || []).slice(0, 3).join(' · ');
        const puntuacion = p.puntuacion > 0 ? `<span class="puntuacion">⭐ ${p.puntuacion.toFixed(1)}</span>` : '';
        
        html += `
            <div class="pelicula-card" onclick="verDetalle(${i})">
                <div class="poster">${poster}</div>
                <div class="info">
                    <div class="titulo">${p.titulo_tmdb || p.titulo}</div>
                    <div class="anio">${p.anio || 'Sin año'} ${puntuacion}</div>
                    ${generos ? `<div class="generos">${generos}</div>` : ''}
                </div>
            </div>
        `;
    });
    
    grid.innerHTML = html;
}

// =====================================================
// DETALLE
// =====================================================

window.verDetalle = function(index) {
    const pelicula = peliculasFiltradas[index];
    if (pelicula) abrirModal(pelicula);
};

// =====================================================
// FILTROS
// =====================================================

function cargarFiltros() {
    const generosSet = new Set();
    const aniosSet = new Set();
    
    todasLasPeliculas.forEach(p => {
        (p.generos || []).forEach(g => generosSet.add(g));
        if (p.anio) aniosSet.add(p.anio);
    });
    
    const generos = [...generosSet].sort();
    generos.forEach(g => {
        const opt = document.createElement('option');
        opt.value = g;
        opt.textContent = g;
        selectGenero.appendChild(opt);
    });
    
    const anios = [...aniosSet].sort((a, b) => parseInt(b) - parseInt(a));
    anios.forEach(a => {
        const opt = document.createElement('option');
        opt.value = a;
        opt.textContent = a;
        selectAnio.appendChild(opt);
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
// INICIO
// =====================================================

async function iniciar() {
    loading.style.display = 'block';
    
    const ok = await cargarDatos();
    
    if (!ok) {
        grid.innerHTML = `
            <div class="sin-resultados">
                <h2>❌ Error al cargar los datos</h2>
                <p>Archivo: ${ARCHIVO_DATOS}</p>
                <p>Verifica que <strong>catalogo.json</strong> existe</p>
            </div>
        `;
        loading.style.display = 'none';
        return;
    }
    
    loading.style.display = 'none';
    cargarFiltros();
    filtrarPeliculas();
    
    document.getElementById('fecha-actualizacion').textContent = new Date().toLocaleDateString('es-ES');
}

iniciar();