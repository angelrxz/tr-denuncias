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
    // Se valida el estado dentro de la actualización para impedir asignaciones duplicadas concurrentes.
    const denuncia = await Denuncia.findOneAndUpdate(
      { _id: id, estado: 'ingresada' },
      {
        $set: {
          estado: 'asignada',
          equipo: nombreEquipo,
          asignadoPor: req.usuario.rut,
          fechaAsignacion: new Date()
        }
      },
      { new: true, runValidators: true }
    );

    if (!denuncia) {
      const actual = await Denuncia.findById(id).select('estado');
      // 404: la denuncia no existe.
      if (!actual) {
        return enviarError(res, 404, 'DENUNCIA_NO_ENCONTRADA', 'No se encontró la denuncia solicitada');
      }

      // 409: el estado cambió o ya había sido asignada.
      return enviarError(
        res,
        409,
        'ESTADO_INVALIDO',
        `No se puede asignar una denuncia que está en estado ${actual.estado}`
      );
    }

    return res.status(200).json(denuncia);
  } catch (e) {
    console.error('Error al asignar denuncia a un equipo:', e);
    return enviarError(res, 500, 'ERROR_INTERNO', 'Ocurrió un error al asignar la denuncia');
  }
});

// HU-04: iniciar el trabajo en terreno tras asignar la denuncia a un equipo.
router.patch('/:id/terreno', validarToken, exigirPerfil('funcionario'), async (req, res) => {
  const { id } = req.params;

  // Se autentica el token y se autoriza el perfil funcionario antes de modificar el estado.
  if (!mongoose.isValidObjectId(id)) {
    return enviarError(res, 400, 'ID_INVALIDO', 'El identificador de la denuncia no es válido');
  }

  try {
    // La transición solo se permite para denuncias asignadas a un equipo.
    const denuncia = await Denuncia.findOneAndUpdate(
      { _id: id, estado: 'asignada', equipo: { $type: 'string', $ne: '' } },
      { $set: { estado: 'en_terreno' } },
      { new: true, runValidators: true }
    );

    if (!denuncia) {
      const actual = await Denuncia.findById(id).select('estado equipo');
      if (!actual) {
        return enviarError(res, 404, 'DENUNCIA_NO_ENCONTRADA', 'No se encontró la denuncia solicitada');
      }

      return enviarError(
        res,
        409,
        'ESTADO_INVALIDO',
        actual.estado === 'asignada' && !actual.equipo
          ? 'La denuncia debe estar asignada a un equipo antes de enviarla a terreno'
          : `No se puede enviar a terreno una denuncia que está en estado ${actual.estado}`
      );
    }

    return res.status(200).json(denuncia);
  } catch (e) {
    console.error('Error al enviar denuncia a terreno:', e);
    return enviarError(res, 500, 'ERROR_INTERNO', 'Ocurrió un error al enviar la denuncia a terreno');
  }
});

module.exports = router;