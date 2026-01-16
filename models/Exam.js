const mongoose = require('mongoose');
const ExamSchema = new mongoose.Schema({
  title: String,
  startTime: Date,
  endTime: Date,
  isArchived: { type: Boolean, default: false },
  questions: [{
    statement: String,
    options: [String], // Array de alternativas
    correctOptionIndex: Number // Índice da resposta correta (0, 1, 2...) para correção auto
  }]
}, { timestamps: true });
module.exports = mongoose.model('Exam', ExamSchema);