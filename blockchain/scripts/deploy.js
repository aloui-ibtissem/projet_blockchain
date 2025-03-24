const hre = require("hardhat");

async function main() {
    // Récupérer le compte qui va déployer le contrat
    const [deployer] = await hre.ethers.getSigners();

    console.log("Déploiement par:", deployer.address);

    // Déployer le contrat
    const Auth = await hre.ethers.getContractFactory("Auth");
    const auth = await Auth.deploy();

    console.log("Contrat Auth déployé à l'adresse:", auth.address);
}

// Gérer les erreurs et le déploiement
main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
