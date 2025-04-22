const hre = require("hardhat");
const fs = require("fs");

async function main() {
  // Déploiement du contrat Auth
  const Auth = await hre.ethers.getContractFactory("Auth");
  const auth = await Auth.deploy();

  await auth.waitForDeployment(); // Compatible Ethers v6
  const authAddress = await auth.getAddress();

  console.log("Auth.sol déployé à l'adresse :", authAddress);

  // Sauvegarde l'adresse dans un fichier
  fs.writeFileSync(
    "./contracts/addresses.json",
    JSON.stringify({ auth: authAddress }, null, 2)
  );
  console.log("Adresse sauvegardée dans contracts/addresses.json");
}

main().catch((err) => {
  console.error("Erreur lors du déploiement :", err);
  process.exitCode = 1;
});
