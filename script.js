let filtroActual = 'todos';
let ordenActual = { campo: null, orden: 'asc' };
let idEditando = null;

// Cargar datos iniciales
window.onload = function() {
    cargarEstadisticas();
    cargarEstudiantes();
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

function cargarEstadisticas() {
    fetch('/api/estadisticas')
        .then(function(respuesta) {
            return respuesta.json();
        })
        .then(function(estadisticas) {
            const htmlEstadisticas = `
                <div class="tarjeta-estadistica">
                    <div class="icono-estadistica">👥</div>
                    <div class="valor-estadistica">${estadisticas.total}</div>
                    <div class="etiqueta-estadistica">Total Estudiantes</div>
                </div>
                <div class="tarjeta-estadistica">
                    <div class="icono-estadistica">📈</div>
                    <div class="valor-estadistica">${estadisticas.promedio}</div>
                    <div class="etiqueta-estadistica">Nota Promedio</div>
                </div>
                <div class="tarjeta-estadistica">
                    <div class="icono-estadistica">✅</div>
                    <div class="valor-estadistica">${estadisticas.aprobados}</div>
                    <div class="etiqueta-estadistica">Aprobados (${estadisticas.porcentajeAprobados}%)</div>
                </div>
                <div class="tarjeta-estadistica">
                    <div class="icono-estadistica">❌</div>
                    <div class="valor-estadistica">${estadisticas.suspendidos}</div>
                    <div class="etiqueta-estadistica">Suspendidos</div>
                </div>
                <div class="tarjeta-estadistica">
                    <div class="icono-estadistica">🏆</div>
                    <div class="valor-estadistica">${estadisticas.notaMaxima}</div>
                    <div class="etiqueta-estadistica">Nota Máxima</div>
                </div>
                <div class="tarjeta-estadistica">
                    <div class="icono-estadistica">📉</div>
                    <div class="valor-estadistica">${estadisticas.notaMinima}</div>
                    <div class="etiqueta-estadistica">Nota Mínima</div>
                </div>
            `;
            
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

            if (estudiantes.length === 0) {
                contenedor.innerHTML = `
                    <div class="estado-vacio">
                        <div class="icono-estado-vacio">📚</div>
                        <h3>No hay estudiantes todavía</h3>
                        <p>Agrega el primer estudiante usando el formulario superior</p>
                    </div>
                `;
                return;
            }

            const htmlTabla = `
                <table>
                    <thead>
                        <tr>
                            <th onclick="ordenarTabla('nombre')">Nombre ↕</th>
                            <th onclick="ordenarTabla('apellidos')">Apellidos ↕</th>
                            <th onclick="ordenarTabla('nota')">Nota ↕</th>
                            <th>Asignatura</th>
                            <th>Fecha</th>
                            <th>Acciones</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${estudiantes.map(function(estudiante) {
                            return `
                                <tr id="estudiante-${estudiante.id}">
                                    <td>${estudiante.nombre}</td>
                                    <td>${estudiante.apellidos}</td>
                                    <td><span class="insignia-nota ${obtenerClaseNota(estudiante.nota)}">${estudiante.nota.toFixed(1)}</span></td>
                                    <td>${estudiante.asignatura}</td>
                                    <td>${estudiante.fecha}</td>
                                    <td>
                                        <div class="acciones">
                                            <button class="boton boton-editar" onclick="editarEstudiante(${estudiante.id})">Editar</button>
                                            <button class="boton boton-eliminar" onclick="eliminarEstudiante(${estudiante.id})">Eliminar</button>
                                        </div>
                                    </td>
                                </tr>
                            `;
                        }).join('')}
                    </tbody>
                </table>
            `;

            contenedor.innerHTML = htmlTabla;
            cargarEstadisticas();
        })
        .catch(function(error) {
            console.error('Error cargando estudiantes:', error);
        });
}

function obtenerClaseNota(nota) {
    if (nota >= 9) {
        return 'nota-excelente';
    }
    if (nota >= 7) {
        return 'nota-notable';
    }
    if (nota >= 5) {
        return 'nota-aprobado';
    }
    return 'nota-suspendido';
}

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
