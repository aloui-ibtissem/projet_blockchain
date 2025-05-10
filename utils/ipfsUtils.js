// utils/ipfsUtils.js
const fs = require("fs");
const axios = require("axios");
const FormData = require("form-data");

/**
 * Upload un fichier PDF vers un nœud IPFS local.
 * @param {string} filePath - chemin absolu du fichier à uploader
 * @returns {string} - URL IPFS publique
 */
exports.uploadToIPFS = async (filePath) => {
  try {
    const content = fs.readFileSync(filePath);
    const formData = new FormData();
    formData.append("file", content, "attestation.pdf");

    const res = await axios.post("http://localhost:5001/api/v0/add", formData, {
      headers: formData.getHeaders(),
    });

    const hash = res.data.Hash;
    return `https://ipfs.io/ipfs/${hash}`;
  } catch (err) {
    console.error(" Erreur IPFS local :", err.message);
    throw new Error("Échec du upload IPFS local");
  }
};
