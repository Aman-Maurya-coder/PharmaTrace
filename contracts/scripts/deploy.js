async function main() {
  const PharmaTrace = await ethers.getContractFactory(
    "contracts/PharmaTrace.sol:PharmaTrace"
  );
  const contract = await PharmaTrace.deploy();
  await contract.waitForDeployment();

  console.log("PharmaTrace deployed to:", await contract.getAddress());
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
