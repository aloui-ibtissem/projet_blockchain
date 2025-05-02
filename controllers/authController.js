const { ethers } = require("ethers");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const db = require("../config/db");
const sendEmail = require("../utils/sendEmail");
const AuthAbi = require("../abis/Auth.json");
require("dotenv").config();

const provider = new ethers.providers.JsonRpcProvider("http://127.0.0.1:8545");
const signer = new ethers.Wallet(process.env.PRIVATE_KEY, provider);
const authAddress = process.env.AUTH_CONTRACT_ADDRESS;
const authContract = new ethers.Contract(authAddress, AuthAbi.abi, signer);

console.log("AuthController chargé");

exports.register = async (req, res) => {
  try {
    const { prenom, nom, email, role, signature, universiteId, entrepriseId, structureType } = req.body;

    const message = `Inscription:${email}:${role}:123456`;
    const recoveredAddr = ethers.utils.verifyMessage(message, signature);

    // Vérifier si l'adresse existe déjà
    const tables = [
      "Etudiant", "EncadrantAcademique", "EncadrantProfessionnel",
      "ResponsableUniversitaire", "ResponsableEntreprise", "TierDebloqueur"
    ];
    for (const table of tables) {
      const [rows] = await db.execute(`SELECT id FROM ${table} WHERE ethAddress = ?`, [recoveredAddr]);
      if (rows.length > 0) {
        return res.status(400).json({ error: "Cette adresse Ethereum est déjà utilisée." });
      }
    }

    // Vérifier sur blockchain
    const roleOnChain = await authContract.getRole(recoveredAddr);
    if (roleOnChain.toString() !== "0") {
      return res.status(400).json({ error: "Déjà enregistré sur la blockchain." });
    }

    const token = crypto.randomBytes(24).toString("hex");

    // Enregistrer toutes les données pour vérification
    await db.execute(
      `INSERT INTO TokenVerif (prenom, nom, email, role, signature, token, universiteId, entrepriseId, structureType)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [prenom, nom, email, role, signature, token, universiteId || null, entrepriseId || null, structureType || null]
    );

    const lien = `http://localhost:3000/api/auth/verify/${token}`;
    const html = `
      <h3>Bonjour ${prenom},</h3>
      <p>Merci pour votre inscription. Cliquez ici pour confirmer :</p>
      <a href="${lien}">Confirmer mon adresse</a>
    `;

    await sendEmail({ to: email, subject: "Confirmez votre inscription", html });

    return res.json({ success: true, message: "Email de vérification envoyé." });
  } catch (err) {
    console.error("register error:", err);
    return res.status(500).json({ error: err.message });
  }
};

exports.verifyEmailToken = async (req, res) => {
  try {
    const token = req.params.token;

    const [rows] = await db.execute("SELECT * FROM TokenVerif WHERE token = ? AND utilisé = FALSE", [token]);
    if (!rows.length) {
      return res.status(400).send("Lien invalide ou déjà utilisé.");
    }

    const { prenom, nom, email, role, signature, universiteId, entrepriseId, structureType } = rows[0];

    const message = `Inscription:${email}:${role}:123456`;
    const recoveredAddr = ethers.utils.verifyMessage(message, signature);

    const roleEnum = {
      Etudiant: 1,
      EncadrantAcademique: 2,
      EncadrantProfessionnel: 3,
      ResponsableUniversite: 4,
      ResponsableEntreprise: 5,
      TierDebloqueur: 6
    }[role];

    const tx = await authContract.selfRegister(roleEnum);
    await tx.wait();

    let insertQuery = "";
    let insertParams = [];

    if (role === "Etudiant") {
      insertQuery = `INSERT INTO Etudiant (prenom, nom, email, universiteId, ethAddress, role) VALUES (?, ?, ?, ?, ?, ?)`;
      insertParams = [prenom, nom, email, universiteId, recoveredAddr, role];
    } else if (role === "EncadrantAcademique") {
      insertQuery = `INSERT INTO EncadrantAcademique (prenom, nom, email, universiteId, ethAddress, role) VALUES (?, ?, ?, ?, ?, ?)`;
      insertParams = [prenom, nom, email, universiteId, recoveredAddr, role];
    } else if (role === "EncadrantProfessionnel") {
      insertQuery = `INSERT INTO EncadrantProfessionnel (prenom, nom, email, entrepriseId, ethAddress, role) VALUES (?, ?, ?, ?, ?, ?)`;
      insertParams = [prenom, nom, email, entrepriseId, recoveredAddr, role];
    } else if (role === "ResponsableUniversite") {
      insertQuery = `INSERT INTO ResponsableUniversitaire (prenom, nom, email, universiteId, ethAddress, role) VALUES (?, ?, ?, ?, ?, ?)`;
      insertParams = [prenom, nom, email, universiteId, recoveredAddr, role];
    } else if (role === "ResponsableEntreprise") {
      insertQuery = `INSERT INTO ResponsableEntreprise (prenom, nom, email, entrepriseId, ethAddress, role) VALUES (?, ?, ?, ?, ?, ?)`;
      insertParams = [prenom, nom, email, entrepriseId, recoveredAddr, role];
    } else if (role === "TierDebloqueur") {
      insertQuery = `INSERT INTO TierDebloqueur (prenom, nom, email, structureType, universiteId, entrepriseId, ethAddress, role)
                     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`;
      insertParams = [prenom, nom, email, structureType, universiteId || null, entrepriseId || null, recoveredAddr, role];
    }

    await db.execute(insertQuery, insertParams);

    await db.execute("UPDATE TokenVerif SET utilisé=TRUE WHERE token=?", [token]);

    res.redirect("http://localhost:3001/login");
  } catch (err) {
    console.error("verifyEmailToken error:", err);
    res.status(500).send("Erreur lors de la vérification.");
  }
};

exports.login = async (req, res) => {
  try {
    const { email, role, signature } = req.body;

    const message = `Connexion:${email}:${role}:123456`;
    const recoveredAddr = ethers.utils.verifyMessage(message, signature);

    const table = role === "Etudiant" ? "Etudiant" :
                  role === "EncadrantAcademique" ? "EncadrantAcademique" :
                  role === "EncadrantProfessionnel" ? "EncadrantProfessionnel" :
                  role === "ResponsableUniversite" ? "ResponsableUniversitaire" :
                  role === "ResponsableEntreprise" ? "ResponsableEntreprise" :
                  role === "TierDebloqueur" ? "TierDebloqueur" : null;

    if (!table) return res.status(400).json({ error: "Rôle invalide" });

    const [rows] = await db.execute(`SELECT ethAddress FROM ${table} WHERE email=? AND role=?`, [email, role]);

    if (!rows.length) return res.status(404).json({ error: "Utilisateur introuvable" });

    const dbAddress = rows[0].ethAddress.toLowerCase();
    if (dbAddress !== recoveredAddr.toLowerCase()) {
      return res.status(401).json({ error: "Signature invalide" });
    }

    const token = jwt.sign(
      { email, role, ethAddress: dbAddress },
      process.env.JWT_SECRET,
      { expiresIn: "2h" }
    );

    return res.json({ success: true, token, role });
  } catch (err) {
    console.error("login error:", err);
    return res.status(500).json({ error: err.message });
  }
};
/// get  tier debloqueur infos to authenticate him properly based on his structuretype
exports.getTierInfo = async (req, res) => {
  try {
    const { email } = req.user;
    const [[tier]] = await db.execute("SELECT structureType FROM TierDebloqueur WHERE email = ?", [email]);
    if (!tier) return res.status(404).json({ error: "Tier non trouvé" });

    res.json({ success: true, structureType: tier.structureType });
  } catch (err) {
    console.error("getTierInfo error:", err);
    res.status(500).json({ error: "Erreur serveur" });
  }
};

