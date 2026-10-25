const hre = require("hardhat");

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  const contractAddress = "0xfFb8Dc7154E0E8C87D28B90876084972e3e86937";

  const storage = await hre.ethers.getContractAt(
    "SimpleStorage",
    contractAddress,
    deployer
  );

  const initialValue = await storage.getValue();
  console.log("Initial value:", initialValue.toString());

  const transaction = await storage.setValue(250);
  console.log("Transaction hash:", transaction.hash);

  await transaction.wait();
  console.log("setValue transaction confirmed");

  const updatedValue = await storage.getValue();
  console.log("Updated value:", updatedValue.toString());

  if (updatedValue.toString() === "250") {
    console.log("Test passed successfully");
  } else {
    throw new Error("Test failed");
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
