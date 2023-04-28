const hre = require("hardhat");

async function main() {
  const OVR = await hre.ethers.getContractFactory("OVRToken");
  const ovr = await OVR.deploy("OVR", "OVR");

  await ovr.deployed();

  console.log(`Deployed to ${ovr.address}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
