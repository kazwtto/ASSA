const mongoose = require('mongoose');
const ResultSchema = new mongoose.Schema({
  examId: { type: mongoose.Schema.Types.ObjectId, ref: 'Exam' },
  studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  studentEmail: String,
  score: Number, // Nota calculada automaticamente
  totalQuestions: Number,
  answers: Object, // O que o aluno marcou
  submittedAt: { type: Date, default: Date.now }
});
module.exports = mongoose.model('Result', ResultSchema);