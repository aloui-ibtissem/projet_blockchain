const jwt = require('jsonwebtoken');

const checkRole = (role) => {
  return (req, res, next) => {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    if (!token) return res.status(401).send({ message: "Accès refusé. Token manquant." });

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      if (decoded.role !== role) {
        return res.status(403).send({ message: "Accès refusé. Rôle insuffisant." });
      }
      next();
    } catch (err) {
      res.status(400).send({ message: "Token invalide." });
    }
  };
};

module.exports = { checkRole };
