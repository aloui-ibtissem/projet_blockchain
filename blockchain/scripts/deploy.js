const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  const Auth = await hre.ethers.getContractFactory("Auth");
  const auth = await Auth.deploy();
  await auth.waitForDeployment();
  const authAddress = await auth.getAddress();

  const Attestation = await hre.ethers.getContractFactory("AttestationContract");
  const attestation = await Attestation.deploy();
  await attestation.waitForDeployment();
  const attestationAddress = await attestation.getAddress();

  console.log("Déployé:");
  console.log("Auth:", authAddress);
  console.log("AttestationContract:", attestationAddress);

  fs.writeFileSync(
    "./contracts/addresses.json",
    JSON.stringify({ auth: authAddress, attestation: attestationAddress }, null, 2)
  );
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
