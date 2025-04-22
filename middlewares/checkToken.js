// middelwares/checkToken
const jwt = require("jsonwebtoken");

module.exports = (req, res, next) => {
  const header = req.headers.authorization;

  if (!header || !header.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Token manquant ou invalide" });
  }

  const token = header.split(" ")[1];
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded; // stocké pour l'utiliser dans les routes protégées
    next();
  } catch (err) {
    return res.status(401).json({ error: "Token expiré ou invalide" });
  }
};
