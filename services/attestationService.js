const db = require("../config/db");
const { uploadToIPFS } = require("../utils/ipfsUtils");
const { generatePDFWithQR } = require("../utils/pdfUtils");
const { hashFile } = require("../utils/hashUtils");
const { publishAttestation } = require("../utils/blockchainUtils");
const notificationService = require("./notificationService");
const { genererIdentifiantAttestation } = require("../utils/identifiantUtils");

exports.genererAttestation = async ({ stageId, appreciation, modifs = {}, responsableId }) => {
  const [[existing]] = await db.execute(
    "SELECT fileHash, ipfsUrl, identifiant FROM Attestation WHERE stageId = ?",
    [stageId]
  );

  if (existing) {
    return {
      hash: existing.fileHash,
      ipfsUrl: existing.ipfsUrl,
      identifiant: existing.identifiant
    };
  }

  const [[stage]] = await db.execute(`
    SELECT S.*, 
      E.id AS etudiantId, E.prenom AS etudiantPrenom, E.nom AS etudiantNom,
      EA.prenom AS acaPrenom, EA.nom AS acaNom,
      EP.prenom AS proPrenom, EP.nom AS proNom,
      ENT.nom AS entreprise,
      U.nom AS universite,
      R.identifiantRapport, R.statutAcademique, R.statutProfessionnel
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
  if (!stage.statutAcademique || !stage.statutProfessionnel) {
    throw new Error("Le rapport n'est pas encore validé par les deux encadrants");
  }

  const attestationId = await genererIdentifiantAttestation(stage.etudiantId);

  const data = {
    ...stage,
    ...modifs,
    appreciation,
    identifiantStage: stage.identifiant_unique,
    attestationId,
    responsableNom: modifs.responsableNom || "Responsable Entreprise",
    dateGeneration: new Date().toLocaleDateString(),
  };

  const pdfPath = await generatePDFWithQR(data);
  const fileHash = hashFile(pdfPath);
  const ipfsUrl = await uploadToIPFS(pdfPath);

  await db.execute(`
    INSERT INTO Attestation (stageId, identifiant, fileHash, ipfsUrl, responsableId)
    VALUES (?, ?, ?, ?, ?)
  `, [stageId, attestationId, fileHash, ipfsUrl, responsableId]);

  await publishAttestation(attestationId, stage.identifiant_unique, stage.identifiantRapport, fileHash);

  const [[respUni]] = await db.execute(
    "SELECT id FROM ResponsableUniversitaire WHERE universiteId = (SELECT universiteId FROM Etudiant WHERE id = ?) LIMIT 1",
    [stage.etudiantId]
  );

  const targets = [
    { id: stage.etudiantId, role: "Etudiant" },
    { id: respUni?.id, role: "ResponsableUniversitaire" },
    { id: responsableId, role: "ResponsableEntreprise" }
  ];

  for (const target of targets) {
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

  return { hash: fileHash, ipfsUrl, identifiant: attestationId };
};
