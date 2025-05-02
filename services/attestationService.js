const crypto = require("crypto");
const QRCode = require("qrcode");
//Génération de identifiant unique,hash sécurisé SHA-256,QR code vers lien de vérification
exports.generateAttestationMeta = async ({ stageId, etudiantId }) => {
  const hash = crypto.createHash("sha256").update(`${stageId}-${etudiantId}-${Date.now()}`).digest("hex");
  const identifiant = `ATTEST-${Date.now()}-${stageId}`;
  const qrData = `https://tonsite.tn/attestation/verify?hash=${hash}`;
  const qrCode = await QRCode.toDataURL(qrData);

  return { identifiant, hash, qrCode };
};