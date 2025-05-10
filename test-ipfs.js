// test-ipfs.js
const path = require("path");
const { uploadToIPFS } = require("./utils/ipfsUtils");

async function testUpload() {
  const filePath = path.join(__dirname, "attestations", "2024-2025_RGHT_ENIG_001.pdf");

  try {
    const url = await uploadToIPFS(filePath);
    console.log(" Fichier uploadé sur IPFS :", url);
  } catch (err) {
    console.error(" Erreur upload :", err.message);
  }
}

testUpload();
