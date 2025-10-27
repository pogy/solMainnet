const { ethers } = require("ethers");
const fs = require('fs');
const path = require('path');

const colors = require('colors');
const solc = require('solc');
const {CryptoService} = require('../../common2/util/CryptoUtil');
const chalk = require('chalk');



// const account = web3.eth.accounts.privateKeyToAccount('YOUR_PRIVATE_KEY');
// web3.eth.accounts.wallet.add(account);
// web3.eth.defaultAccount = account.address;

// 读取编译后的合约字节码和ABI
// const bytecode = fs.readFileSync(path.join(__dirname, 'build/SimpleTransfer.bin')).toString();
// const abi = JSON.parse(fs.readFileSync(path.join(__dirname, 'build/SimpleTransfer.abi')).toString());

// 连接到Base链节点
const provider = new ethers.providers.JsonRpcProvider("https://mainnet.base.org");
const cryptoService = new CryptoService();
const contractsPath = path.resolve(__dirname, 'contracts.sol');
const source = fs.readFileSync(contractsPath, 'utf8');
const {randomExecute} = require('../../common2/util/schedule');
const {logger} = require('../../common2/util/logger');
const {EthUtil} = require('../../common2/web3/EthUtil');

const {DB} = require('../../common2/util/db');
const {sleep, getRandomInt, roundToDecimals, hashCode} = require('../../common2/util/common');


const db = new DB();


const compileContract = async () =>  {
    const input = {
      language: 'Solidity',
      sources: {
        'contracts.sol': {
          content: source,
        },
      },
      settings: {
        outputSelection: {
          '*': {
            '*': ['abi', 'evm.bytecode'],
          },
        },
      },
    };

    // Compile contracts (no "Compiling contracts" message)
    const compiled = JSON.parse(solc.compile(JSON.stringify(input)));
    console.log('Transfer transaction receipt:', compiled);
    // Check for compilation errors
    if (compiled.errors) {
      let fatal = false;
      compiled.errors.forEach((err) => {
        console.error(err.formattedMessage.red);
        if (err.severity === 'error') fatal = true;
      });
      if (fatal) process.exit(1);
    }

    const contractNames = Object.keys(compiled.contracts['contracts.sol']);

    const randomIndex = Math.floor(Math.random() * contractNames.length);
    const selectedContractName = contractNames[randomIndex];
    const contractData = compiled.contracts['contracts.sol'][selectedContractName];
    console.log(
      `\n🏦 compiling contract [${selectedContractName}]`
        .green
    );
    return contractData;
}

const deploy = async (signerWallet, contractData) => {
    // Get all contract names from the compilation output
    const contractABI = contractData.abi;
    const contractBytecode = contractData.evm.bytecode.object;

    logger.log(chalk.cyan('✅ Contract Has been compiled.Preparing Deployment..'));

    // const gasCost = await EthUtil.getCostGas(provider)

    // Set a random gasLimit between 150,000 and 250,000
    // const gasLimit = Math.floor(Math.random() * (250000 - 150000 + 1)) + 350000;

    const factory = new ethers.ContractFactory(
      contractABI,
      contractBytecode,
      signerWallet
    );

    // 获取部署交易数据
    const deployTx = factory.getDeployTransaction(/* 构造参数 */);

    // 预估 gas
    let gasLimit = await provider.estimateGas({
      ...deployTx,
      from: signerWallet.address, // 必须加上 from 字段
    });
    console.log("预估gas:", gasLimit.toString());
    // gasLimit = ethers.BigNumber.from(Math.floor(Number(gasLimit) + Number(gasLimit) * 10/100));//459474;

    // Deploy the contract using its constructor arguments
    const contract = await factory.deploy({gasLimit});

    console.log(`🚀 Deploy Tx Sent! - ${contract.address}`.yellow);

    await contract.deployed();

    console.log(`[${signerWallet.address}] deployed Contract at address: ${contract.address} `.yellow);
    return contract.address;
};

const transfer = async (to, amount, contractAddress, wallet, abi) => {
    const contract = new ethers.Contract(contractAddress, abi, wallet);

    console.log(wallet.address, '->',  to, 'amount', amount);

    const block = await provider.getBlock('latest');
    const baseFee = block.baseFeePerGas
      ? block.baseFeePerGas
      : ethers.BigNumber.from(0);
    // Calculate fees: baseFee + 15%
    const maxFeePerGas = baseFee.mul(115).div(100);
    const maxPriorityFeePerGas = baseFee.mul(115).div(100);

    const value = ethers.utils.parseEther(amount.toString()); // Amount in token's smallest unit
    const gasLimit = await contract.estimateGas.transfer(to, {
        value
    });
    const tx = await contract.transfer(to, {
        value,
        gasLimit,
        maxFeePerGas,
        maxPriorityFeePerGas,
    });
    let result =  await tx.wait();
    console.log('Transfer transaction receipt:', result.blockNumber, 'amount ', amount, 'ETH', to);
};

// const estimateGas = async (wallet, recipient) => {
//     const amount = ethers.utils.parseEther("0.0001"); // 1 ETH

//     // Estimate gas for sending 1 ETH to recipient
//     const gasEstimate = await wallet.estimateGas({
//         to: recipient,
//         value: amount
//     });

//     console.log("Gas Estimate:", gasEstimate.toString());

//     // Fetch current gas price from the network
//     const gasPrice = await provider.getGasPrice();
//     console.log("Gas Price:", ethers.utils.formatUnits(gasPrice, "gwei"), "gwei");

//     // Calculate total gas cost
//     const totalGasCost = gasEstimate.mul(gasPrice);
//     console.log("Total Gas Cost:", ethers.utils.formatEther(totalGasCost), "ETH");
// };

const execute = async (task)=> {
    // if(task.param3 == 1 || task.param3 == 3){
    //     console.log(task.eth_wallet_address, 'return');
    //     return;
    // }

    try{
        const balance = await EthUtil.getBalance(task.eth_wallet_address, provider);
        // if(Number(balance.format) > 0.03){
        //   return
        // }
        let amount = roundToDecimals(0.041 + getRandomInt(10)/10000, 6);
        console.log(amount);
        const to = task.eth_wallet_address;
        let contractData = await compileContract();
        let contractAddress = "0xE8fFC2C0B8c7E5E1089deEa32e972Ef637437f60";//await deploy(wallet, contractData);
        
        await transfer(to, amount , contractAddress, wallet, contractData.abi);

        task.param3 = 1;
        await db.update_common_airdroip_task(task);
    }catch(err){
        console.log(err)
    }
}

const executeTarget = async (task)=> {

    try{
        const balance = await EthUtil.getBalance(task.eth_wallet_address, provider);
        if(Number(balance.format) > 0.005){
          return
        }
        let amount = roundToDecimals(0.0308 - Number(balance.format), 5);
        console.log(amount);
        const to = task.eth_wallet_address;
        let contractData = await compileContract();
        let contractAddress = await deploy(wallet, contractData);
        
        await transfer(to, amount , contractAddress, wallet, contractData.abi);

    }catch(err){
        console.log(err)
    }
}


let wallet;
async function main() {
  let wallets = await db.get_common_airdroip_tasks('monad');
  await cryptoService.init();

  const privateKey = cryptoService.decryptData("GqAsgNvuX4YxtO7ZFZzRpY5aFb0pOsGwBATYumZHYcnEk52SXUqzSUOQopHj9e90blkRcmEjbjINs0S4BPejDDOWPzO6WVbFrdXgIyPcG3W/OUjFwoUXM7vl+s32ExD6/j5zs5Qqpxra02uB3T6Bna75lDUktXfF3P4B1E75k2rH9QuPZOrpbPaqE3dET+tOAXXtHraI0RcO6kzDqq5bSF6e6pRVa5CnFRROvSs8U7Nk6qj2G8CIAtuEGSizvWU06auWgfp9wHS9p99EtfZcoES2ywiKWop475C+pZwfaTTnzKZsNdaj484WNtL0RO5LqZeJJkHKLxAnq52XXAKKqw==");

  wallet = new ethers.Wallet(privateKey, provider);
  const ids = [ "0xF482759c8d3F1B42Fff283E61d63A1C52fe1907b"];
  wallets = wallets.filter(wallet => (ids.includes(wallet.eth_wallet_address)));
    
  await randomExecute(wallets, execute, 10000  * wallets.length);
    
}


main().catch(console.error);