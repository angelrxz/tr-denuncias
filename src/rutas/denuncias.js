const express = require('express');
const router = express.Router();
const { buscarAnimal } = require('../servicios/m1');

const TIPOS = ['maltrato', 'abandono'];

function error(res, status, codigo, mensaje) {
  return res.status(status).json({ error: { codigo, mensaje } });
}

router.post('/', async (req, res) => {
  const { tipo, animalId, microchip, descripcion, ubicacion } = req.body;

  if (!TIPOS.includes(tipo)) {
    return error(res, 400, 'TIPO_INVALIDO', 'El tipo debe ser maltrato o abandono');
  }

  if (typeof animalId !== 'string' || !animalId.trim()) {
    return error(res, 400, 'ANIMAL_REQUERIDO', 'Debe indicar el animal de la denuncia');
  }

  if (microchip && !/^\d{15}$/.test(String(microchip).trim())) {
    return error(res, 400, 'MICROCHIP_INVALIDO', 'El microchip debe tener exactamente 15 números');
  }

  if (typeof descripcion !== 'string' || descripcion.trim().length < 10 || descripcion.trim().length > 500) {
    return error(res, 400, 'DESCRIPCION_INVALIDA', 'La descripción debe tener entre 10 y 500 caracteres');
  }

  if (typeof ubicacion !== 'string' || !ubicacion.trim() || ubicacion.trim().length > 200) {
    return error(res, 400, 'UBICACION_INVALIDA', 'La ubicación es obligatoria y no puede superar los 200 caracteres');
  }

  let animal;
  try {
    animal = await buscarAnimal(animalId.trim());
  } catch (e) {
    return error(res, 503, 'M1_NO_DISPONIBLE', 'No se pudo consultar el registro de animales');
  }

  if (!animal) {
    return error(res, 404, 'ANIMAL_NO_ENCONTRADO', 'El animal no existe en el registro');
  }

  if (animal.estado === 'fallecido') {
    return error(res, 409, 'ANIMAL_FALLECIDO', 'No se puede registrar una denuncia de un animal fallecido');
  }

  const denuncia = {
    tipo,
    animalId: animalId.trim(),
    microchip: microchip ? String(microchip).trim() : null,
    descripcion: descripcion.trim(),
    ubicacion: ubicacion.trim(),
    estado: 'ingresada',
    fechaCreacion: new Date().toISOString()
  };

  res.status(201).json(denuncia);
});

module.exports = router;