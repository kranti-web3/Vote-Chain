const hre = require("hardhat");

async function main() {
  const contractAddress = "0xD3224A1Aa17880a499C1415Ae4e83fE114BDb747";
  const recipientAddress = "0xE76cD75A80ee0c7112C33EA22b9B8e52dd768941";

  const [sender] = await hre.ethers.getSigners();
  const token = await hre.ethers.getContractAt(
    "SaviourToken",
    contractAddress
  );

  const senderBefore = await token.balanceOf(sender.address);
  const recipientBefore = await token.balanceOf(recipientAddress);

  console.log("Sender:", sender.address);
  console.log("Recipient:", recipientAddress);
  console.log(
    "Sender balance before:",
    hre.ethers.formatUnits(senderBefore, 18),
    "SVR"
  );
  console.log(
    "Recipient balance before:",
    hre.ethers.formatUnits(recipientBefore, 18),
    "SVR"
  );

  const amount = hre.ethers.parseUnits("100", 18);
  const transaction = await token.transfer(recipientAddress, amount);

  console.log("Transaction hash:", transaction.hash);
  await transaction.wait();
  console.log("Transfer confirmed");

  const senderAfter = await token.balanceOf(sender.address);
  const recipientAfter = await token.balanceOf(recipientAddress);

  console.log(
    "Sender balance after:",
    hre.ethers.formatUnits(senderAfter, 18),
    "SVR"
  );
  console.log(
    "Recipient balance after:",
    hre.ethers.formatUnits(recipientAfter, 18),
    "SVR"
  );
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
