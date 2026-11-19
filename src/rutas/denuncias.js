const express = require('express');
const router = express.Router();

const TIPOS = ['maltrato', 'abandono'];

function error(res, status, codigo, mensaje) {
  return res.status(status).json({ error: { codigo, mensaje } });
}

router.post('/', (req, res) => {
  const { tipo, animalId, microchip, descripcion, ubicacion } = req.body;

  if (!TIPOS.includes(tipo)) {
    return error(res, 400, 'TIPO_INVALIDO', 'El tipo debe ser maltrato o abandono');
  }

  if (!animalId) {
    return error(res, 400, 'ANIMAL_REQUERIDO', 'El animalId es requerido');
  }

  if (microchip && !/^\d{15}$/.test(String(microchip).trim())) {
    return error(res, 400, 'MICROCHIP_INVALIDO', 'El microchip debe tener exactamente 15 números');
  }

  if (!descripcion || descripcion.trim().length < 10 || descripcion.trim().length > 500) {
    return error(res, 400, 'DESCRIPCION_INVALIDA', 'La descripcion debe tener entre 10 y 500 caracteres');
  }

  if (!ubicacion || ubicacion.trim().length > 200) {
    return error(res, 400, 'UBICACION_INVALIDA', 'La ubicacion es requerida y no puede superar los 200 caracteres');
  }

  const denuncia = {
    tipo,
    animalId,
    microchip: microchip ? String(microchip).trim() : null,
    descripcion,
    ubicacion,
    estado: 'ingresada',
    fechaCreacion: new Date().toISOString()
  };

  res.status(201).json(denuncia);
});

module.exports = router;