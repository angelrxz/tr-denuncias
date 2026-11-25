const mongoose = require('mongoose');

const rescateSchema = new mongoose.Schema(
  {
    denunciaId: { type: mongoose.Schema.Types.ObjectId, ref: 'Denuncia', required: true },
    animalId: { type: String, required: true },
    fechaRescate: { type: Date, default: Date.now },
    observaciones: { type: String, required: true },
    resultado: { type: String, enum: ['rescatado', 'no_encontrado', 'derivado'], required: true },
    registradoPor: { type: String, required: true },
    estado: { type: String, default: 'registrado' }
  },
  { timestamps: { createdAt: 'fechaCreacion', updatedAt: false } }
);

module.exports = mongoose.model('Rescate', rescateSchema);