const { ethers } = require("hardhat");
const addresses = require("../contracts/addresses.json");

async function main() {
  const user = "0xbb46567b9995c2688bdC4534Ee1aDE5cF64F1bec";
  const auth = await ethers.getContractAt("Auth", addresses.auth);

  const role = await auth.getRole(user);
  if (role.toString() === "0") {
    return console.log("Cet utilisateur n’est pas enregistré sur la blockchain.");
  }

  const tx = await auth.resetRole(user);
  await tx.wait();

  console.log(`Rôle réinitialisé pour : ${user}`);
}

main().catch(console.error);
