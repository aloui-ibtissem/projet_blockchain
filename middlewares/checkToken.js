const jwt = require("jsonwebtoken");
const db = require("../config/db");

module.exports = async (req, res, next) => {
  const header = req.headers.authorization;
  if (!header || !header.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Token manquant ou invalide" });
  }

  const token = header.split(" ")[1];
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const email = decoded.email;
    const role = decoded.role;

    const table = role === 'EncadrantAcademique' ? 'EncadrantAcademique'
                : role === 'EncadrantProfessionnel' ? 'EncadrantProfessionnel'
                : role === 'Etudiant' ? 'Etudiant'
                : role === 'ResponsableUniversitaire' ? 'ResponsableUniversitaire'
                : role === 'ResponsableEntreprise' ? 'ResponsableEntreprise'
                : role === 'TierDebloqueur' ? 'TierDebloqueur'
                : null;

    if (table) {
      const [[row]] = await db.execute(`SELECT id FROM ${table} WHERE email = ?`, [email]);
      if (!row) return res.status(401).json({ error: "Utilisateur introuvable" });
      req.user = { id: row.id, email, role };
      next();
    } else {
      return res.status(401).json({ error: "Rôle non reconnu" });
    }
  } catch (err) {
    return res.status(401).json({ error: "Token expiré ou invalide" });
    
  }
};


