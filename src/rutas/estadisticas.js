const express = require('express');
const router = express.Router();
const { validarToken, exigirPerfil } = require('../middlewares/auth');
const Denuncia = require('../modelos/denuncia');

const ESTADOS = ['ingresada', 'asignada', 'en_terreno', 'resuelta', 'cerrada'];
const TIPOS = ['maltrato', 'abandono'];

// aca la funcion intenta validar token y exigir perfil de jefatura, si no cumple con los 
// requisitos devuelve 401 y el front end limpia sessionStorage y redirige a index.html (ley 21.719)
router.get('/', validarToken, exigirPerfil('jefatura'), async (req, res) => {
  const page = Number(req.query.page) || 1;
  const limit = Number(req.query.limit) || 20;

  if (!Number.isInteger(page) || page < 1 || !Number.isInteger(limit) || limit < 1 || limit > 100) {
    return res.status(400).json({ error: { codigo: 'PAGINACION_INVALIDA', mensaje: 'page debe ser un entero desde 1 y limit un entero entre 1 y 100' } });
  }

  const total = await Denuncia.countDocuments();

  const porEstado = {};
  for (const estado of ESTADOS) {
    porEstado[estado] = await Denuncia.countDocuments({ estado });
  }

  const porTipo = {};
  for (const tipo of TIPOS) {
    porTipo[tipo] = await Denuncia.countDocuments({ tipo });
  }

  const datos = await Denuncia.find()
    .sort({ fechaCreacion: -1 })
    .skip((page - 1) * limit)
    .limit(limit)
    .select('tipo estado animalId fechaCreacion');

  res.json({
    resumen: { total, porEstado, porTipo },
    datos,
    paginacion: { page, limit, total, totalPaginas: Math.ceil(total / limit) }
  });
});

module.exports = router;