// Módulo compartido entre servidor y cliente
// Este código se ejecuta tanto en Node.js como en el navegador

export function obtenerClaseNota(nota) {
    if (nota >= 9) return 'nota-excelente';
    if (nota >= 7) return 'nota-notable';
    if (nota >= 5) return 'nota-aprobado';
    return 'nota-suspendido';
}

export function renderizarEstudiante(estudiante) {
    return `
        <tr>
            <td>${estudiante.nombre}</td>
            <td>${estudiante.apellidos}</td>
            <td><span class="insignia-nota ${obtenerClaseNota(estudiante.nota)}">${estudiante.nota}</span></td>
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
}

export function renderizarTablaEstudiantes(estudiantes) {
    if (estudiantes.length === 0) {
        return `
            <div class="estado-vacio">
                <div class="icono-estado-vacio">📚</div>
                <h3>No hay estudiantes todavía</h3>
                <p>Agrega el primer estudiante usando el formulario superior</p>
            </div>
        `;
    }

    const filasEstudiantes = estudiantes.map(renderizarEstudiante).join('');
    
    return `
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
                ${filasEstudiantes}
            </tbody>
        </table>
    `;
}

export function renderizarEstadisticas(estadisticas) {
    return `
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
}

export function calcularEstadisticas(estudiantes) {
    if (estudiantes.length === 0) {
        return {
            total: 0,
            promedio: 0,
            aprobados: 0,
            suspendidos: 0,
            porcentajeAprobados: 0,
            notaMaxima: 0,
            notaMinima: 0
        };
    }

    const notas = estudiantes.map(estudiante => parseFloat(estudiante.nota));
    const suma = notas.reduce((acumulador, nota) => acumulador + nota, 0);
    const promedio = suma / notas.length;
    const aprobados = notas.filter(nota => nota >= 5).length;
    const suspendidos = notas.filter(nota => nota < 5).length;
    const porcentajeAprobados = (aprobados / notas.length) * 100;
    
    return {
        total: estudiantes.length,
        promedio: promedio.toFixed(2),
        aprobados,
        suspendidos,
        porcentajeAprobados: porcentajeAprobados.toFixed(1),
        notaMaxima: Math.max(...notas),
        notaMinima: Math.min(...notas)
    };
}
