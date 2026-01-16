const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email });

  if (!user) return res.status(400).json({ message: 'Usuário não encontrado' });

  // 4. VERIFICAÇÃO DE EXPIRAÇÃO
  if (user.expiresAt && new Date() > new Date(user.expiresAt)) {
    return res.status(403).json({ message: 'Seu acesso expirou. Contate o administrador.' });
  }

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) return res.status(400).json({ message: 'Senha incorreta' });

  const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '4h' });
  res.json({ token, user: { email: user.email, role: user.role } });
});

module.exports = router;