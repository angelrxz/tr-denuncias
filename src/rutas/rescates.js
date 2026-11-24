const express = require('express');
const mongoose = require('mongoose');
const router = express.Router();
const Rescate = require('../modelos/rescate');
const Denuncia = require('../modelos/denuncia');
const { validarToken, exigirPerfil, enviarError } = require('../middlewares/auth');

const RESULTADOS = ['rescatado', 'no_encontrado', 'derivado'];

  router.post('/', validarToken, exigirPerfil('funcionario'), async (req, res) => {
  const { denunciaId, observaciones, resultado, fechaRescate } = req.body;

  if (!mongoose.isValidObjectId(denunciaId)) {
    return enviarError(res, 400, 'DENUNCIA_INVALIDA', 'El id de la denuncia no es válido');
  }
  if (!RESULTADOS.includes(resultado)) {
    return enviarError(res, 400, 'RESULTADO_INVALIDO', 'El resultado debe ser rescatado, no_encontrado o derivado');
  }
  if (typeof observaciones !== 'string' || observaciones.trim().length < 10 || observaciones.trim().length > 500) {
    return enviarError(res, 400, 'OBSERVACIONES_INVALIDAS', 'Las observaciones deben tener entre 10 y 500 caracteres');
  }
  if (fechaRescate && (isNaN(new Date(fechaRescate)) || new Date(fechaRescate) > new Date())) {
    return enviarError(res, 400, 'FECHA_INVALIDA', 'La fecha del rescate no es válida ni puede ser futura');
  }

  try {
    const denuncia = await Denuncia.findById(denunciaId);
    if (!denuncia) {
      return enviarError(res, 404, 'DENUNCIA_NO_ENCONTRADA', 'La denuncia no existe');
    }

    const yaExiste = await Rescate.findOne({ denunciaId });
    if (yaExiste) {
      return enviarError(res, 409, 'RESCATE_YA_REGISTRADO', 'Esta denuncia ya tiene un rescate registrado');
    }

    const rescate = await Rescate.create({
      denunciaId,
      animalId: denuncia.animalId,
      fechaRescate: fechaRescate || undefined,
      observaciones: observaciones.trim(),
      resultado,
      registradoPor: req.usuario.rut
    });
    return res.status(201).json(rescate);
  } catch (e) {
    console.error('Error al registrar rescate:', e);
    return enviarError(res, 500, 'ERROR_INTERNO', 'No se pudo registrar el rescate');
  }
});

module.exports = router;

