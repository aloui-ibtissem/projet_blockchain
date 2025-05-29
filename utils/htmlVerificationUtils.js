const fs = require("fs");
const path = require("path");
const os = require("os");
const { uploadToIPFS } = require("./ipfsUtils");

function generateVerificationHTML({ attestationId, fileHash, ipfsUrl, issuer, timestamp, event }) {
  const date = new Date(timestamp).toLocaleString("fr-FR");

  return `
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <title>Vérification de l'attestation - ${attestationId}</title>
  <style>
    body {
      font-family: Arial, sans-serif;
      max-width: 800px;
      margin: auto;
      padding: 40px;
      background-color: #ffffff;
      color: #222;
      line-height: 1.6;
    }
    h1 {
      color: #003366;
      font-size: 24px;
      border-bottom: 1px solid #ccc;
      padding-bottom: 10px;
    }
    .section {
      margin-top: 30px;
    }
    .label {
      font-weight: bold;
      margin-bottom: 5px;
    }
    code {
      background-color: #f2f2f2;
      padding: 4px 6px;
      border-radius: 4px;
      font-size: 14px;
      display: inline-block;
    }
    a {
      color: #0056b3;
      text-decoration: none;
    }
    a:hover {
      text-decoration: underline;
    }
    footer {
      margin-top: 50px;
      font-size: 12px;
      color: #666;
      border-top: 1px solid #ccc;
      padding-top: 15px;
    }
  </style>
</head>
<body>
  <h1>Vérification d'une attestation de stage</h1>

  <div class="section">
    <p class="label">Identifiant de l’attestation :</p>
    <code>${attestationId}</code>
  </div>

  <div class="section">
    <p class="label">Lien vers le document PDF (IPFS) :</p>
    <a href="${ipfsUrl}" target="_blank">${ipfsUrl}</a>
  </div>

  <div class="section">
    <p class="label">Empreinte SHA-256 (intégrité du fichier) :</p>
    <code>${fileHash}</code>
  </div>

  <div class="section">
    <p class="label">Émetteur (identifiant interne ou Ethereum) :</p>
    <code>${issuer}</code>
  </div>

  <div class="section">
    <p class="label">Date et heure de publication :</p>
    <code>${date}</code>
  </div>

  <div class="section">
    <p class="label">Événement Blockchain enregistré :</p>
    <code>${event}</code>
  </div>

  <div class="section">
    <p class="label">Méthode de vérification :</p>
    <p>
      Pour valider l’authenticité de cette attestation, téléchargez le fichier PDF depuis le lien ci-dessus.
      Ensuite, utilisez un outil de vérification SHA-256 (par exemple <a href="https://emn178.github.io/online-tools/sha256.html" target="_blank">cet outil en ligne</a>) pour calculer son empreinte.
      Si le hash obtenu correspond à celui affiché ici, l’attestation est authentique.
    </p>
  </div>

  <footer>
    Cette page a été générée automatiquement pour permettre la vérification publique d'une attestation émise par la plateforme StageChain.
  </footer>
</body>
</html>
`;
}

async function uploadHTMLToIPFS(htmlString) {
  const tempPath = path.join(os.tmpdir(), `verif_${Date.now()}.html`);
  fs.writeFileSync(tempPath, htmlString, "utf-8");
  const ipfsUrl = await uploadToIPFS(tempPath);
  fs.unlinkSync(tempPath);
  return ipfsUrl;
}

module.exports = {
  generateVerificationHTML,
  uploadHTMLToIPFS
};
