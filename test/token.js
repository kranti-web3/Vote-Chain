const hre = require("hardhat");

async function main() {
    const [sender] = await hre.ethers.getSigners();

    const senderAddress = await sender.getAddress();

    const recipientAddress = "0xD3c9233d318f142672800D79F52A29070C2Cd0A3";

    const tokenAddress = "0x8C6b88CF0075e0E1C2D2ae68894B7899B3EF50Ec";

    const token = await hre.ethers.getContractAt("Token", tokenAddress);

    const senderBalanceBefore = await token.balanceOf(senderAddress);
    const recipientBalanceBefore = await token.balanceOf(recipientAddress);

    console.log("Sender:", senderAddress);
    console.log("Recipient:", recipientAddress);
    console.log("Sender balance before:", senderBalanceBefore.toString(), "HHT");
    console.log("Recipient balance before:", recipientBalanceBefore.toString(), "HHT");

    const transaction = await token.transfer(recipientAddress, 100);
    console.log("Transaction hash:", transaction.hash);

    await transaction.wait();
    console.log("Transfer confirmed");

    const senderBalanceAfter = await token.balanceOf(senderAddress);
    const recipientBalanceAfter = await token.balanceOf(recipientAddress);

    console.log("Sender balance after:", senderBalanceAfter.toString(), "HHT");
    console.log("Recipient balance after:", recipientBalanceAfter.toString(), "HHT");
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
