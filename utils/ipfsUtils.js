const fs = require("fs");
const axios = require("axios");
const FormData = require("form-data");
const path = require("path");

// Upload fichier dans IPFS local avec pin + wrap dir pour visibilité
exports.uploadToIPFS = async (filePath) => {
  try {
    const fileName = path.basename(filePath);
    const content = fs.readFileSync(filePath);

    const formData = new FormData();
    formData.append("file", content, fileName);

    // wrap-with-directory = true permet d'accéder au fichier par son nom
    // pin = true => visible dans IPFS Desktop
    const res = await axios.post(
      `http://127.0.0.1:5001/api/v0/add?pin=true&wrap-with-directory=true`,
      formData,
      {
        headers: formData.getHeaders(),
        timeout: 15000
      }
    );

    // On récupère le dernier hash (le dossier qui contient le fichier)
    const lines = res.data.toString().trim().split("\n");
    const lastLine = JSON.parse(lines[lines.length - 1]);
    const cid = lastLine.Hash;

    // On retourne l’URL publique complète vers le fichier lui-même
    return `https://ipfs.io/ipfs/${cid}/${fileName}`;
  } catch (err) {
    console.error(" Erreur IPFS:", err.message);

    if (err.code === "ECONNREFUSED") {
      throw new Error("IPFS Desktop non démarré sur le port 5001.");
    }

    throw new Error("Échec de l'upload IPFS local");
  }
};
