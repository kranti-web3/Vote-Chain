const { Web3 } = require("web3");

async function main() {
  const web3 = new Web3("http://127.0.0.1:7545" );

  const accounts = await web3.eth.getAccounts();
  console.log("Ganache accounts:", accounts);

  const contractAddress = "0xD3224A1Aa17880a499C1415Ae4e83fE114BDb747";

  const abi = [
    {
      inputs: [],
      name: "name",
      outputs: [{ internalType: "string", name: "", type: "string" }],
      stateMutability: "view",
      type: "function"
    },
    {
      inputs: [],
      name: "symbol",
      outputs: [{ internalType: "string", name: "", type: "string" }],
      stateMutability: "view",
      type: "function"
    },
    {
      inputs: [],
      name: "decimals",
      outputs: [{ internalType: "uint8", name: "", type: "uint8" }],
      stateMutability: "view",
      type: "function"
    },
    {
      inputs: [{ internalType: "address", name: "account", type: "address" }],
      name: "balanceOf",
      outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
      stateMutability: "view",
      type: "function"
    }
  ];

  const contract = new web3.eth.Contract(abi, contractAddress);
  const owner = accounts[0];

  const name = await contract.methods.name().call();
  const symbol = await contract.methods.symbol().call();
  const decimals = await contract.methods.decimals().call();
  const rawBalance = await contract.methods.balanceOf(owner).call();

  console.log("Token name:", name);
  console.log("Token symbol:", symbol);
  console.log("Decimals:", decimals);
  console.log("Raw balance:", rawBalance.toString());
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
