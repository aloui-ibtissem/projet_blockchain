const { ethers } = require("ethers");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
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

// 1) Envoi du mail de confirmation
exports.register = async (req, res) => {
  try {
    const {
      prenom, nom, email, role, signature,
      universiteId, entrepriseId, structureType: rawType
    } = req.body;

    // Détermination du type de structure selon le rôle
    let structureType;
    if (["Etudiant", "EncadrantAcademique", "ResponsableUniversite"].includes(role)) {
      structureType = "universite";
    } else if (["EncadrantProfessionnel", "ResponsableEntreprise"].includes(role)) {
      structureType = "entreprise";
    } else if (role === "TierDebloqueur") {
      if (!rawType) {
        return res.status(400).json({ error: "structureType requis pour TierDebloqueur." });
      }
      structureType = rawType.toLowerCase();
      if (!["universite", "entreprise"].includes(structureType)) {
        return res.status(400).json({ error: "structureType invalide." });
      }
    } else {
      return res.status(400).json({ error: `Rôle inconnu : ${role}` });
    }

    // Vérification signature et unicité en base
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

    // Unicité on-chain
    const onChainRole = await authContract.getRole(recoveredAddr);
    if (onChainRole.toString() !== "0") {
      return res.status(400).json({ error: "Déjà enregistré sur la blockchain." });
    }

    // Création du token
    const token = crypto.randomBytes(24).toString("hex");
    let uniId = null, entId = null;
    if (structureType === "universite") {
      if (!universiteId) {
        return res.status(400).json({ error: "universiteId requis." });
      }
      uniId = isNaN(universiteId)
        ? (await db.execute("SELECT id FROM Universite WHERE nom = ?", [universiteId]))[0][0]?.id
        : +universiteId;
    }
    if (structureType === "entreprise") {
      if (!entrepriseId) {
        return res.status(400).json({ error: "entrepriseId requis." });
      }
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

    // Envoi du mail avec lien élégant
    const linkUrl = `${process.env.BACKEND_URL}/api/auth/verify/${token}`;
    const html = `<h3>Bonjour ${prenom},</h3>
                  <p>Pour finaliser votre inscription, cliquez sur le lien ci-dessous :</p>
                  <p><a href="${linkUrl}">Vérifier mon adresse e-mail</a></p>`;
    await sendEmail({ to: email, subject: "Confirmez votre inscription", html });

    res.json({ success: true, message: "Email de vérification envoyé." });
  } catch (err) {
    console.error("register error:", err);
    res.status(500).json({ error: err.message });
  }
};

// 2) Vérification du token + on-chain + insertion en base du token + on-chain + insertion en base
exports.verifyEmailToken = async (req, res) => {
  try {
    const token = req.params.token;
    const [tokens] = await db.execute(
      "SELECT * FROM TokenVerif WHERE token = ? AND utilisé = FALSE", [token]
    );
    if (!tokens.length) {
      return res.status(400).send("Lien invalide ou déjà utilisé.");
    }
    const rec = tokens[0];
    const {
      prenom, nom, email, role, signature,
      universiteId, entrepriseId, structureType, id: tokenId
    } = rec;

    // Vérif signature
    const message = `Inscription:${email}:${role}:123456`;
    const recoveredAddr = ethers.utils.verifyMessage(message, signature);

    // Mapping rôle → enum
    const mapEnum = {
      Etudiant: 1,
      EncadrantAcademique: 2,
      EncadrantProfessionnel: 3,
      ResponsableUniversite: 4,
      ResponsableEntreprise: 5,
      TierDebloqueur: 6
    };
    const roleEnum = mapEnum[role];
    if (!roleEnum) {
      throw new Error(`Rôle '${role}' non reconnu.`);
    }

    // selfRegister on-chain si nécessaire
    try {
      const existing = await authContract.getRole(recoveredAddr);
      if (existing.toString() === "0") {
        const tx = await authContract.selfRegister(roleEnum);
        await tx.wait();
      }
    } catch (err) {
      console.warn("On-chain registration bypassed:", err.reason || err);
    }

    // Génération identifiant
    const structId = structureType === "entreprise" ? entrepriseId : universiteId;
    const identifiant = await genererIdentifiantActeur({
      role, structureType, structureId: structId
    });

    // Insertion en base selon rôle
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
      case "ResponsableUniversite":
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

    // Marquer token utilisé
    await db.execute(
      "UPDATE TokenVerif SET utilisé = TRUE WHERE id = ?",
      [tokenId]
    );

    // Redirection front-end
    return res.redirect(`${process.env.FRONTEND_URL}/login`);
  } catch (err) {
    console.error("verifyEmailToken error:", err);
    return res.status(500).json({ error: err.message });
  }
};

// 3) Connexion (signature → JWT)
exports.login = async (req, res) => {
  try {
    const { email, role, signature } = req.body;
    const message = `Connexion:${email}:${role}:123456`;
    const recoveredAddr = ethers.utils.verifyMessage(message, signature);

    const mapTable = {
      Etudiant: "Etudiant",
      EncadrantAcademique: "EncadrantAcademique",
      EncadrantProfessionnel: "EncadrantProfessionnel",
      ResponsableUniversite: "ResponsableUniversitaire",
      ResponsableEntreprise: "ResponsableEntreprise",
      TierDebloqueur: "TierDebloqueur"
    };    
    const tbl = mapTable[role];
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

// 4) Récupération structureType pour TierDebloqueur
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
