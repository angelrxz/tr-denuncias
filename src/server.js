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