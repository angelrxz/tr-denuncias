const express = require('express');
const mongoose = require('mongoose');
const router = express.Router();
const { validarToken, exigirPerfil } = require('../middlewares/auth');
const Denuncia = require('../modelos/denuncia');
const { buscarAnimal } = require('../servicios/m1');

const TIPOS = ['maltrato', 'abandono'];

function error(res, status, codigo, mensaje) {
  return res.status(status).json({ error: { codigo, mensaje } });
}

// Listar denuncias (con filtro opcional por estado y paginación)
router.get('/', validarToken, exigirPerfil('funcionario', 'jefatura', 'admin'), async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 20));
    const filtro = {};

    if (typeof req.query.estado === 'string' && req.query.estado.trim()) {
      filtro.estado = req.query.estado.trim();
    }

    const [total, datos] = await Promise.all([
      Denuncia.countDocuments(filtro),
      Denuncia.find(filtro).sort({ fechaCreacion: -1 }).skip((page - 1) * limit).limit(limit)
    ]);

    return res.json({
      page,
      limit,
      total,
      totalPaginas: Math.ceil(total / limit),
      datos
    });
  } catch (e) {
    return error(res, 500, 'ERROR_INTERNO', 'No se pudieron obtener las denuncias');
  }
});

// HU-01: Registrar denuncia
router.post('/', validarToken, exigirPerfil('vecino'), async (req, res) => {
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

  const denuncia = await Denuncia.create({
    rutDenunciante: req.usuario.rut,
    tipo,
    animalId: animalId.trim(),
    microchip: microchip ? String(microchip).trim() : null,
    descripcion: descripcion.trim(),
    ubicacion: ubicacion.trim()
  });

  res.status(201).json(denuncia);
});

// HU-05: Cerrar una denuncia resuelta
router.patch('/:id/cerrar', validarToken, exigirPerfil('funcionario'), async (req, res) => {
  const idDenuncia = String(req.params.id || '').trim();
  const { observaciones } = req.body || {};

  // 1. Validar formato de ObjectId de MongoDB (evita CastError 500)
  if (!mongoose.Types.ObjectId.isValid(idDenuncia)) {
    return error(res, 400, 'ID_INVALIDO', 'El identificador de la denuncia no tiene un formato válido');
  }

  // 2. Regla RN-08: observaciones obligatorias y máximo 500 caracteres
  if (typeof observaciones !== 'string' || !observaciones.trim() || observaciones.trim().length > 500) {
    return error(
      res,
      400,
      'OBSERVACIONES_INVALIDAS',
      'Las observaciones son obligatorias y no deben superar los 500 caracteres (RN-08)'
    );
  }

  try {
    // 3. Buscar denuncia en MongoDB (404 si no existe)
    const denuncia = await Denuncia.findById(idDenuncia);
    if (!denuncia) {
      return error(res, 404, 'DENUNCIA_NO_ENCONTRADA', 'La denuncia no existe');
    }

    // 4. Máquina de estados: solo pasa a cerrada desde "resuelta" (409 si está en otro estado)
    if (denuncia.estado !== 'resuelta') {
      return error(
        res,
        409,
        'ESTADO_INVALIDO',
        `Solo se puede cerrar una denuncia en estado resuelta (estado actual: ${denuncia.estado})`
      );
    }

    // 5. Guardar cierre definitivo con fecha ISO 8601 UTC (200)
    denuncia.estado = 'cerrada';
    denuncia.observaciones = observaciones.trim();
    denuncia.fechaCierre = new Date();
    await denuncia.save();

    return res.status(200).json(denuncia);
  } catch (e) {
    return error(res, 500, 'ERROR_INTERNO', 'Error al cerrar la denuncia');
  }
});

module.exports = router;