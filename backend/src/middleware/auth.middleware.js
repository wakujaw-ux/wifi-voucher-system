const { verifyToken } = require('../utils/jwt');
const { error } = require('../utils/response');

const authenticate = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return error(res, 'Token haipo', 'NO_TOKEN', 401);
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = verifyToken(token);
    req.user = decoded;
    next();
  } catch (err) {
    return error(res, 'Token si sahihi au imeisha muda', 'INVALID_TOKEN', 401);
  }
};

const requireRole = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return error(res, 'Haujaingia', 'NOT_AUTHENTICATED', 401);
    }
    if (!allowedRoles.includes(req.user.role)) {
      return error(res, 'Hauna ruhusa', 'FORBIDDEN', 403);
    }
    next();
  };
};

module.exports = { authenticate, requireRole };