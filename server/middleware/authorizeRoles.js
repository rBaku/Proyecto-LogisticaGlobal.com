module.exports = function authorizeRoles(...roles) {
  return function (req, res, next) {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Acceso denegado. No tienes permiso.' });
    }
    next();
  };
};