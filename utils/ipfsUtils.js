const fs = require("fs");
const axios = require("axios");
const FormData = require("form-data");

exports.uploadToIPFS = async (filePath) => {
  try {
    const content = fs.readFileSync(filePath);
    const formData = new FormData();
    formData.append("file", content, "attestation.pdf");

    const res = await axios.post("http://127.0.0.1:5001/api/v0/add", formData, {
      headers: {
        ...formData.getHeaders()
      },
      timeout: 10000 // 10 sec max
    });

    const hash = res.data.Hash;
    return `https://ipfs.io/ipfs/${hash}`;
  } catch (err) {
    console.error(" Erreur IPFS local : ", err.message);

    if (err.code === "ECONNREFUSED") {
      throw new Error("Impossible de se connecter à IPFS local. Assure-toi que IPFS Desktop est lancé avec l'API HTTP sur le port 5001.");
    }

    throw new Error("Échec du upload IPFS local");
  }
};
