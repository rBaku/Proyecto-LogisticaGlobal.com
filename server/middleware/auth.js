const jwt = require('jsonwebtoken');

const authMiddleware = (req, res, next) => {
  const token = req.cookies.access_token;
  if (!token) {
    return res.status(403).json({ error: 'Token no proporcionado' });
  }

  try {
    const user = jwt.verify(token, process.env.JWT_SECRET);
    req.user = user; // Guardamos el usuario en req.user
    next();
  } catch (err) {
    return res.status(403).json({ error: 'Token inválido' });
  }
};

module.exports = authMiddleware;