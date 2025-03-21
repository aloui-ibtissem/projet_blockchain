require("@nomicfoundation/hardhat-toolbox");
require("dotenv").config(); // Charge les variables d'environnement du fichier .env

module.exports = {
  solidity: "0.8.20", // Version de Solidity
  networks: {
    mumbai: { // Configuration du réseau Polygon Mumbai
      url: process.env.AlCHEMY_API_URL, // URL d'ALchemy
      accounts: [process.env.PRIVATE_KEY], // Clé privée du wallet
    },
  },
  etherscan: {
    apiKey: process.env.POLYGONSCAN_API_KEY, // Clé API pour vérifier les contrats
  },
};
