async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deploying contracts with the account:", deployer.address);

  // Get contract factory and deploy the contract
  const Auth = await ethers.getContractFactory("Auth");
  const auth = await Auth.deploy();
  console.log("Auth contract deployed to:", auth.address);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
