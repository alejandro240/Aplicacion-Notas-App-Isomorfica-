import express from 'express';
import { join, dirname } from 'path';
import { Low } from 'lowdb';
import { JSONFile } from 'lowdb/node';
import { fileURLToPath } from 'url';

const __nombreArchivo = fileURLToPath(import.meta.url);
const __directorio = dirname(__nombreArchivo);

const aplicacion = express();
const puerto = process.env.PORT || 3001;
const archivoBaseDatos = join(__directorio, 'BdAppNotas.json');

// --- Configuración de lowdb ---
const adaptador = new JSONFile(archivoBaseDatos);
const baseDatos = new Low(adaptador, { estudiantes: [] });

// Middleware
aplicacion.use(express.json());
aplicacion.use(express.static(__directorio));

// Función de inicialización de la base de datos
async function inicializarBaseDatos() {
    await baseDatos.read();
    baseDatos.data ||= { estudiantes: [] };
    await baseDatos.write();
}

inicializarBaseDatos().then(() => {
    console.log("✅ Base de datos LowDB inicializada.");
    
    // **RUTAS API**
    
    // 1. Obtener todos los estudiantes
    aplicacion.get('/api/estudiantes', async (peticion, respuesta) => {
        await baseDatos.read();
        const estudiantes = baseDatos.data.estudiantes;
        respuesta.json(estudiantes);
    });

    // 2. Obtener estadísticas
    aplicacion.get('/api/estadisticas', async (peticion, respuesta) => {
        await baseDatos.read();
        const estudiantes = baseDatos.data.estudiantes;
        
        if (estudiantes.length === 0) {
            return respuesta.json({
                total: 0,
                promedio: 0,
                aprobados: 0,
                suspendidos: 0,
                porcentajeAprobados: 0,
                notaMaxima: 0,
                notaMinima: 0
            });
        }

        const notas = estudiantes.map(estudiante => parseFloat(estudiante.nota));
        const suma = notas.reduce((acumulador, nota) => acumulador + nota, 0);
        const promedio = suma / notas.length;
        const aprobados = notas.filter(nota => nota >= 5).length;
        const suspendidos = notas.filter(nota => nota < 5).length;
        const porcentajeAprobados = (aprobados / notas.length) * 100;
        
        respuesta.json({
            total: estudiantes.length,
            promedio: promedio.toFixed(2),
            aprobados,
            suspendidos,
            porcentajeAprobados: porcentajeAprobados.toFixed(1),
            notaMaxima: Math.max(...notas),
            notaMinima: Math.min(...notas)
        });
    });

    // 3. Agregar un nuevo estudiante
    aplicacion.post('/api/estudiantes', async (peticion, respuesta) => {
        const { nombre, apellidos, nota, asignatura } = peticion.body;
        
        if (!nombre || !apellidos || nota === undefined) {
            return respuesta.status(400).json({ error: 'Nombre, apellidos y nota son obligatorios.' });
        }

        const notaNumero = parseFloat(nota);
        if (isNaN(notaNumero) || notaNumero < 0 || notaNumero > 10) {
            return respuesta.status(400).json({ error: 'La nota debe estar entre 0 y 10.' });
        }

        const nuevoEstudiante = {
            id: Date.now(),
            nombre: nombre.trim(),
            apellidos: apellidos.trim(),
            nota: notaNumero,
            asignatura: asignatura?.trim() || 'General',
            fecha: new Date().toISOString().split('T')[0]
        };

        await baseDatos.read();
        baseDatos.data.estudiantes.push(nuevoEstudiante);
        await baseDatos.write();

        respuesta.status(201).json(nuevoEstudiante);
    });

    // 4. Actualizar datos de un estudiante
    aplicacion.put('/api/estudiantes/:id', async (peticion, respuesta) => {
        const idEstudiante = parseInt(peticion.params.id);
        const { nombre, apellidos, nota, asignatura } = peticion.body;

        await baseDatos.read();
        const indiceEstudiante = baseDatos.data.estudiantes.findIndex(estudiante => estudiante.id === idEstudiante);
        
        if (indiceEstudiante === -1) {
            return respuesta.status(404).json({ error: 'Estudiante no encontrado.' });
        }

        if (nota !== undefined) {
            const notaNumero = parseFloat(nota);
            if (isNaN(notaNumero) || notaNumero < 0 || notaNumero > 10) {
                return respuesta.status(400).json({ error: 'La nota debe estar entre 0 y 10.' });
            }
            baseDatos.data.estudiantes[indiceEstudiante].nota = notaNumero;
        }

        if (nombre) baseDatos.data.estudiantes[indiceEstudiante].nombre = nombre.trim();
        if (apellidos) baseDatos.data.estudiantes[indiceEstudiante].apellidos = apellidos.trim();
        if (asignatura) baseDatos.data.estudiantes[indiceEstudiante].asignatura = asignatura.trim();

        await baseDatos.write();
        respuesta.json(baseDatos.data.estudiantes[indiceEstudiante]);
    });

    // 5. Eliminar un estudiante
    aplicacion.delete('/api/estudiantes/:id', async (peticion, respuesta) => {
        const idEstudiante = parseInt(peticion.params.id);

        await baseDatos.read();
        const longitudInicial = baseDatos.data.estudiantes.length;
        
        baseDatos.data.estudiantes = baseDatos.data.estudiantes.filter(estudiante => estudiante.id !== idEstudiante);

        if (baseDatos.data.estudiantes.length === longitudInicial) {
            return respuesta.status(404).json({ error: 'Estudiante no encontrado.' });
        }

        await baseDatos.write();
        respuesta.status(204).send();
    });

    // Servir el archivo index.html
    aplicacion.get('/', (peticion, respuesta) => {
        respuesta.sendFile(join(__directorio, 'index.html'));
    });

    // Iniciar el servidor
    aplicacion.listen(puerto, '0.0.0.0', () => {
        console.log(`🚀 Servidor de Notas ejecutándose en http://localhost:${puerto}`);
        console.log(`📊 Aplicación de Gestión de Notas de Exámenes`);
    });
});
