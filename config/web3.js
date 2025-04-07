// Importation du module ethers, qui permet d'interagir avec la blockchain Ethereum
const { ethers } = require("ethers");

// Importation du module 'fs' (File System) pour lire et écrire des fichiers locaux
const fs = require("fs");

// Importation de l'ABI (Application Binary Interface) du contrat intelligent à partir d'un fichier JSON
const abi = require("../abis/abis.json");

// Définition de l'adresse du contrat intelligent déployé sur la blockchain
const contractAddress = "0x5fbdb2315678afecb367f032d93f642f64180aa3";

// Création d'un fournisseur (provider) pour se connecter à un nœud Ethereum local à l'adresse spécifiée
// Ici, le nœud est exécuté sur le port 8545 ( pour un réseau de test local)
const provider = new ethers.JsonRpcProvider("http://localhost:8545");

// Obtention d'un signer à partir du fournisseur pour pouvoir signer des transactions
// Un signer est généralement associé à un compte Ethereum qui peut signer des transactions
const signer = provider.getSigner();

// Création d'une instance du contrat intelligent en utilisant l'adresse du contrat, son ABI et le signer
// Le contrat intelligent est maintenant prêt à interagir avec la blockchain
const contract = new ethers.Contract(contractAddress, abi.abi, signer);

// Exportation de l'instance du contrat pour qu'elle puisse être utilisée dans d'autres fichiers de l'application
module.exports = contract;
