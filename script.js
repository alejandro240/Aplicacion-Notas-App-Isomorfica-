// Importar módulo compartido para renderizado
import { renderizarTablaEstudiantes, renderizarEstadisticas, calcularEstadisticas, obtenerClaseNota } from './renderizadores.js';

let filtroActual = 'todos';
let ordenActual = { campo: null, orden: 'asc' };
let idEditando = null;

// **HIDRATACIÓN**: El HTML ya viene renderizado del servidor
// Solo necesitamos agregar los event listeners y la interactividad
window.onload = function() {
    // El contenido ya está renderizado por el servidor (SSR)
    // Solo hidratamos los eventos y funcionalidad interactiva
    console.log('✅ Aplicación isomórfica hidratada - Contenido inicial renderizado por el servidor');
    
    // Si hay datos iniciales del servidor, los usamos
    if (window.__INITIAL_DATA__) {
        console.log('📦 Datos iniciales del servidor:', window.__INITIAL_DATA__);
    }
};

// Escuchadores de eventos
document.getElementById('formulario-estudiante').addEventListener('submit', manejarEnvio);
document.querySelectorAll('.boton-filtro').forEach(function(boton) {
    boton.addEventListener('click', function(evento) {
        document.querySelectorAll('.boton-filtro').forEach(function(b) {
            b.classList.remove('activo');
        });
        evento.target.classList.add('activo');
        filtroActual = evento.target.dataset.filtro;
        cargarEstudiantes();
    });
});

// Ahora usa el módulo compartido para renderizar
function cargarEstadisticas() {
    fetch('/api/estadisticas')
        .then(function(respuesta) {
            return respuesta.json();
        })
        .then(function(estadisticas) {
            // Usar la función compartida del módulo renderizadores.js
            const htmlEstadisticas = renderizarEstadisticas(estadisticas);
            document.getElementById('cuadricula-estadisticas').innerHTML = htmlEstadisticas;
        })
        .catch(function(error) {
            console.error('Error cargando estadísticas:', error);
        });
}

function cargarEstudiantes() {
    fetch('/api/estudiantes')
        .then(function(respuesta) {
            return respuesta.json();
        })
        .then(function(estudiantes) {
            // Aplicar filtro
            if (filtroActual === 'aprobados') {
                estudiantes = estudiantes.filter(function(estudiante) {
                    return estudiante.nota >= 5;
                });
            } else if (filtroActual === 'suspendidos') {
                estudiantes = estudiantes.filter(function(estudiante) {
                    return estudiante.nota < 5;
                });
            } else if (filtroActual === 'excelentes') {
                estudiantes = estudiantes.filter(function(estudiante) {
                    return estudiante.nota >= 9;
                });
            }

            const contenedor = document.getElementById('contenedor-estudiantes');

            // Usar la función compartida del módulo renderizadores.js
            const htmlTabla = renderizarTablaEstudiantes(estudiantes);
            contenedor.innerHTML = htmlTabla;
            cargarEstadisticas();
        })
        .catch(function(error) {
            console.error('Error cargando estudiantes:', error);
        });
}

// Ya no necesitamos esta función aquí, está en renderizadores.js (código compartido)
// La mantenemos por compatibilidad con window.obtenerClaseNota si se necesita
window.obtenerClaseNota = obtenerClaseNota;

function manejarEnvio(evento) {
    evento.preventDefault();
    
    const estudiante = {
        nombre: document.getElementById('nombre').value,
        apellidos: document.getElementById('apellidos').value,
        nota: parseFloat(document.getElementById('nota').value),
        asignatura: document.getElementById('asignatura').value
    };

    if (idEditando) {
        fetch('/api/estudiantes/' + idEditando, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(estudiante)
        })
        .then(function() {
            idEditando = null;
            document.querySelector('.boton-primario').textContent = 'Agregar';
            document.getElementById('formulario-estudiante').reset();
            document.getElementById('asignatura').value = '';
            cargarEstudiantes();
        })
        .catch(function(error) {
            console.error('Error guardando estudiante:', error);
            alert('Error al guardar el estudiante');
        });
    } else {
        fetch('/api/estudiantes', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(estudiante)
        })
        .then(function() {
            document.getElementById('formulario-estudiante').reset();
            document.getElementById('asignatura').value = '';
            cargarEstudiantes();
        })
        .catch(function(error) {
            console.error('Error guardando estudiante:', error);
            alert('Error al guardar el estudiante');
        });
    }
}

function editarEstudiante(id) {
    fetch('/api/estudiantes')
        .then(function(respuesta) {
            return respuesta.json();
        })
        .then(function(estudiantes) {
            const estudiante = estudiantes.find(function(e) {
                return e.id === id;
            });

            if (estudiante) {
                document.getElementById('nombre').value = estudiante.nombre;
                document.getElementById('apellidos').value = estudiante.apellidos;
                document.getElementById('nota').value = estudiante.nota;
                document.getElementById('asignatura').value = estudiante.asignatura;
                idEditando = id;
                document.querySelector('.boton-primario').textContent = 'Actualizar';
                window.scrollTo({ top: 0, behavior: 'smooth' });
            }
        })
        .catch(function(error) {
            console.error('Error editando estudiante:', error);
        });
}

function eliminarEstudiante(id) {
    const confirmar = confirm('¿Estás seguro de que deseas eliminar este estudiante?');
    
    if (confirmar) {
        fetch('/api/estudiantes/' + id, {
            method: 'DELETE'
        })
        .then(function() {
            cargarEstudiantes();
        })
        .catch(function(error) {
            console.error('Error eliminando estudiante:', error);
        });
    }
}

function ordenarTabla(campo) {
    ordenActual.campo = campo;
    if (ordenActual.orden === 'asc') {
        ordenActual.orden = 'desc';
    } else {
        ordenActual.orden = 'asc';
    }
    cargarEstudiantes();
}

// Exponer funciones globales para que funcionen desde el HTML
window.editarEstudiante = editarEstudiante;
window.eliminarEstudiante = eliminarEstudiante;
window.ordenarTabla = ordenarTabla;
