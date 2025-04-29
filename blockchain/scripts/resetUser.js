const { ethers } = require("hardhat");
const addresses = require("../contracts/addresses.json");

async function main() {
  const user = "0xdCA56B385a81B9015A4a71d10dF98f9D85a75fF4";
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
