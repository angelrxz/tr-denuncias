require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');

const app = express();
app.use(express.json());
app.use(express.static('public'));

app.get('/api/denuncias/salud', (req, res) => {
  res.json({ estado: 'ok' });
});

const puerto = process.env.PORT || 3000;
app.use('/api/denuncias/denuncias', require('./rutas/denuncias'));
app.use('/api/denuncias/estadisticas', require('./rutas/estadisticas'));

mongoose.connect(process.env.MONGODB_URI)
  .then(() => {
    console.log('Conectado a MongoDB Atlas');
    app.listen(puerto, () => {
      console.log('Servidor en el puerto ' + puerto);
    });
  })
  .catch((err) => {
    console.error('Error de conexión a MongoDB:', err.message);
    process.exit(1);
  });
app.use((err, req, res, next) => {
  if (res.headersSent) {
    return next(err);
  }
  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({ error: { codigo: 'JSON_INVALIDO', mensaje: 'El cuerpo de la petición no es un JSON válido' } });
  }
  console.error(err);
  res.status(500).json({ error: { codigo: 'ERROR_INTERNO', mensaje: 'Ocurrió un error inesperado' } });
});


