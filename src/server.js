require('dotenv').config();
const express = require('express');

const app = express();
app.use(express.json());
app.use(express.static('public'));

app.get('/api/denuncias/salud', (req, res) => {
  res.json({ estado: 'ok' });
});

const puerto = process.env.PORT || 3000;
app.listen(puerto, () => {
  console.log('Servidor en el puerto ' + puerto);
});