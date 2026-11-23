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
  observaciones: { type: String, default: null, maxlength: 500 },
  fechaCreacion: { type: Date, default: Date.now },
  fechaCierre: { type: Date, default: null }
}, { versionKey: false });

module.exports = mongoose.model('Denuncia', denunciaSchema);

// agregue observaciones con limite de 500 caracteres segun lo indica la regla rn-08 (Si observaciones falta, 
// está vacío o pasa los 500 caracteres $\rightarrow$ responde 400 (Bad Request).)
