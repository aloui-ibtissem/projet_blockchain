const fs = require("fs");
const axios = require("axios");
const FormData = require("form-data");
const path = require("path");

exports.uploadToIPFS = async (filePath) => {
  try {
    const fileName = path.basename(filePath);
    const content = fs.readFileSync(filePath);

    const formData = new FormData();
    formData.append("file", content, fileName);

    const res = await axios.post(
      `http://127.0.0.1:5001/api/v0/add?pin=true&wrap-with-directory=true`,
      formData,
      {
        headers: formData.getHeaders(),
        timeout: 15000
      }
    );

    const lines = res.data.toString().trim().split("\n");
    const lastLine = JSON.parse(lines[lines.length - 1]);
    const cid = lastLine.Hash;

    return {
      cid,
      fileName,
      publicUrl: `https://ipfs.io/ipfs/${cid}/${fileName}`,
      localUrl: `http://127.0.0.1:8080/ipfs/${cid}/${fileName}`
    };
  } catch (err) {
    console.error("Erreur IPFS:", err.message);
    throw new Error("Échec de l'upload IPFS local");
  }
};