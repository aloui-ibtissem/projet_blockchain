const db = require("../config/db");
const { uploadToIPFS } = require("../utils/ipfsUtils");
const { generatePDFWithQR } = require("../utils/pdfUtils");
const { hashFile } = require("../utils/hashUtils");
const { publishAttestation } = require("../utils/blockchainUtils");
const notificationService = require("./notificationService");
const path = require("path");

exports.genererAttestation = async ({ stageId, appreciation, modifs = {}, responsableId }) => {
  const [[stage]] = await db.execute(`
    SELECT S.*, 
      E.id AS etudiantId, E.prenom AS etudiantPrenom, E.nom AS etudiantNom,
      EA.prenom AS acaPrenom, EA.nom AS acaNom,
      EP.prenom AS proPrenom, EP.nom AS proNom,
      ENT.nom AS entreprise,
      U.nom AS universite,
      R.identifiantRapport
    FROM Stage S
    JOIN Etudiant E ON S.etudiantId = E.id
    JOIN EncadrantAcademique EA ON S.encadrantAcademiqueId = EA.id
    JOIN EncadrantProfessionnel EP ON S.encadrantProfessionnelId = EP.id
    JOIN Entreprise ENT ON S.entrepriseId = ENT.id
    JOIN Universite U ON E.universiteId = U.id
    JOIN RapportStage R ON R.stageId = S.id
    WHERE S.id = ?
  `, [stageId]);

  if (!stage) throw new Error("Stage introuvable");

  const data = {
    ...stage,
    ...modifs,
    appreciation,
    responsableNom: modifs.responsableNom || "Responsable Entreprise",
    dateGeneration: new Date().toLocaleDateString(),
  };

  // Génération du PDF avec QR
  const pdfPath = await generatePDFWithQR(data);

  // Hash du fichier
  const fileHash = hashFile(pdfPath);

  // Upload sur IPFS
  const ipfsUrl = await uploadToIPFS(pdfPath);

  // Sauvegarde en base
  await db.execute(`
    INSERT INTO Attestation (stageId, fileHash, ipfsUrl, responsableId)
    VALUES (?, ?, ?, ?)
  `, [stageId, fileHash, ipfsUrl, responsableId]);

  // Publication sur la blockchain
  await publishAttestation(stage.identifiant_unique, stage.identifiantRapport, fileHash);

  // Notifications à l'étudiant et au responsable université
  const [[respUni]] = await db.execute(`
    SELECT id FROM Utilisateur
    WHERE role = 'ResponsableUniversite' AND universiteId = (
      SELECT universiteId FROM Etudiant WHERE id = ?
    ) LIMIT 1
  `, [stage.etudiantId]);

  for (const target of [
    { id: stage.etudiantId, role: "Etudiant" },
    { id: respUni?.id, role: "ResponsableUniversite" }
  ]) {
    if (!target?.id) continue;
    await notificationService.notifyUser({
      toId: target.id,
      toRole: target.role,
      subject: "Attestation disponible",
      templateName: "attestation_published",
      templateData: {
        etudiantNom: stage.etudiantNom,
        identifiantStage: stage.identifiant_unique,
        hash: fileHash,
        lienIPFS: ipfsUrl
      },
      message: "Une attestation a été publiée et peut être vérifiée en ligne."
    });
  }

  return { hash: fileHash, ipfsUrl };
};
