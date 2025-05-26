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

  // Titre principal
  doc.fontSize(18).font("Helvetica-Bold").text("ATTESTATION DE STAGE", { align: "center" });
  doc.moveDown(2);

  // Corps du texte principal
  doc.fontSize(12).font("Helvetica").text(`Je soussigné ${data.responsableNom}, certifie que :`);
  doc.moveDown();
  doc.text(`${data.etudiantPrenom} ${data.etudiantNom} a effectué un stage du ${new Date(data.dateDebut).toLocaleDateString()} au ${new Date(data.dateFin).toLocaleDateString()}.`);
  doc.moveDown();

  if (data.appreciation) {
    doc.text(`Appréciation : ${data.appreciation}`);
    doc.moveDown();
  }

  doc.text("La présente attestation est délivrée pour servir et valoir ce que de droit.");
  doc.moveDown();

  // Identifiant à gauche
  doc.moveDown();
  doc.font("Helvetica-Bold").text(`Identifiant : ${data.attestationId}`, { align: "left" });
  doc.moveDown(2);

  // QR Code au centre
  const qrBuffer = await generateQRCodeBuffer(data.verificationUrl);
  doc.image(qrBuffer, doc.page.width / 2 - 60, doc.y, { width: 120 });
  doc.moveDown(1);

  // Phrase explicative sous le QR
  doc.fontSize(10).fillColor("gray").text("Ce QR code vous permet de vérifier l’authenticité de cette attestation via la blockchain.", { align: "center" });
  doc.moveDown(2);

  // Timestamp Blockchain
  doc.fontSize(10).fillColor("gray").text("Publié et horodaté sur la blockchain le : " + new Date().toLocaleDateString(), { align: "center" });
  doc.moveDown(2);

  // Signature finale
  doc.fillColor("black").font("Helvetica").text(`Fait à ${data.lieu || "[Lieu]"}, le ${new Date().toLocaleDateString()}`, { align: "right" });
  doc.text(`${data.responsableNom}`, { align: "right" });
  doc.text("Responsable de l’entreprise", { align: "right" });

  if (data.signature && fs.existsSync(data.signature)) {
    doc.image(data.signature, doc.page.width - 180, doc.y, { width: 120 });
  }

  doc.end();
  return new Promise((resolve) => stream.on("finish", () => resolve(outputPath)));
};
