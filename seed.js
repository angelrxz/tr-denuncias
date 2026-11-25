require('dotenv').config();
const mongoose = require('mongoose');
const Denuncia = require('./src/modelos/denuncia');

const MONGO_URI = process.env.MONGO_URI || process.env.MONGODB_URI;

const denunciasDemo = [
  {
    rutDenunciante: '11111111-1',
    tipo: 'abandono',
    animalId: 'SIM-000001',
    microchip: '900111222333444',
    descripcion: 'Perro mediano amarrado hace varias horas sin agua en la entrada de un sitio eriazo.',
    ubicacion: 'Av. Argentina 1240, Antofagasta',
    estado: 'ingresada'
  },
  {
    rutDenunciante: '12222222-2',
    tipo: 'maltrato',
    animalId: 'SIM-000002',
    microchip: null,
    descripcion: 'Vecinos reportan agresiones reiteradas a un perro en el patio trasero de la vivienda.',
    ubicacion: 'Calle Matta 2350, Antofagasta',
    estado: 'asignada',
    equipo: 'Equipo 1',
    asignadoPor: '22222222-2',
    fechaAsignacion: new Date()
  },
  {
    rutDenunciante: '13333333-3',
    tipo: 'abandono',
    animalId: 'SIM-000003',
    microchip: '900555666777888',
    descripcion: 'Camada de cachorros abandonados dentro de una caja cerca de la plaza principal.',
    ubicacion: 'Plaza Colón sector norte, Antofagasta',
    estado: 'en_terreno',
    equipo: 'Equipo 2',
    asignadoPor: '22222222-2',
    fechaAsignacion: new Date()
  },
  {
    rutDenunciante: '14444444-4',
    tipo: 'maltrato',
    animalId: 'SIM-000004',
    microchip: null,
    descripcion: 'Gato con herida visible en pata trasera dejado a la intemperie sin atención veterinaria.',
    ubicacion: 'Av. Brasil 1890, Antofagasta',
    estado: 'resuelta',
    equipo: 'Equipo 3',
    asignadoPor: '22222222-2',
    fechaAsignacion: new Date()
  },
  {
    rutDenunciante: '15555555-5',
    tipo: 'abandono',
    animalId: 'SIM-000005',
    microchip: '900999888777666',
    descripcion: 'Perro adulto desorientado y con signos de deshidratación en la vía pública.',
    ubicacion: 'Calle Prat 450, Antofagasta',
    estado: 'cerrada',
    equipo: 'Equipo 1',
    asignadoPor: '22222222-2',
    fechaAsignacion: new Date(),
    observaciones: 'Animal rescatado por Equipo 1, evaluado en veterinaria municipal y derivado a hogar temporal.',
    fechaCierre: new Date()
  }
];

async function cargarDatos() {
  if (!MONGO_URI) {
    console.error('Error: No se encontró MONGO_URI ni MONGODB_URI en el archivo .env');
    process.exit(1);
  }

  try {
    await mongoose.connect(MONGO_URI);
    const insertadas = await Denuncia.insertMany(denunciasDemo);
    console.log(`Listo: se insertaron ${insertadas.length} denuncias (una por cada estado).`);
  } catch (err) {
    console.error('Error al insertar denuncias:', err.message);
  } finally {
    await mongoose.disconnect();
  }
}

cargarDatos();