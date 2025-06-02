const os = require("os");
const path = require("path");
const fs = require("fs");
const { uploadToIPFS } = require("./ipfsUtils");

function generateVerificationHTML({ attestationId, fileHash, ipfsUrl, issuer, timestamp, event }) {
  const date = new Date(timestamp).toLocaleString("fr-FR");

  return `<!DOCTYPE html>
<html lang=\"fr\">
<head>
  <meta charset=\"UTF-8\">
  <title>Vérification de l'attestation - ${attestationId}</title>
  <style>
    body { font-family: Arial; max-width: 800px; margin: auto; padding: 40px; background: #fff; color: #222; line-height: 1.6; }
    h1 { color: #003366; font-size: 24px; border-bottom: 1px solid #ccc; padding-bottom: 10px; }
    .section { margin-top: 30px; }
    .label { font-weight: bold; }
    code { background: #f2f2f2; padding: 4px 6px; border-radius: 4px; font-size: 14px; display: inline-block; }
    a { color: #0056b3; text-decoration: none; }
    a:hover { text-decoration: underline; }
    footer { margin-top: 50px; font-size: 12px; color: #666; border-top: 1px solid #ccc; padding-top: 15px; }
  </style>
</head>
<body>
  <h1>Vérification d'une attestation de stage</h1>
  <div class=\"section\"><p class=\"label\">Identifiant :</p><code>${attestationId}</code></div>
  <div class=\"section\"><p class=\"label\">Fichier PDF :</p><a href=\"${ipfsUrl}\" target=\"_blank\">${ipfsUrl}</a></div>
  <div class=\"section\"><p class=\"label\">SHA-256 :</p><code>${fileHash}</code></div>
  <div class=\"section\"><p class=\"label\">Emetteur :</p><code>${issuer}</code></div>
  <div class=\"section\"><p class=\"label\">Date publication :</p><code>${date}</code></div>
  <div class=\"section\"><p class=\"label\">Evénement :</p><code>${event}</code></div>
  <div class=\"section\"><p class=\"label\">Instructions :</p><p>Téléchargez le PDF ci-dessus, puis vérifiez son intégrité avec un outil SHA-256 comme <a href='https://emn178.github.io/online-tools/sha256.html' target='_blank'>ceci</a>.</p></div>
  <footer>
    Page auto-générée par StageChain. Installez <a href=\"https://docs.ipfs.tech/install/ipfs-companion/\" target=\"_blank\">IPFS Companion</a> pour y accéder via le QR code.
  </footer>
</body>
</html>`;
}

async function uploadHTMLToIPFS(htmlString) {
  const tempPath = path.join(os.tmpdir(), `verif_${Date.now()}.html`);
  fs.writeFileSync(tempPath, htmlString, "utf-8");
  const result = await uploadToIPFS(tempPath);
  fs.unlinkSync(tempPath);
  return result;
}

module.exports = {
  generateVerificationHTML,
  uploadHTMLToIPFS
};