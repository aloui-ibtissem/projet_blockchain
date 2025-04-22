const { ethers } = require("ethers");
const StageAbi = require("./abis/StageManager.json");
const db = require("../config/db");
require("dotenv").config();

const provider = new ethers.providers.JsonRpcProvider("http://127.0.0.1:8545");
const signer = new ethers.Wallet(process.env.PRIVATE_KEY, provider);

const stageAddress = "0xe7f1725e7734ce288f8367e1bb143e90bb3f0512";
const stageContract = new ethers.Contract(stageAddress, StageAbi.abi, signer);

exports.proposeStage = async (req, res) => {
  try {
    const { email, role, ethAddress } = req.user; // Du token JWT
    const { encAca, encPro, fallbackEnc, dateDebut, dateFin, entrepriseId } = req.body;

    // Sur la blockchain
    const tx = await stageContract.proposeStage(encAca, encPro, fallbackEnc);
    const receipt = await tx.wait();
    let stageId;
    for (const ev of receipt.events) {
      if (ev.event === "StageProposed") {
        stageId = ev.args.stageId.toNumber();
        break;
      }
    }

    // En DB => Stage
    const [etu] = await db.execute(`SELECT id FROM Etudiant WHERE email=?`, [email]);
    if (!etu.length) return res.status(400).json({ error: "Etudiant not found" });
    const etudiantId = etu[0].id;

    const [aca] = await db.execute(`SELECT id FROM EncadrantAcademique WHERE ethAddress=?`, [encAca]);
    const [pro] = await db.execute(`SELECT id FROM EncadrantProfessionnel WHERE ethAddress=?`, [encPro]);
    if (!aca.length || !pro.length) {
      return res.status(400).json({ error: "Encadrants not found" });
    }

    // Insert Stage
    await db.execute(
      `INSERT INTO Stage (etudiantId, encadrantAcademiqueId, encadrantProfessionnelId, entrepriseId, dateDebut, dateFin, intervalleValidation, etat)
       VALUES (?, ?, ?, ?, ?, ?, 7, 'en attente')`,
      [etudiantId, aca[0].id, pro[0].id, entrepriseId, dateDebut, dateFin]
    );

    return res.json({ success: true, stageIdOnChain: stageId });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};

exports.acceptStage = async (req, res) => {
  try {
    const { stageIdOnChain } = req.body;
    const tx = await stageContract.acceptStage(stageIdOnChain);
    await tx.wait();
    return res.json({ success: true, message: "Stage accepted" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};

exports.submitReport = async (req, res) => {
  try {
    const { stageIdOnChain } = req.body;
    const tx = await stageContract.submitReport(stageIdOnChain);
    await tx.wait();
    return res.json({ success: true, message: "Report submitted" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};

exports.validateReport = async (req, res) => {
  try {
    const { stageIdOnChain } = req.body;
    const tx = await stageContract.validateReport(stageIdOnChain);
    await tx.wait();
    return res.json({ success: true, message: "Report validated" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};

exports.issueAttestation = async (req, res) => {
  try {
    const { stageIdOnChain, metadataURI } = req.body;
    const tx = await stageContract.issueAttestation(stageIdOnChain, metadataURI);
    const receipt = await tx.wait();

    let tokenId;
    for (const ev of receipt.events) {
      if (ev.event === "AttestationIssued") {
        tokenId = ev.args[0].toNumber();
        break;
      }
    }
    return res.json({ success: true, tokenId });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};
