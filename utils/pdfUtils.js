const fs = require("fs");
const path = require("path");
const PDFDocument = require("pdfkit");
const { generateQRCodeBuffer } = require("./qrUtils");

exports.generatePDFWithQR = async (data) => {
  const doc = new PDFDocument();
  const outputPath = path.join(__dirname, `../attestations/${data.identifiantStage}.pdf`);
  const stream = fs.createWriteStream(outputPath);
  doc.pipe(stream);

  doc.fontSize(18).text("Attestation de Stage", { align: "center" });
  doc.moveDown();
  doc.fontSize(12).text(`Étudiant : ${data.etudiantPrenom} ${data.etudiantNom}`);
  doc.text(`Stage : ${data.identifiantStage}`);
  doc.text(`Appréciation : ${data.appreciation}`);
  doc.text(`Responsable : ${data.responsableNom}`);
  doc.moveDown();

  const qrBuffer = await generateQRCodeBuffer(`https://verifier.dapp/attestation/${data.identifiantStage}`);
  doc.image(qrBuffer, { width: 120, align: "center" });

  doc.end();
  return new Promise((resolve) => stream.on("finish", () => resolve(outputPath)));
};
