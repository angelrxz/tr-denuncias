const express = require('express');
const mongoose = require('mongoose');
const router = express.Router();
const Denuncia = require('../modelos/denuncia');
const { validarToken, exigirPerfil, enviarError } = require('../middlewares/auth');

// HU-03: Asignar una denuncia a un equipo (ingresada → asignada)
router.patch('/:id/asignar', validarToken, exigirPerfil('funcionario'), async (req, res) => {
  const { id } = req.params;
  const { equipo } = req.body || {};

  // 400: el id no tiene formato válido
  if (!mongoose.isValidObjectId(id)) {
    return enviarError(res, 400, 'ID_INVALIDO', 'El identificador de la denuncia no es válido');
  }

  // 400: falta el equipo (se limpian etiquetas HTML)
  const nombreEquipo = typeof equipo === 'string' ? equipo.replace(/<[^>]*>/g, '').trim() : '';
  if (!nombreEquipo || nombreEquipo.length > 50) {
    return enviarError(res, 400, 'EQUIPO_REQUERIDO', 'Debe indicar el equipo (máximo 50 caracteres)');
  }

  try {
    const denuncia = await Denuncia.findById(id);

    // 200: asignar
    denuncia.estado = 'asignada';
    denuncia.equipo = nombreEquipo;
    denuncia.asignadoPor = req.usuario.rut;
    denuncia.fechaAsignacion = new Date();
    await denuncia.save();

    return res.status(200).json(denuncia);
  } catch (e) {
    return enviarError(res, 500, 'ERROR_INTERNO', 'Ocurrió un error al asignar la denuncia');
  }
});

module.exports = router;