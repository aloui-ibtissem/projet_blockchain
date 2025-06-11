const { ethers } = require("ethers");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const fs = require("fs");
const path = require("path");
const db = require("../config/db");
const sendEmail = require("../utils/sendEmail");
const { genererIdentifiantActeur } = require("../utils/identifiantUtils");
const AuthAbi = require("../abis/Auth.json");
require("dotenv").config();

const provider = new ethers.providers.JsonRpcProvider(process.env.BLOCKCHAIN_RPC_URL);
const signer = new ethers.Wallet(process.env.PRIVATE_KEY, provider);
const authContract = new ethers.Contract(
  process.env.AUTH_CONTRACT_ADDRESS,
  AuthAbi.abi,
  signer
);

console.log("AuthController chargé");

// 1) Enregistrement + Envoi du mail de vérification
exports.register = async (req, res) => {
  try {
    const {
      prenom, nom, email, role, signature,
      universiteId, entrepriseId, structureType: rawType
    } = req.body;

    let structureType;
    if (["Etudiant", "EncadrantAcademique", "ResponsableUniversitaire"].includes(role)) {
      structureType = "universite";
    } else if (["EncadrantProfessionnel", "ResponsableEntreprise"].includes(role)) {
      structureType = "entreprise";
    } else if (role === "TierDebloqueur") {
      if (!rawType) return res.status(400).json({ error: "structureType requis pour TierDebloqueur." });
      structureType = rawType.toLowerCase();
      if (!["universite", "entreprise"].includes(structureType)) {
        return res.status(400).json({ error: "structureType invalide." });
      }
    } else {
      return res.status(400).json({ error: `Rôle inconnu : ${role}` });
    }

    const message = `Inscription:${email}:${role}:123456`;
    const recoveredAddr = ethers.utils.verifyMessage(message, signature);

    const tables = [
      "Etudiant", "EncadrantAcademique", "EncadrantProfessionnel",
      "ResponsableUniversitaire", "ResponsableEntreprise", "TierDebloqueur"
    ];
    for (const t of tables) {
      const [rows] = await db.execute(
        `SELECT id FROM ${t} WHERE ethAddress = ?`,
        [recoveredAddr]
      );
      if (rows.length) {
        return res.status(400).json({ error: "Adresse Ethereum déjà utilisée." });
      }
    }

    const onChainRole = await authContract.getRole(recoveredAddr);
    if (onChainRole.toString() !== "0") {
      return res.status(400).json({ error: "Déjà enregistré sur la blockchain." });
    }

    const token = crypto.randomBytes(24).toString("hex");
    let uniId = null, entId = null;
    if (structureType === "universite") {
      if (!universiteId) return res.status(400).json({ error: "universiteId requis." });
      uniId = isNaN(universiteId)
        ? (await db.execute("SELECT id FROM Universite WHERE nom = ?", [universiteId]))[0][0]?.id
        : +universiteId;
    }
    if (structureType === "entreprise") {
      if (!entrepriseId) return res.status(400).json({ error: "entrepriseId requis." });
      entId = isNaN(entrepriseId)
        ? (await db.execute("SELECT id FROM Entreprise WHERE nom = ?", [entrepriseId]))[0][0]?.id
        : +entrepriseId;
    }

    await db.execute(
      `INSERT INTO TokenVerif
         (prenom, nom, email, role, signature, token, universiteId, entrepriseId, structureType)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [prenom, nom, email, role, signature, token, uniId, entId, structureType]
    );

    // Choisir l’URL (public ou local)
    const confirmationUrl = `${process.env.PUBLIC_URL}/api/auth/verify-email/${token}`;


    // Lecture et personnalisation du template
    const templatePath = path.join(__dirname, "../templates/emails/verification_email.html");
    let htmlTemplate = fs.readFileSync(templatePath, "utf8");
   htmlTemplate = htmlTemplate
  .replace(/{{prenom}}/g, prenom)
  .replace(/{{verificationUrl}}/g, confirmationUrl)
  .replace(/{{year}}/g, new Date().getFullYear());

await sendEmail({
  to: email,
  subject: "Confirmez votre adresse email sur StageChain",
  html: htmlTemplate,
  text: `Bonjour ${prenom},\n\nMerci pour votre inscription sur StageChain.\nVeuillez confirmer votre email en cliquant sur ce lien : ${confirmationUrl}\n\nCe lien est valide pour une durée limitée.\n\nL’équipe StageChain`
});


    res.json({ success: true, message: "Email de vérification envoyé." });
  } catch (err) {
    console.error("register error:", err);
    res.status(500).json({ error: err.message });
  }
};

// 2) Vérification de l'email via token
exports.verifyEmailToken = async (req, res) => {
  try {
    const token = req.params.token;
    const [tokens] = await db.execute(
      "SELECT * FROM TokenVerif WHERE token = ? AND utilisé = FALSE", [token]
    );
    if (!tokens.length) return res.status(400).send("Lien invalide ou déjà utilisé.");

    const rec = tokens[0];
    const {
      prenom, nom, email, role, signature,
      universiteId, entrepriseId, structureType, id: tokenId
    } = rec;

    const message = `Inscription:${email}:${role}:123456`;
    const recoveredAddr = ethers.utils.verifyMessage(message, signature);

    const mapEnum = {
      Etudiant: 1,
      EncadrantAcademique: 2,
      EncadrantProfessionnel: 3,
      ResponsableUniversitaire: 4,
      ResponsableEntreprise: 5,
      TierDebloqueur: 6
    };
    const roleEnum = mapEnum[role];
    if (!roleEnum) throw new Error(`Rôle '${role}' non reconnu.`);
try {
  const existing = await authContract.getRole(recoveredAddr);
  if (existing.toString() !== "0") {
    console.log("Adresse déjà enregistrée sur la blockchain. Aucun enregistrement nécessaire.");
  } else {
    const tx = await authContract.selfRegister(roleEnum);
    await tx.wait();
    console.log("Enregistrement blockchain effectué.");
  }
} catch (err) {
  console.error("Erreur lors de la vérification ou de l'enregistrement sur la blockchain :", err.reason || err);
}


    const structId = structureType === "entreprise" ? entrepriseId : universiteId;
    const identifiant = await genererIdentifiantActeur({
      role, structureType, structureId: structId
    });

    let q, params;
    switch (role) {
      case "Etudiant":
        q = `INSERT INTO Etudiant
             (prenom, nom, email, universiteId, ethAddress, role, identifiant_unique)
             VALUES (?, ?, ?, ?, ?, ?, ?)`;
        params = [prenom, nom, email, universiteId, recoveredAddr, role, identifiant];
        break;
      case "EncadrantAcademique":
        q = `INSERT INTO EncadrantAcademique
             (prenom, nom, email, universiteId, ethAddress, role, identifiant_unique)
             VALUES (?, ?, ?, ?, ?, ?, ?)`;
        params = [prenom, nom, email, universiteId, recoveredAddr, role, identifiant];
        break;
      case "EncadrantProfessionnel":
        q = `INSERT INTO EncadrantProfessionnel
             (prenom, nom, email, entrepriseId, ethAddress, role, identifiant_unique)
             VALUES (?, ?, ?, ?, ?, ?, ?)`;
        params = [prenom, nom, email, entrepriseId, recoveredAddr, role, identifiant];
        break;
      case "ResponsableUniversitaire":
        q = `INSERT INTO ResponsableUniversitaire
             (prenom, nom, email, universiteId, ethAddress, role, identifiant_unique)
             VALUES (?, ?, ?, ?, ?, ?, ?)`;
        params = [prenom, nom, email, universiteId, recoveredAddr, role, identifiant];
        break;
      case "ResponsableEntreprise":
        q = `INSERT INTO ResponsableEntreprise
             (prenom, nom, email, entrepriseId, ethAddress, role, identifiant_unique)
             VALUES (?, ?, ?, ?, ?, ?, ?)`;
        params = [prenom, nom, email, entrepriseId, recoveredAddr, role, identifiant];
        break;
      case "TierDebloqueur":
        q = `INSERT INTO TierDebloqueur
             (prenom, nom, email, structureType, universiteId, entrepriseId, ethAddress, role, identifiant_unique)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`;
        params = [
          prenom, nom, email, structureType,
          universiteId, entrepriseId, recoveredAddr, role, identifiant
        ];
        break;
      default:
        throw new Error(`Insertion non gérée pour le rôle ${role}`);
    }

    await db.execute(q, params);
    await db.execute("UPDATE TokenVerif SET utilisé = TRUE WHERE id = ?", [tokenId]);
    //
    const frontend = process.env.PUBLIC_FRONTEND_URL || process.env.FRONTEND_URL;
    //
     return res.redirect(`${frontend}/verified`);
  } catch (err) {
    console.error("verifyEmailToken error:", err);
    return res.status(500).json({ error: err.message });
  }
};

// 3) Connexion avec JWT
exports.login = async (req, res) => {
  try {
    const { email, role, signature } = req.body;
    const message = `Connexion:${email}:${role}:123456`;
    const recoveredAddr = ethers.utils.verifyMessage(message, signature);

    const tbl = {
      Etudiant: "Etudiant",
      EncadrantAcademique: "EncadrantAcademique",
      EncadrantProfessionnel: "EncadrantProfessionnel",
      ResponsableUniversitaire: "ResponsableUniversitaire",
      ResponsableEntreprise: "ResponsableEntreprise",
      TierDebloqueur: "TierDebloqueur"
    }[role];

    if (!tbl) return res.status(400).json({ error: "Rôle invalide." });

    const [rows] = await db.execute(
      `SELECT ethAddress FROM ${tbl} WHERE email = ? AND role = ?`,
      [email, role]
    );
    if (!rows.length) return res.status(404).json({ error: "Utilisateur introuvable." });

    if (rows[0].ethAddress.toLowerCase() !== recoveredAddr.toLowerCase()) {
      return res.status(401).json({ error: "Signature invalide." });
    }

    const token = jwt.sign(
      { email, role, ethAddress: rows[0].ethAddress },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN }
    );

    return res.json({ success: true, token, role });
  } catch (err) {
    console.error("login error:", err);
    return res.status(500).json({ error: err.message });
  }
};

// 4) Récupération structureType du TierDébloqueur
exports.getTierInfo = async (req, res) => {
  try {
    const { email } = req.user;
    const [[tier]] = await db.execute(
      "SELECT structureType FROM TierDebloqueur WHERE email = ?",
      [email]
    );
    if (!tier) return res.status(404).json({ error: "Tier non trouvé." });
    return res.json({ success: true, structureType: tier.structureType });
  } catch (err) {
    console.error("getTierInfo error:", err);
    return res.status(500).json({ error: "Erreur serveur." });
  }
};
