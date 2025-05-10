// pdfUtils.js ( totalement ajustable pour les responsables entreprises)
const fs = require("fs");
const path = require("path");
const PDFDocument = require("pdfkit");
const { generateQRCodeBuffer } = require("./qrUtils");

exports.generatePDFWithQR = async (data) => {
  const doc = new PDFDocument({ margin: 50 });
const identifiant = data.identifiantStage || `attestation_${Date.now()}`;
const outputPath = path.join(__dirname, `../attestations/${identifiant}.pdf`);

  const stream = fs.createWriteStream(outputPath);
  doc.pipe(stream);

  // En-tête librement ajusté par le responsable (nom de l'entreprise, adresse, etc.)
  if (data.headerText) {
    doc.fontSize(10).text(data.headerText, { align: "right" });
    doc.moveDown();
  }
  if (data.logoPath && fs.existsSync(data.logoPath)) {
    doc.image(data.logoPath, 50, 45, { width: 80 });
  }

  doc.moveDown(5);

  // Titre principal
  doc.fontSize(16).font("Helvetica-Bold").text("ATTESTATION DE STAGE", { align: "center" });
  doc.moveDown(2);

  // Corps du texte principal
  doc.fontSize(12).font("Helvetica").text(
    `Je soussigné ${data.responsableNom || "[Responsable]"}, certifie que :`
  );
  doc.moveDown();

  doc.text(
    `${data.etudiantPrenom || "[Prénom]"} ${data.etudiantNom || "[Nom]"} a effectué un stage au sein de notre structure ` +
      `du ${new Date(data.dateDebut).toLocaleDateString()} au ${new Date(data.dateFin).toLocaleDateString()}, ` +
      `encadré par ${data.acaPrenom || "[Encadrant Aca]"} ${data.acaNom || ""} et ${data.proPrenom || "[Encadrant Pro]"} ${data.proNom || ""}.`
  );
  doc.moveDown();

  if (data.appreciation) {
    doc.text(`Appréciation : ${data.appreciation}`);
    doc.moveDown();
  }

  if (data.bodyText) {
    doc.text(data.bodyText);
    doc.moveDown();
  } else {
    doc.text("La présente attestation est délivrée pour servir et valoir ce que de droit.");
    doc.moveDown(2);
  }

  // QR code blockchain : lien de vérification public
const qrBuffer = await generateQRCodeBuffer(`https://verifier.dapp/attestation/${data.attestationId}`);
  doc.image(qrBuffer, doc.page.width / 2 - 60, doc.y, { width: 120 });
  doc.moveDown(4);

  // Signature librement personnalisée
  doc.text(`Fait à ${data.lieu || "[Lieu]"}, le ${new Date().toLocaleDateString()}`, { align: "right" });
  doc.moveDown(2);
  doc.text(`${data.responsableNom || "[Responsable]"}`, { align: "right" });
  doc.text("Responsable de l’entreprise", { align: "right" });

  if (data.signature && fs.existsSync(data.signature)) {
  doc.image(data.signature, doc.page.width - 180, doc.y, { width: 120 });
  doc.moveDown(2);
}


  doc.end();

  return new Promise((resolve) => stream.on("finish", () => resolve(outputPath)));
};
