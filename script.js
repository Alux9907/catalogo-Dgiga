// =====================================================
// CONFIGURACIÓN
// =====================================================

// Detectar automáticamente la ruta base
function getBasePath() {
    const path = window.location.pathname;
    
    // Si estamos en GitHub Pages (nombre del repo)
    if (path.includes('/catalogo-Dgiga/')) {
        return '/catalogo-Dgiga/';
    }
    
    // Si estamos en local con XAMPP
    if (path.includes('/catalogo/')) {
        return '/catalogo/';
    }
    
    // Si estamos en la raíz local (http://localhost/)
    if (path === '/' || path === '') {
        return '/';
    }
    
    // Para otros casos, usar la ruta actual sin el nombre del archivo
    const partes = path.split('/');
    partes.pop(); // Eliminar el nombre del archivo (index.html o vacío)
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
// TEMA (CLARO/OSCURO) - VERSIÓN MEJORADA
// =====================================================

// Función para obtener el tema preferido
function getPreferredTheme() {
    // 1. Verificar si hay una preferencia guardada en localStorage
    const saved = localStorage.getItem('theme');
    if (saved === 'dark' || saved === 'light') {
        console.log('🌓 Tema desde localStorage:', saved);
        return saved;
    }
    
    // 2. Verificar preferencia del sistema
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches) {
        console.log('🌓 Tema desde sistema: light');
        return 'light';
    }
    
    // 3. Por defecto, oscuro
    console.log('🌓 Tema por defecto: dark');
    return 'dark';
}

// Función para aplicar el tema
function setTheme(theme) {
    // Aplicar el tema al HTML
    document.documentElement.setAttribute('data-theme', theme);
    
    // Guardar en localStorage
    localStorage.setItem('theme', theme);
    
    // Actualizar el ícono del botón
    const themeIcon = document.querySelector('.theme-icon');
    if (themeIcon) {
        if (theme === 'dark') {
            themeIcon.textContent = '🌙';
        } else {
            themeIcon.textContent = '☀️';
        }
    }
    
    console.log('🎨 Tema aplicado:', theme);
}

// Función para alternar el tema
function toggleTheme() {
    const current = document.documentElement.getAttribute('data-theme');
    const newTheme = current === 'dark' ? 'light' : 'dark';
    console.log('🔄 Cambiando tema de', current, 'a', newTheme);
    setTheme(newTheme);
}

// =====================================================
// INICIALIZAR TEMA AL CARGAR
// =====================================================

// Aplicar tema al cargar la página
(function initTheme() {
    const theme = getPreferredTheme();
    setTheme(theme);
})();

// Esperar a que el DOM esté listo para asignar eventos
document.addEventListener('DOMContentLoaded', function() {
    // Buscar el botón de tema
    const themeToggle = document.getElementById('theme-toggle');
    
    if (themeToggle) {
        console.log('✅ Botón de tema encontrado');
        themeToggle.addEventListener('click', toggleTheme);
    } else {
        console.warn('⚠️ Botón de tema NO encontrado en el DOM');
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
        
        // Intentar con ruta alternativa (sin la carpeta)
        if (ARCHIVO_DATOS.includes('/catalogo/')) {
            try {
                const altPath = '/catalogo.json';
                console.log('🔄 Intentando ruta alternativa:', altPath);
                const response = await fetch(altPath);
                if (response.ok) {
                    todasLasPeliculas = await response.json();
                    console.log('✅ Películas cargadas (ruta alternativa):', todasLasPeliculas.length);
                    return true;
                }
            } catch (e) {
                console.error('❌ También falló la ruta alternativa');
            }
        }
        
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
// DETALLE DE PELÍCULA
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
// EVENTOS DE FILTROS
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
                <p>Verifica que el archivo <strong>catalogo.json</strong> existe en la carpeta</p>
                <p style="font-size:0.8rem;margin-top:1rem;color:var(--text-muted);">
                    Abre la consola (F12) para ver más detalles
                </p>
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

// Iniciar
iniciar();