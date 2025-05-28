const db = require("../config/db");
const { uploadToIPFS } = require("../utils/ipfsUtils");
const { generatePDFWithQR } = require("../utils/pdfUtils");
const { hashFile } = require("../utils/hashUtils");
const { publishAttestation } = require("../utils/blockchainUtils");
const notificationService = require("./notificationService");
const { genererIdentifiantAttestation } = require("../utils/identifiantUtils");
require("dotenv").config();
const { buildUrl } = require("../utils/urlUtils");


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
           ENT.nom AS nomEntreprise,
           R.identifiantRapport
    FROM Stage S
    JOIN Etudiant E ON S.etudiantId = E.id
    JOIN EncadrantAcademique EA ON S.encadrantAcademiqueId = EA.id
    JOIN EncadrantProfessionnel EP ON S.encadrantProfessionnelId = EP.id
    JOIN Universite U ON E.universiteId = U.id
    JOIN Entreprise ENT ON S.entrepriseId = ENT.id
    JOIN RapportStage R ON R.stageId = S.id
    WHERE S.id = ? AND R.statutAcademique = TRUE AND R.statutProfessionnel = TRUE
  `, [stageId]);

  if (!stageRows.length) throw new Error("Rapport non validé par les deux encadrants");
  const stage = stageRows[0];
  const attestationId = await genererIdentifiantAttestation(stage.universiteId, stage.entrepriseId);
  //lien de verification de attestation
  const verificationUrl = ipfsUrl.replace("ipfs://", "https://ipfs.io/ipfs/");



  const pdfData = {
    ...stage,
    ...modifs,
    appreciation,
    identifiantStage: stage.identifiant_unique,
    attestationId,
    dateGeneration: new Date().toLocaleDateString(),
    verificationUrl,
    responsableNom: modifs.responsableNom || "Responsable Entreprise"
  };

  const pdfPath = await generatePDFWithQR(pdfData);
  //
  const fileHash = await hashFile(pdfPath);

const ipfsUrl = await uploadToIPFS(pdfPath); //  ipfs://Qm...

  await db.execute(`
    INSERT INTO Attestation
      (stageId, identifiant, fileHash, ipfsUrl, responsableId, etudiantId, dateCreation, publishedOnChain)
    VALUES (?, ?, ?, ?, ?, ?, NOW(), TRUE)
  `, [stageId, attestationId, fileHash, ipfsUrl, responsableId, stage.etudiantId]);

  await db.execute("UPDATE RapportStage SET attestationGeneree = TRUE WHERE stageId = ?", [stageId]);

  await publishAttestation(attestationId, stage.identifiant_unique, stage.identifiantRapport, fileHash);

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
      hash: fileHash,
      attestationUrl: verificationUrl,
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
    hash: fileHash,
    ipfsUrl,
    identifiant: attestationId
  };
};

exports.validerParUniversite = async (stageId, responsableId) => {
  const [[stage]] = await db.execute("SELECT * FROM Stage WHERE id = ?", [stageId]);
  if (!stage) throw new Error("Stage introuvable");
  if (stage.etat === "validé") return;

  //  Mettre à jour état et historique
  await db.execute("UPDATE Stage SET etat = 'validé', estHistorique = TRUE WHERE id = ?", [stageId]);

  const [[etudiant]] = await db.execute(
    "SELECT id, prenom, nom FROM Etudiant WHERE id = ?",
    [stage.etudiantId]
  );

  await notificationService.notifyUser({
    toId: etudiant.id,
    toRole: "Etudiant",
    subject: "Stage validé par l’université",
    templateName: "stage_validated_universite",
    templateData: {
      etudiantPrenom: etudiant.prenom,
      etudiantNom: etudiant.nom,
      titreStage: stage.titre,
      dateValidation: new Date().toLocaleDateString("fr-FR"),
      dashboardUrl: buildUrl("/login")
    },
    message: "Votre stage a été validé par le responsable universitaire."
  });
};

exports.getAttestationsByUniversite = async (responsableId) => {
  const [[resp]] = await db.execute(
    "SELECT universiteId FROM ResponsableUniversitaire WHERE id = ?",
    [responsableId]
  );

  const [rows] = await db.execute(`
    SELECT A.id, A.identifiant, A.stageId, A.dateCreation, A.ipfsUrl,
           S.identifiant_unique, S.etat,
           E.prenom AS etudiantPrenom, E.nom AS etudiantNom
    FROM Attestation A
    JOIN Stage S ON A.stageId = S.id
    JOIN Etudiant E ON A.etudiantId = E.id
    WHERE S.id IN (
      SELECT id FROM Stage WHERE etudiantId IN (
        SELECT id FROM Etudiant WHERE universiteId = ?
      )
    )
    ORDER BY A.dateCreation DESC
  `, [resp.universiteId]);

  return rows;
};
