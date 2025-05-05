const { ethers } = require("ethers");
const AttestationAbi = require("../abis/AttestationContract.json");
const db = require("../config/db");
const notificationService = require("./notificationService");
const sendEmail = require("../utils/sendEmail");

require("dotenv").config();

const provider = new ethers.providers.JsonRpcProvider("http://127.0.0.1:8545");
const signer = new ethers.Wallet(process.env.PRIVATE_KEY, provider);
const attestationContract = new ethers.Contract(process.env.ATTESTATION_CONTRACT_ADDRESS, AttestationAbi.abi, signer);

exports.uploadAndSignAttestation = async ({ fichier, etudiantId, identifiantStage, responsableEntrepriseEmail }) => {
  try {
    const fichierHash = fichier.filename; // suppose fichier renommé selon hash (IPFS or local hash)
    
    const [[etudiant]] = await db.execute("SELECT identifiant_unique, email FROM Etudiant WHERE id = ?", [etudiantId]);
    const attestationId = identifiantStage + "_ATTESTATION";

    const tx = await attestationContract.publierAttestation(attestationId, fichierHash, etudiant.identifiant_unique);
    await tx.wait();

    await db.execute(
      `INSERT INTO Attestation (identifiant, etudiantId, fichierHash, publishedOnChain, dateCreation)
       VALUES (?, ?, ?, TRUE, NOW())`,
      [attestationId, etudiantId, fichierHash]
    );

    //  Notifications
    await notificationService.creerNotification({
      destinataireEmail: etudiant.email,
      titre: "Attestation disponible",
      message: "Votre attestation est désormais disponible et signée sur la blockchain.",
      lien: `/etudiant/attestation/${attestationId}`
    });

    await sendEmail({
      to: etudiant.email,
      subject: "Attestation signée disponible",
      html: `<p>Bonjour, votre attestation est signée et disponible : <a href="http://localhost:3001/etudiant/attestation/${attestationId}">Consulter l'attestation</a></p>`
    });

    return { success: true, message: "Attestation signée et publiée sur la blockchain." };
  } catch (error) {
    console.error("Erreur uploadAndSignAttestation:", error);
    throw error;
  }
};
