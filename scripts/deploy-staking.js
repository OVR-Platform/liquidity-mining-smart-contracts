const hre = require("hardhat");

async function main() {
  const LPTokens = "0xd55d6C679cD17be44b0d67Bc56F1Da264aedb387";
  const OVRToken = "0x7613546eed456f42E394078b1734d6E7790C4ae5";
  const Staking = await hre.ethers.getContractFactory("LiquidityMining");
  const staking = await Staking.deploy(LPTokens, OVRToken);
  const MONTH = 2592000;

  await staking.deployed();

  console.log(`Deployed to ${staking.address}`);

  const emissions = [317097920, 1585489600, 3170979200, 4756468800, 6341958400];
  const seconds = [0, MONTH * 3, MONTH * 6, MONTH * 9, MONTH * 12];
  const cap = [0, 0, 0, 0, 0];
  for (let i = 0; i < emissions.length; i++) {
    let tx = await staking.configureLocks(emissions[i], i, seconds[i], cap[i]);
    await tx.wait();
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
