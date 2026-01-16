//require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('./models/User');

const app = express();
app.use(express.json());
app.use(cors());

mongoose.connect(process.env.MONGO_URI).then(() => console.log("Mongo OK"));

// Login Geral
app.post('/api/login', async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email });
  if (!user) return res.status(400).json({ message: 'Email ou senha incorreta' });

  // VERIFICAÇÃO DE EXPIRAÇÃO
  if (user.role === 'student' && user.expiresAt && new Date() > new Date(user.expiresAt)) {
    return res.status(403).json({ message: 'ACESSO EXPIRADO. Contate o admin.' });
  }

  const match = await bcrypt.compare(password, user.password);
  if (!match) return res.status(400).json({ message: 'Email ou senha incorreta' });

  const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET);
  res.json({ token, user: { email: user.email, role: user.role } });
});

app.use('/api/admin', require('./routes/adminRoutes'));
app.use('/api/student', require('./routes/studentRoutes'));

// Seed de Emergência
app.get('/api/seed', async(req, res) => {
   if(await User.findOne({role:'admin'})) return res.send("Admin já existe");
   const p = await bcrypt.hash('admin123', 10);
   await User.create({ email:'admin@mente.com', password:p, role:'admin' });
   res.send("Admin criado");
});

app.listen(process.env.PORT, () => console.log('Server 5000'));