const db = require("../config/db");
const { uploadToIPFS } = require("../utils/ipfsUtils");
const { generatePDFWithQR } = require("../utils/pdfUtils");
const { generateVerificationHTML, uploadHTMLToIPFS } = require("../utils/htmlVerificationUtils");
const { hashFile } = require("../utils/hashUtils");
const { publishAttestation } = require("../utils/blockchainUtils");
const notificationService = require("./notificationService");
const { genererIdentifiantAttestation } = require("../utils/identifiantUtils");
const { buildUrl } = require("../utils/urlUtils");
const historiqueService = require("./historiqueService");

require("dotenv").config();

exports.genererAttestation = async ({ stageId, appreciation, modifs = {}, responsableId, forcer = false }) => {
  console.log(`[StageChain] Démarrage génération attestation pour stageId=${stageId}, responsableId=${responsableId}`);

  const [existingRows] = await db.execute(
    "SELECT fileHash AS hash, ipfsUrl, identifiant FROM Attestation WHERE stageId = ?",
    [stageId]
  );

  if (existingRows.length && !forcer) {
    console.log(`[StageChain] Attestation déjà existante pour stageId=${stageId}`);
    return existingRows[0];
  }

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
    WHERE S.id = ?
    AND (
      (R.statutAcademique = TRUE AND R.statutProfessionnel = TRUE)
      OR (R.statutAcademique = TRUE AND R.tierIntervenantProfessionnelId IS NOT NULL)
      OR (R.statutProfessionnel = TRUE AND R.tierIntervenantAcademiqueId IS NOT NULL)
    )
  `, [responsableId, stageId]);

  if (!stageRows.length) throw new Error("Rapport non validé par les deux encadrants");

  const stage = stageRows[0];
  const attestationId = await genererIdentifiantAttestation(stage.universiteId, stage.entrepriseId);

  const baseData = {
    ...stage,
    ...modifs,
    appreciation,
    identifiantStage: stage.identifiant_unique,
    attestationId,
    dateGeneration: new Date().toLocaleDateString(),
    verificationUrl: "", // rempli plus tard
    responsableNom: modifs.responsableNom || stage.responsableNom,
    lieu: modifs.lieu || stage.nomEntreprise,
    logoPath: modifs.logoPath || stage.logoPath,
    signature: modifs.signature || ""
  };

  // 1. PDF temporaire (QR vide), uploadé pour 1er hash
  const tempPdfPath = await generatePDFWithQR({ ...baseData, verificationUrl: "QR_PLACEHOLDER" });
  const tempHash = await hashFile(tempPdfPath);
  const tempPdfIpfs = await uploadToIPFS(tempPdfPath);

  // 2. Page HTML initiale pour inclure le hash et lien temporaire PDF
  const tempHtml = generateVerificationHTML({
    attestationId,
    fileHash: tempHash,
    ipfsUrl: tempPdfIpfs.publicUrl,
    issuer: responsableId,
    timestamp: Date.now(),
    event: "AttestationPublished"
  });
  const tempHtmlUpload = await uploadHTMLToIPFS(tempHtml);

  // 3. PDF final avec QR vers page HTML temporaire
  baseData.verificationUrl = tempHtmlUpload.publicUrl;
  const finalPdfPath = await generatePDFWithQR(baseData);
  const finalHash = await hashFile(finalPdfPath);
  const finalPdfIpfs = await uploadToIPFS(finalPdfPath);

  // 4. Génération de la VRAIE page HTML avec lien vers PDF final
  const finalHtml = generateVerificationHTML({
    attestationId,
    fileHash: finalHash,
    ipfsUrl: finalPdfIpfs.publicUrl,
    issuer: responsableId,
    timestamp: Date.now(),
    event: "AttestationPublished"
  });
  const finalHtmlUpload = await uploadHTMLToIPFS(finalHtml);

  // 5. PDF définitif avec QR vers page HTML FINALE
  baseData.verificationUrl = finalHtmlUpload.publicUrl;
  const pdfDefinitifPath = await generatePDFWithQR(baseData);
  const pdfDefinitifHash = await hashFile(pdfDefinitifPath);
  const pdfDefinitifIpfs = await uploadToIPFS(pdfDefinitifPath);

  // 6. Enregistrement final
  await db.execute(`
    INSERT INTO Attestation
      (stageId, identifiant, fileHash, ipfsUrl, responsableId, etudiantId, dateCreation, publishedOnChain)
    VALUES (?, ?, ?, ?, ?, ?, NOW(), TRUE)
  `, [stageId, attestationId, pdfDefinitifHash, pdfDefinitifIpfs.publicUrl, responsableId, stage.etudiantId]);

  await db.execute("UPDATE RapportStage SET attestationGeneree = TRUE WHERE stageId = ?", [stageId]);

  const [[rapportRow]] = await db.execute("SELECT id FROM RapportStage WHERE stageId = ?", [stageId]);
  if (rapportRow?.id) {
    await historiqueService.logAction({
      rapportId: rapportRow.id,
      utilisateurId: responsableId,
      role: "ResponsableEntreprise",
      action: "Attestation générée",
      commentaire: `Attestation générée et publiée sur la blockchain pour ${stage.etudiantPrenom} ${stage.etudiantNom}.`,
      origine: "automatique"
    });
  }

  // 7. Blockchain
  try{
  await publishAttestation(attestationId, stage.identifiant_unique, stage.identifiantRapport, pdfDefinitifHash);
  console.log("[StageChain] Publication sur blockchain réussie.");
  }catch (err) {
  console.error("[StageChain] ERREUR blockchain publication :", err.message || err);
  // 8. Notification Étudiant
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
      hash:pdfDefinitifHash,
      attestationUrl: finalHtmlUpload.publicUrl,
      year: new Date().getFullYear()
    },
    message: "Votre attestation de stage est prête."
  });

  // 9. Notification Responsable Universitaire
  const [respUniRows] = await db.execute(
    "SELECT id FROM ResponsableUniversitaire WHERE universiteId = ? LIMIT 1",
    [stage.universiteId]
  );

  const respUni = respUniRows[0];
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
  
  console.log("[StageChain] Attestation générée avec succès.");
  }
  return {
    hash: pdfDefinitifHash,
    ipfsUrl: pdfDefinitifIpfs.publicUrl,
    identifiant: attestationId,
    verificationPage: finalHtmlUpload.publicUrl
  };
};




exports.getAttestationsByUniversite = async (responsableUniId) => {
  const [[responsable]] = await db.execute(`
    SELECT universiteId FROM ResponsableUniversitaire WHERE id = ?
  `, [responsableUniId]);

  if (!responsable) {
    throw new Error("Responsable universitaire introuvable");
  }

  const universiteId = responsable.universiteId;

  const [attestations] = await db.execute(`
    SELECT A.identifiant, A.fileHash AS hash, A.ipfsUrl, A.dateCreation,
       S.id AS stageId, S.identifiant_unique AS identifiantStage,
       S.titre,
       E.prenom AS etudiantPrenom, E.nom AS etudiantNom,
       S.etat

    FROM Attestation A
    JOIN Stage S ON A.stageId = S.id
    JOIN Etudiant E ON A.etudiantId = E.id
    WHERE E.universiteId = ?
    ORDER BY A.dateCreation DESC
  `, [universiteId]);

  return attestations;
};

exports.validerParUniversite = async (stageId, responsableId) => {
  const [rows] = await db.execute("SELECT * FROM Stage WHERE id = ?", [stageId]);
  if (!rows.length) throw new Error("Stage introuvable");

await db.execute("UPDATE Stage SET etat = 'validé', estHistorique = TRUE WHERE id = ?", [stageId]);

  const [etudiantRow] = await db.execute(`
    SELECT E.id, E.prenom, E.nom FROM Etudiant E
    JOIN Stage S ON S.etudiantId = E.id
    WHERE S.id = ?
  `, [stageId]);

  const [[rapportRow]] = await db.execute("SELECT id FROM RapportStage WHERE stageId = ?", [stageId]);

  if (rapportRow?.id) {
    await historiqueService.logAction({
      rapportId: rapportRow.id,
      utilisateurId: responsableId,
      role: "ResponsableUniversitaire",
      action: "Validation finale du stage",
      commentaire: "Le stage a été validé par l'université.",
      origine: "manuelle"
    });
  }

  const etudiant = etudiantRow[0];
  if (etudiant) {
    await notificationService.notifyUser({
      toId: etudiant.id,
      toRole: "Etudiant",
      subject: "Stage validé par l'université",
      templateName: "stage_validated_universite",
      templateData: {
        etudiantPrenom: etudiant.prenom,
        etudiantNom: etudiant.nom,
        stageId,
        titreStage:stage.titre,
        year: new Date().getFullYear()
      },
      message: `Votre stage a été validé par votre université.`
    });
  }

  return { success: true };
};


exports.downloadAttestation = async (req, res) => {
  try {
    const etudiantId = req.user.id;
    const [[attestation]] = await db.execute(
      "SELECT ipfsUrl FROM Attestation WHERE etudiantId = ? ORDER BY dateCreation DESC LIMIT 1",
      [etudiantId]
    );
    if (!attestation) return res.status(404).json({ error: "Aucune attestation trouvée" });

    return res.redirect(attestation.ipfsUrl);
  } catch (err) {
    console.error("Erreur téléchargement attestation:", err);
    res.status(500).json({ error: "Erreur serveur lors du téléchargement" });
  }
};

