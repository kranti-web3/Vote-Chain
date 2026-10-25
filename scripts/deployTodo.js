const hre = require("hardhat");

async function main() {
    const [deployer] = await hre.ethers.getSigners();

    console.log("Deploying Todo with account:", deployer.address);

    const Todo = await hre.ethers.getContractFactory("Todo");
    const todo = await Todo.deploy();

    await todo.waitForDeployment();

    const todoAddress = await todo.getAddress();
    console.log("Todo deployed to:", todoAddress);
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
