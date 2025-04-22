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
    const { prenom, nom, email, role, signature } = req.body;

    const message = `Inscription:${email}:${role}:123456`;
    const recoveredAddr = ethers.utils.verifyMessage(message, signature);

    const tables = [
      "Etudiant",
      "EncadrantAcademique",
      "EncadrantProfessionnel",
      "ResponsableUniversitaire",
      "ResponsableEntreprise"
    ];
    for (const table of tables) {
      const [rows] = await db.execute(`SELECT id FROM ${table} WHERE ethAddress = ?`, [recoveredAddr]);
      if (rows.length > 0) {
        return res.status(400).json({ error: "Cette adresse Ethereum est déjà utilisée." });
      }
    }

    const roleOnChain = await authContract.getRole(recoveredAddr);
    if (roleOnChain.toString() !== "0") {
      return res.status(400).json({ error: "Déjà enregistré sur la blockchain." });
    }

    const token = crypto.randomBytes(24).toString("hex");

    await db.execute(
      `INSERT INTO TokenVerif (prenom, nom, email, role, signature, token) VALUES (?, ?, ?, ?, ?, ?)`,
      [prenom, nom, email, role, signature, token]
    );

    const lien = `http://localhost:3000/api/auth/verify/${token}`;
    const html = `
      <h3>Bonjour ${prenom},</h3>
      <p>Merci pour votre inscription. Cliquez ici pour confirmer :</p>
      <a href="${lien}">Confirmer mon adresse</a>
    `;

    await sendEmail({
      to: email,
      subject: "Confirmez votre inscription",
      html
    });

    return res.json({ success: true, message: "Email de vérification envoyé." });
  } catch (err) {
    console.error("register error:", err);
    return res.status(500).json({ error: err.message });
  }
};

exports.verifyEmailToken = async (req, res) => {
  try {
    const token = req.params.token;

    const [rows] = await db.execute(
      "SELECT * FROM TokenVerif WHERE token = ? AND utilisé = FALSE",
      [token]
    );

    if (!rows.length) {
      return res.status(400).send("Lien invalide ou déjà utilisé.");
    }

    const { prenom, nom, email, role, signature } = rows[0];
    const message = `Inscription:${email}:${role}:123456`;
    const recoveredAddr = ethers.utils.verifyMessage(message, signature);

    const roleEnum = {
      Etudiant: 1,
      EncadrantAcademique: 2,
      EncadrantProfessionnel: 3,
      ResponsableUniversite: 4,
      ResponsableEntreprise: 5
    }[role];

    const tx = await authContract.selfRegister(roleEnum);
    await tx.wait();

    const table =
      role === "Etudiant" ? "Etudiant" :
      role === "EncadrantAcademique" ? "EncadrantAcademique" :
      role === "EncadrantProfessionnel" ? "EncadrantProfessionnel" :
      role === "ResponsableUniversite" ? "ResponsableUniversitaire" :
      "ResponsableEntreprise";

    await db.execute(
      `INSERT INTO ${table} (prenom, nom, email, ethAddress, role) VALUES (?, ?, ?, ?, ?)`,
      [prenom, nom, email, recoveredAddr, role]
    );

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

    const table =
      role === "Etudiant" ? "Etudiant" :
      role === "EncadrantAcademique" ? "EncadrantAcademique" :
      role === "EncadrantProfessionnel" ? "EncadrantProfessionnel" :
      role === "ResponsableUniversite" ? "ResponsableUniversitaire" :
      role === "ResponsableEntreprise" ? "ResponsableEntreprise" :
      null;

    if (!table) return res.status(400).json({ error: "Rôle invalide" });

    const [rows] = await db.execute(
      `SELECT ethAddress FROM ${table} WHERE email=? AND role=?`,
      [email, role]
    );

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

exports.resetRole = async (req, res) => {
  try {
    const { address } = req.body;

    if (!ethers.utils.isAddress(address)) {
      return res.status(400).json({ error: "Adresse Ethereum invalide." });
    }

    const role = await authContract.getRole(address);
    if (role.toString() === "0") {
      return res.status(400).json({ error: "Cet utilisateur n'est pas inscrit sur la blockchain." });
    }

    const tx = await authContract.connect(signer).resetRole(address);
    await tx.wait();

    res.json({ success: true, message: `Le rôle de ${address} a été réinitialisé sur la blockchain.` });
  } catch (err) {
    console.error("resetRole error:", err);
    res.status(500).json({ error: "Erreur lors de la réinitialisation du rôle." });
  }
};

