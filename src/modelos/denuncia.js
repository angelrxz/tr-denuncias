const mongoose = require('mongoose');

const denunciaSchema = new mongoose.Schema({
  rutDenunciante: { type: String, required: true },
  tipo: { type: String, enum: ['maltrato', 'abandono'], required: true },
  animalId: { type: String, required: true },
  microchip: { type: String, default: null },
  descripcion: { type: String, required: true, minlength: 10, maxlength: 500 },
  ubicacion: { type: String, required: true, maxlength: 200 },
  estado: {
    type: String,
    enum: ['ingresada', 'asignada', 'en_terreno', 'resuelta', 'cerrada'],
    default: 'ingresada'
  },
  fechaCreacion: { type: Date, default: Date.now }
}, { versionKey: false });

module.exports = mongoose.model('Denuncia', denunciaSchema);