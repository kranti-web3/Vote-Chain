const hre = require("hardhat");

async function main() {
  const contractAddress = "0xD3224A1Aa17880a499C1415Ae4e83fE114BDb747";
  const recipientAddress = "0xD69bCf8b8F6b8eec417d2b5A4A3FBDF17E5719BE";
  const senderAddress = "0xE76cD75A80ee0c7112C33EA22b9B8e52dd768941";

  const [deployer] = await hre.ethers.getSigners();

  if (deployer.address.toLowerCase() !== senderAddress.toLowerCase()) {
    throw new Error("The signer address does not match the recipient account.");
  }

  const token = await hre.ethers.getContractAt(
    "SaviourToken",
    contractAddress,
    deployer
  );

  const amount = hre.ethers.parseUnits("50", 18);

  console.log("Sender:", senderAddress);
  console.log("Recipient:", recipientAddress);
  console.log("Sending 50 SVR tokens...");

  const transaction = await token.transfer(recipientAddress, amount);
  console.log("Transaction hash:", transaction.hash);

  await transaction.wait();
  console.log("Transfer confirmed successfully");

  const senderBalance = await token.balanceOf(senderAddress);
  const recipientBalance = await token.balanceOf(recipientAddress);

  console.log(
    "Sender balance:",
    hre.ethers.formatUnits(senderBalance, 18),
    "SVR"
  );
  console.log(
    "Recipient balance:",
    hre.ethers.formatUnits(recipientBalance, 18),
    "SVR"
  );
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
