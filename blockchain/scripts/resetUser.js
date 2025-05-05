const { ethers } = require("hardhat");
const addresses = require("../contracts/addresses.json");

async function main() {
  const user = "0x37d80F9aFd09b2de59d6628d109cf5b7a6ACB49f";
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
