const db = require("../config/db");
const { uploadToIPFS } = require("../utils/ipfsUtils");
const { generatePDFWithQR } = require("../utils/pdfUtils");
const { generateVerificationHTML, uploadHTMLToIPFS } = require("../utils/htmlVerificationUtils");
const { hashFile } = require("../utils/hashUtils");
const { publishAttestation } = require("../utils/blockchainUtils");
const notificationService = require("./notificationService");
const { genererIdentifiantAttestation } = require("../utils/identifiantUtils");
const { buildUrl } = require("../utils/urlUtils");
require("dotenv").config();

exports.genererAttestation = async ({ stageId, appreciation, modifs = {}, responsableId }) => {
  const [existingRows] = await db.execute(
    "SELECT fileHash AS hash, ipfsUrl, identifiant FROM Attestation WHERE stageId = ?",
    [stageId]
  );
  if (existingRows.length) return existingRows[0];

  const [stageRows] = await db.execute(`
    SELECT S.identifiant_unique, S.dateDebut, S.dateFin, S.titre, S.etat,
           E.id AS etudiantId, E.prenom AS etudiantPrenom, E.nom AS etudiantNom, E.email AS etudiantEmail,
           EA.prenom AS acaPrenom, EA.nom AS acaNom,
           EP.prenom AS proPrenom, EP.nom AS proNom,
           U.id AS universiteId, ENT.id AS entrepriseId,
           ENT.nom AS nomEntreprise, ENT.logoPath AS logoPath,
           R.identifiantRapport,
           CONCAT(RE.prenom, ' ', RE.nom) AS responsableNom
    FROM Stage S
    JOIN Etudiant E ON S.etudiantId = E.id
    JOIN EncadrantAcademique EA ON S.encadrantAcademiqueId = EA.id
    JOIN EncadrantProfessionnel EP ON S.encadrantProfessionnelId = EP.id
    JOIN Universite U ON E.universiteId = U.id
    JOIN Entreprise ENT ON S.entrepriseId = ENT.id
    JOIN RapportStage R ON R.stageId = S.id
    JOIN ResponsableEntreprise RE ON RE.id = ?
    WHERE S.id = ? AND R.statutAcademique = TRUE AND R.statutProfessionnel = TRUE
  `, [responsableId, stageId]);

  if (!stageRows.length) throw new Error("Rapport non validé par les deux encadrants");

  const stage = stageRows[0];
  const attestationId = await genererIdentifiantAttestation(stage.universiteId, stage.entrepriseId);

  const pdfData = {
    ...stage,
    ...modifs,
    appreciation,
    identifiantStage: stage.identifiant_unique,
    attestationId,
    dateGeneration: new Date().toLocaleDateString(),
    verificationUrl: "PLACEHOLDER",
    responsableNom: modifs.responsableNom || stage.responsableNom,
    lieu: modifs.lieu || stage.nomEntreprise,
    logoPath: modifs.logoPath || stage.logoPath,
    signature: modifs.signature || ""
  };

  console.log("[StageChain] Génération PDF temporaire...");
  const tempPdfPath = await generatePDFWithQR(pdfData);
  const fileHash = await hashFile(tempPdfPath);
  const ipfsUrl = await uploadToIPFS(tempPdfPath);
  console.log("[StageChain] PDF hashé & uploadé sur IPFS:", ipfsUrl);

  console.log("[StageChain] Génération page HTML de vérification...");
  const htmlContent = generateVerificationHTML({
    attestationId,
    fileHash,
    ipfsUrl,
    issuer: responsableId,
    timestamp: Date.now(),
    event: "AttestationPublished"
  });
  const htmlUrl = await uploadHTMLToIPFS(htmlContent);

  console.log("[StageChain] Régénération du PDF avec URL de vérification...");
  pdfData.verificationUrl = htmlUrl;
  const finalPdfPath = await generatePDFWithQR(pdfData);
  const finalHash = await hashFile(finalPdfPath);
  const finalIpfsUrl = await uploadToIPFS(finalPdfPath);

  console.log("[StageChain] Insertion BDD...");
  await db.execute(`
    INSERT INTO Attestation
      (stageId, identifiant, fileHash, ipfsUrl, responsableId, etudiantId, dateCreation, publishedOnChain)
    VALUES (?, ?, ?, ?, ?, ?, NOW(), TRUE)
  `, [stageId, attestationId, finalHash, finalIpfsUrl, responsableId, stage.etudiantId]);

  await db.execute("UPDATE RapportStage SET attestationGeneree = TRUE WHERE stageId = ?", [stageId]);

  console.log("[StageChain] Publication blockchain...");
  await publishAttestation(attestationId, stage.identifiant_unique, stage.identifiantRapport, finalHash);

  console.log("[StageChain] Notifications...");
  const [respUniRows] = await db.execute(
    "SELECT id, email, prenom, nom FROM ResponsableUniversitaire WHERE universiteId = ? LIMIT 1",
    [stage.universiteId]
  );
  const respUni = respUniRows[0];

  await notificationService.notifyUser({
    toId: stage.etudiantId,
    toRole: "Etudiant",
    subject: "Votre attestation est disponible",
    templateName: "attestation_published_etudiant",
    templateData: {
      etudiantPrenom: stage.etudiantPrenom,
      etudiantNom: stage.etudiantNom,
      titreStage: stage.titre,
      nomEntreprise: stage.nomEntreprise,
      dateDebut: stage.dateDebut,
      dateFin: stage.dateFin,
      encadrantAcaPrenom: stage.acaPrenom,
      encadrantAcaNom: stage.acaNom,
      encadrantProPrenom: stage.proPrenom,
      encadrantProNom: stage.proNom,
      identifiantAttestation: attestationId,
      hash: finalHash,
      attestationUrl: htmlUrl,
      year: new Date().getFullYear()
    },
    message: "Votre attestation de stage est prête."
  });

  if (respUni?.id) {
    await notificationService.notifyUser({
      toId: respUni.id,
      toRole: "ResponsableUniversitaire",
      subject: `Attestation générée pour ${stage.etudiantPrenom} ${stage.etudiantNom}`,
      templateName: "attestation_published_responsable_universitaire",
      templateData: {
        etudiantPrenom: stage.etudiantPrenom,
        etudiantNom: stage.etudiantNom,
        titreStage: stage.titre,
        identifiantAttestation: attestationId,
        dashboardUrl: buildUrl("/login")
      },
      message: `Une attestation est prête à être consultée et validée.`
    });
  }

  return {
    hash: finalHash,
    ipfsUrl: finalIpfsUrl,
    identifiant: attestationId,
    verificationPage: htmlUrl
  };
};
