const fs = require("fs");
const { Web3Storage, File } = require("web3.storage");

const client = new Web3Storage({ token: process.env.WEB3STORAGE_TOKEN });

exports.uploadToIPFS = async (filePath) => {
  const content = fs.readFileSync(filePath);
  const files = [new File([content], "attestation.pdf")];
  const cid = await client.put(files);
  return `https://${cid}.ipfs.dweb.link/attestation.pdf`;
};
