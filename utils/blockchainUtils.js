const crypto = require("crypto");
const { create } = require("ipfs-http-client");
const { ethers } = require("ethers");

const ipfs = create({ url: "https://ipfs.infura.io:5001/api/v0" });

exports.uploadToIPFS = async (buffer) => {
  const result = await ipfs.add(buffer);
  return result.path; // Hash IPFS
};

exports.generateHash = (buffer) => {
  return crypto.createHash("sha256").update(buffer).digest("hex");
};

exports.publishToBlockchain = async (hash) => {
  const provider = new ethers.providers.JsonRpcProvider("http://localhost:8545");
  const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);
  const contractAddress = process.env.CONTRACT_ADDRESS;
  const abi = require("../abis/Attestation.json");

  const contract = new ethers.Contract(contractAddress, abi, wallet);
  const tx = await contract.publishAttestationHash(hash);
  await tx.wait();
  return tx.hash;
};
