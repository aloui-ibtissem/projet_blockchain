const { ethers } = require("ethers");
require("dotenv").config();

const CONTRACT_ABI = require("./abis/AttestationContract.json");
const CONTRACT_ADDRESS = process.env.ATTESTATION_CONTRACT_ADDRESS;
const provider = new ethers.providers.JsonRpcProvider(process.env.BLOCKCHAIN_RPC_URL);
const signer = new ethers.Wallet(process.env.PRIVATE_KEY, provider);
const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);

// Validation individuelle par encadrant
exports.validateAsEncadrant = async (rapportId, role) => {
  if (!["ACA", "PRO"].includes(role)) {
    throw new Error("Role invalide (ACA ou PRO attendu)");
  }
  const tx = await contract.validateAsEncadrant(rapportId, role);
  await tx.wait();
  console.log(`Validation encadrant ${role} enregistree pour ${rapportId}`);
};

// Validation de secours par un tier débloqueur
exports.validateAsTier = async (rapportId, entite) => {
  if (!["universite", "entreprise"].includes(entite)) {
    throw new Error("Entite invalide");
  }
  const tx = await contract.validateAsTier(rapportId, entite);
  await tx.wait();
  console.log(`Validation tier ${entite} enregistree pour ${rapportId}`);
};

// Validation finale quand les deux validations sont faites
exports.confirmDoubleValidation = async (rapportId) => {
  const tx = await contract.confirmDoubleValidation(rapportId);
  await tx.wait();
  console.log(`Double validation confirmee pour ${rapportId}`);
};

// Publication de l'attestation sur la blockchain
exports.publishAttestation = async (attestationId, stageId, reportId, fileHash) => {
  const tx = await contract.publishAttestation(attestationId, stageId, reportId, fileHash);
  await tx.wait();
  console.log(`Attestation publiee on-chain : ${attestationId}`);
};
