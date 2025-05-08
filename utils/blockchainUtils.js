const { ethers } = require("ethers");
require("dotenv").config();

//  Chargement propre de l’ABI (basé sur ce que tu as fourni)
const CONTRACT_ABI = require("./abis/AttestationContract.json");

//  Adresse du contrat (Metamask local / Hardhat)
const CONTRACT_ADDRESS = process.env.ATTESTATION_CONTRACT_ADDRESS || "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512";

// Provider local Hardhat (gratuit et rapide)
const provider = new ethers.providers.JsonRpcProvider(process.env.BLOCKCHAIN_RPC_URL || "http://127.0.0.1:8545");

//  Signer = Responsable entreprise (clé privée locale)
const signer = new ethers.Wallet(process.env.PRIVATE_KEY, provider);

//  Contrat instancié
const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);

/**
 * Publier une attestation sur la blockchain
 * @param {string} stageId - identifiant unique du stage
 * @param {string} rapportId - identifiant unique du rapport
 * @param {string} fileHash - hash SHA256 du PDF
 */
exports.publishAttestation = async (stageId, rapportId, fileHash) => {
  if (!stageId || !rapportId || !fileHash) {
    throw new Error("Tous les paramètres sont requis pour publier une attestation");
  }

  const tx = await contract.publishAttestation(stageId, rapportId, fileHash);
  await tx.wait(); //  Attente de minage
  console.log(` Attestation publiée : ${stageId}`);
};

/**
 * Vérifie si une attestation a été publiée (par stageId)
 * @param {string} stageId
 * @returns {Promise<boolean>}
 */
exports.checkIfExists = async (stageId) => {
  return await contract.exists(stageId);
};

/**
 * Récupère les détails d’une attestation
 * @param {string} stageId
 * @returns {Promise<{ fileHash: string, reportIdentifier: string, issuer: string, timestamp: number }>}
 */
exports.getAttestation = async (stageId) => {
  const [fileHash, reportIdentifier, issuer, timestamp] = await contract.getAttestation(stageId);
  return { fileHash, reportIdentifier, issuer, timestamp };
};
//
exports.publishReportValidated = async (rapportId, encadrantId) => {
  const tx = await contract.validateReport(rapportId);
  await tx.wait();
  console.log(` Rapport validé par encadrant ${encadrantId}`);
};
//
exports.publishTimeoutValidated = async (rapportId, tierId) => {
  const tx = await contract.timeoutValidate(rapportId);
  await tx.wait();
  console.log(` Rapport validé par tier ${tierId} après délai`);
};
//
exports.publishDoubleValidation = async (rapportId) => {
  // Réutilise la même logique que validateReport pour loguer sur la blockchain
  const tx = await contract.validateReport(rapportId); // événement déjà prévu dans le contrat
  await tx.wait();
  console.log(` Rapport ${rapportId} validé (double validation)`);
};


