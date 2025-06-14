//blockchianutils.js
const { ethers } = require("ethers");
require("dotenv").config();

const CONTRACT_ABI = require("./abis/AttestationContract.json");
const CONTRACT_ADDRESS = process.env.ATTESTATION_CONTRACT_ADDRESS;
const provider = new ethers.providers.JsonRpcProvider(process.env.BLOCKCHAIN_RPC_URL);
const signer = new ethers.Wallet(process.env.PRIVATE_KEY, provider);
const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);

// Validation individuelle par encadrant
exports.validateAsEncadrant = async (rapportId, role) => {
  try {
    if (!["ACA", "PRO"].includes(role)) {
      throw new Error("Role invalide (ACA ou PRO attendu)");
    }
    const tx = await contract.validateAsEncadrant(rapportId, role);
    await tx.wait();
    console.log(`[Blockchain] Validation encadrant (${role}) pour rapport ${rapportId}`);
  } catch (err) {
    console.error(`[Blockchain]  Erreur validation encadrant (${role}) :`, err.message);
    throw err;
  }
};

// Validation de secours par un tier débloqueur
exports.validateAsTier = async (rapportId, entite) => {
  try {
    if (!["universite", "entreprise"].includes(entite)) {
      throw new Error("Entite invalide (universite ou entreprise attendu)");
    }
    const tx = await contract.validateAsTier(rapportId, entite);
    await tx.wait();
    console.log(`[Blockchain]  Validation tier (${entite}) pour rapport ${rapportId}`);
  } catch (err) {
    console.error(`[Blockchain]  Erreur validation tier (${entite}) :`, err.message);
    throw err;
  }
};

// Confirmation de double validation
exports.confirmDoubleValidation = async (rapportId) => {
  try {
    const tx = await contract.confirmDoubleValidation(rapportId);
    await tx.wait();
    console.log(`[Blockchain]  Double validation confirmée pour ${rapportId}`);
  } catch (err) {
    console.error(`[Blockchain]  Erreur confirmation double validation :`, err.message);
    throw err;
  }
};

// Publication de l'attestation sur la blockchain
exports.publishAttestation = async (attestationId, stageId, reportId, fileHash) => {
  try {
    const tx = await contract.publishAttestation(attestationId, stageId, reportId, fileHash);
    await tx.wait();
    console.log(`[Blockchain] Attestation publiée : ${attestationId}`);
  } catch (err) {
    console.error(`[Blockchain]  Erreur publication attestation :`, err.message);
    throw err;
  }
};
