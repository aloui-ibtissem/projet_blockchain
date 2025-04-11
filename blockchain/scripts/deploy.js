// scripts/deploy.js
const hre = require("hardhat");

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  console.log("Deploying contracts with the account:", deployer.address);

  const Auth = await hre.ethers.getContractFactory("Auth");
  const auth = await Auth.deploy();
  

  console.log("Auth contract deployed to:", auth.address);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
