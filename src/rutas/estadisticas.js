const express = require('express');
const router = express.Router();
const { validarToken, exigirPerfil } = require('../middlewares/auth');
const Denuncia = require('../modelos/denuncia');

const ESTADOS = ['ingresada', 'asignada', 'en_terreno', 'resuelta', 'cerrada'];
const TIPOS = ['maltrato', 'abandono'];

router.get('/', validarToken, exigirPerfil('jefatura'), async (req, res) => {
  const total = await Denuncia.countDocuments();

  const porEstado = {};
  for (const estado of ESTADOS) {
    porEstado[estado] = await Denuncia.countDocuments({ estado });
  }

  const porTipo = {};
  for (const tipo of TIPOS) {
    porTipo[tipo] = await Denuncia.countDocuments({ tipo });
  }

  res.json({ resumen: { total, porEstado, porTipo } });
});

module.exports = router;