const db = require("../config/db");
const { uploadToIPFS, generateHash, publishToBlockchain } = require("../utils/blockchainUtils");
const { generateQRCode } = require("../utils/qrUtils");

exports.genererAttestation = async (etudiantEmail, fichier) => {
  const [[etudiant]] = await db.execute("SELECT id FROM Etudiant WHERE email = ?", [etudiantEmail]);
  const [[stage]] = await db.execute("SELECT * FROM Stage WHERE etudiantId = ?", [etudiant.id]);
  if (!stage) throw new Error("Aucun stage trouvé");

  const hash = generateHash(fichier.buffer);
  const ipfsUrl = await uploadToIPFS(fichier.buffer);
  const txHash = await publishToBlockchain(hash);

  const identifiant = `ATT_${Date.now()}`;

  await db.execute(`
    INSERT INTO Attestation (identifiant, etudiantId, fichierHash, publishedOnChain, dateCreation)
    VALUES (?, ?, ?, TRUE, NOW())
  `, [identifiant, etudiant.id, hash]);

  const qrCode = await generateQRCode(ipfsUrl);

  return {
    identifiant,
    ipfsUrl,
    txHash,
    qrCode
  };
};

exports.getAttestationEtudiant = async (email) => {
  const [[etudiant]] = await db.execute("SELECT id FROM Etudiant WHERE email = ?", [email]);
  const [[att]] = await db.execute("SELECT * FROM Attestation WHERE etudiantId = ?", [etudiant.id]);
  return att || null;
};
