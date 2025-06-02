const fs = require("fs");
const path = require("path");
const PDFDocument = require("pdfkit");
const { generateQRCodeBuffer } = require("./qrUtils");

exports.generatePDFWithQR = async (data) => {
  const doc = new PDFDocument({ margin: 50 });
  const identifiant = data.attestationId || `attestation_${Date.now()}`;
  const outputPath = path.join(__dirname, `../attestations/${identifiant}.pdf`);
  const stream = fs.createWriteStream(outputPath);
  doc.pipe(stream);

  // Logo entreprise
  if (data.logoPath && fs.existsSync(data.logoPath)) {
    doc.image(data.logoPath, 50, 40, { width: 80 });
  }

  // En-tête personnalisé
  if (data.headerText) {
    doc.fontSize(16).font("Helvetica-Bold").text(data.headerText, { align: "center" });
    doc.moveDown();
  }

  // Titre principal
  doc.fontSize(18).font("Helvetica-Bold").text("ATTESTATION DE STAGE", {
    align: "center",
    underline: true
  });
  doc.moveDown(2);

  // Corps du texte
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

  doc.font("Helvetica-Bold").text(`Identifiant : ${data.attestationId}`, { align: "left" });
  doc.moveDown(2);

  // QR code centré
if (data.verificationUrl && data.verificationUrl.trim() !== "") {
    const qrBuffer = await generateQRCodeBuffer(data.verificationUrl);
    const qrX = (doc.page.width - 120) / 2;
    const qrY = doc.y;
    doc.image(qrBuffer, qrX, qrY, { width: 120 });
    doc.moveDown(8);

  // Phrase explicative SOUS le QR
  doc.fontSize(10).fillColor("gray").text(
    "Vérifier l'attestation via ce QR code",
    { align: "center" }
  );
  doc.moveDown(0.3);

  doc.text(
    `Publié et horodaté sur la blockchain le : ${new Date().toLocaleDateString()}`,
    { align: "center" }
  );
  doc.moveDown(2);

  // Signature
  doc.fillColor("black").fontSize(11);
  doc.text(`Fait à ${data.lieu || "[Lieu]"}, le ${new Date().toLocaleDateString()}`, { align: "right" });
  doc.text(`${data.responsableNom}`, { align: "right" });
  doc.text("Responsable de l’entreprise", { align: "right" });

  if (data.signature && fs.existsSync(data.signature)) {
    doc.image(data.signature, doc.page.width - 150, doc.y + 10, { width: 100 });
  }

  doc.end();
  return new Promise((resolve) => stream.on("finish", () => resolve(outputPath)));
};
