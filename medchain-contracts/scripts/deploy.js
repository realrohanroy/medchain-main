import hre from "hardhat";
import fs from "fs";

async function main() {
  const Ledger = await hre.ethers.getContractFactory("MedChainLedger");
  const ledger = await Ledger.deploy();

  await ledger.waitForDeployment();

  const address = await ledger.getAddress();
  console.log(`MedChainLedger deployed to: ${address}`);
  fs.writeFileSync("deployed_address.txt", address);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
