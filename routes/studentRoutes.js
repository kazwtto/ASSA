const express = require('express');
const router = express.Router();
const Exam = require('../models/Exam');
const Result = require('../models/Result');
const User = require('../models/User');
const auth = require('../middleware/authMiddleware');

// ROTA PRINCIPAL: PAINEL DO ALUNO
router.get('/dashboard', auth(['student']), async (req, res) => {
  const now = new Date();

  // 1. Busca provas ativas (não arquivadas)
  const allExams = await Exam.find({ isArchived: false }).lean();
  
  // 2. Busca resultados deste aluno
  const myResults = await Result.find({ studentId: req.user.id }).lean();

  // 3. Filtra: O que está disponível vs O que já foi feito
  const available = [];
  const history = [];

  for (let exam of allExams) {
    // Verifica se já fez
    const result = myResults.find(r => r.examId.toString() === exam._id.toString());

    if (result) {
      // Já fez -> vai pro histórico
      history.push({
        _id: exam._id,
        title: exam.title,
        submittedAt: result.submittedAt,
        score: result.score,
        totalQuestions: result.totalQuestions
      });
    } else {
      // Não fez -> Verifica datas
      const start = new Date(exam.startTime);
      const end = new Date(exam.endTime);
      
      let status = 'future';
      if (now >= start && now <= end) status = 'open';
      if (now > end) status = 'closed';

      available.push({
        _id: exam._id,
        title: exam.title,
        startTime: exam.startTime,
        endTime: exam.endTime,
        status: status, // 'open', 'future', 'closed'
        questionsCount: exam.questions.length
      });
    }
  }

  res.json({ available, history });
});

// PEGAR UMA PROVA ESPECÍFICA PARA REALIZAR
router.get('/exam/:id', auth(['student']), async (req, res) => {
  const exam = await Exam.findById(req.params.id);
  if (!exam) return res.status(404).json({ message: 'Prova não encontrada' });

  // Validação Dupla de Tempo
  const now = new Date();
  if (now < new Date(exam.startTime) || now > new Date(exam.endTime)) {
    return res.status(403).json({ message: 'Fora do horário da prova.' });
  }

  // Verificar se já fez
  const existing = await Result.findOne({ examId: exam._id, studentId: req.user.id });
  if (existing) return res.status(403).json({ message: 'Você já concluiu esta prova.' });

  // Sanitizar (Remover gabarito)
  const safeQuestions = exam.questions.map(q => ({
    _id: q._id,
    statement: q.statement,
    options: q.options
  }));

  res.json({ 
    _id: exam._id, 
    title: exam.title, 
    endTime: exam.endTime, 
    questions: safeQuestions 
  });
});

// ENVIAR
router.post('/submit', auth(['student']), async (req, res) => {
  const { examId, answers } = req.body;
  const exam = await Exam.findById(examId);
  
  if (!exam) return res.status(404).json({ message: 'Erro' });
  if (new Date() > new Date(exam.endTime)) return res.status(403).json({ message: 'Tempo Esgotado' });

  // Correção
  let score = 0;
  exam.questions.forEach((q, idx) => {
    // O backend usa ID ou Index. Aqui estamos usando Index no array questions
    // Ajuste conforme seu modelo de dados exato.
    // Assumindo que o front manda { "id_da_questao": indice_escolhido }
    if (answers[q._id] === q.correctOptionIndex) score++;
  });

  await Result.create({
    examId,
    studentId: req.user.id,
    studentEmail: (await User.findById(req.user.id)).email,
    score,
    totalQuestions: exam.questions.length,
    answers
  });

  res.json({ success: true, score });
});

module.exports = router;