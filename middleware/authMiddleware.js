const jwt = require('jsonwebtoken');
const User = require('../models/User');

module.exports = (roles = []) => async (req, res, next) => {
  const token = req.headers['authorization']?.split(' ')[1];
  if (!token) return res.status(401).json({ message: 'No token' });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id);
    
    if (!user) return res.status(401).json({ message: 'User not found' });
    
    // FUNCIONALIDADE 4: TEMPO LIMITE DE LOGIN
    if (user.role === 'student' && user.expiresAt && new Date() > new Date(user.expiresAt)) {
      return res.status(403).json({ message: 'Seu acesso expirou.' });
    }

    if (roles.length && !roles.includes(decoded.role)) {
      return res.status(403).json({ message: 'Forbidden' });
    }
    
    req.user = decoded;
    next();
  } catch (err) { res.status(401).json({ message: 'Invalid token' }); }
};