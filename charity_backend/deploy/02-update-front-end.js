const {
  frontEndContractsFile,
  frontEndAbiFile,
} = require("../helper-hardhat-config");
const fs = require("fs");
const { network } = require("hardhat");

module.exports = async () => {
  if (process.env.UPDATE_FRONT_END) {
    console.log("Writing to front end...");
    updateContractAddresses();
    updateAbi();
    console.log("Front end written!");
  }
};

async function updateAbi() {
  const charity = await ethers.getContract("Charity");
  fs.writeFileSync(
    frontEndAbiFile,
    charity.interface.format(ethers.utils.FormatTypes.json)
  );
}

async function updateContractAddresses() {
  const charity = await ethers.getContract("Charity");
  const contractAddresses = JSON.parse(
    fs.readFileSync(frontEndContractsFile, "utf8")
  );
  if (network.config.chainId.toString() in contractAddresses) {
    if (
      !contractAddresses[network.config.chainId.toString()].includes(
        charity.address
      )
    ) {
      contractAddresses[network.config.chainId.toString()].push(
        charity.address
      );
    }
  } else {
    contractAddresses[network.config.chainId.toString()] = [charity.address];
  }
  fs.writeFileSync(frontEndContractsFile, JSON.stringify(contractAddresses));
}
module.exports.tags = ["all", "frontend"];
