const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const Exam = require('../models/Exam');
const Result = require('../models/Result');
const auth = require('../middleware/authMiddleware');

// 3.1, 3.2, 3.3, 3.4: GERENCIADOR DE PROVAS (Criar, Editar, Arquivar, Deletar)
router.get('/exams', auth(['admin']), async (req, res) => {
  const exams = await Exam.find().sort({ createdAt: -1 });
  res.json(exams);
});

router.post('/exams', auth(['admin']), async (req, res) => {
  try { const exam = await Exam.create(req.body); res.json(exam); } 
  catch (err) { res.status(500).json({ error: err.message }); }
});

router.put('/exams/:id', auth(['admin']), async (req, res) => {
  try { const exam = await Exam.findByIdAndUpdate(req.params.id, req.body, { new: true }); res.json(exam); } 
  catch (err) { res.status(500).json({ error: err.message }); }
});

router.delete('/exams/:id', auth(['admin']), async (req, res) => {
  await Exam.findByIdAndDelete(req.params.id);
  await Result.deleteMany({ examId: req.params.id }); // Limpa histórico da prova deletada
  res.json({ success: true });
});

// 4. GERENCIADOR DE PARTICIPANTES (Adicionar, Remover, Editar tempo)
router.get('/users', auth(['admin']), async (req, res) => {
  const users = await User.find({ role: 'student' });
  res.json(users);
});

router.post('/users', auth(['admin']), async (req, res) => {
  const { email, hoursToExpire } = req.body;
  const exists = await User.findOne({ email });
  if (exists) return res.status(400).json({ message: 'Email já existe' });

  const rawPassword = Math.random().toString(36).slice(-6);
  const hashedPassword = await bcrypt.hash(rawPassword, 10);
  
  // Lógica de Expiração
  let expiresAt = null;
  if (hoursToExpire) {
    const d = new Date();
    d.setHours(d.getHours() + parseInt(hoursToExpire));
    expiresAt = d;
  }

  const user = await User.create({ email, password: hashedPassword, rawPassword, role: 'student', expiresAt });
  res.json({ email: user.email, rawPassword, expiresAt });
});

router.put('/users/:id', auth(['admin']), async (req, res) => {
  // RENOVAR / EDITAR
  const { hoursToExpire } = req.body;
  const d = new Date();
  d.setHours(d.getHours() + parseInt(hoursToExpire));
  
  await User.findByIdAndUpdate(req.params.id, { expiresAt: d });
  res.json({ success: true });
});

router.delete('/users/:id', auth(['admin']), async (req, res) => {
  await User.findByIdAndDelete(req.params.id);
  await Result.deleteMany({ studentId: req.params.id });
  res.json({ success: true });
});

// 5. HISTÓRICO E MÉTRICAS
router.get('/analytics/:examId', auth(['admin']), async (req, res) => {
  const results = await Result.find({ examId: req.params.examId });
  const total = results.length;
  const avg = total > 0 ? results.reduce((a, b) => a + b.score, 0) / total : 0;
  
  res.json({
    metrics: { totalAttempts: total, averageScore: avg.toFixed(2) },
    results
  });
});

module.exports = router;