const { ethers } = require("ethers");
const fs = require("fs");
const abi = require("../abis/abis.json");
const contractAddress = "0x5fbdb2315678afecb367f032d93f642f64180aa3";

const provider = new ethers.JsonRpcProvider("http://localhost:8545");
const signer = provider.getSigner();
const contract = new ethers.Contract(contractAddress, abi.abi, signer);

module.exports = contract;