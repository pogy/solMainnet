const { ethers } = require("ethers");
const fs = require('fs');
const path = require('path');

const colors = require('colors');
const solc = require('solc');
const {CryptoService} = require('../../common2/util/CryptoUtil');
const {getBalance} = require('../../common2/web3/okx_eth');
const chain = require('./chain');

const {EthUtil} = require('../../common2/web3/EthUtil');


// const account = web3.eth.accounts.privateKeyToAccount('YOUR_PRIVATE_KEY');
// web3.eth.accounts.wallet.add(account);
// web3.eth.defaultAccount = account.address;

// 读取编译后的合约字节码和ABI
// const bytecode = fs.readFileSync(path.join(__dirname, 'build/SimpleTransfer.bin')).toString();
// const abi = JSON.parse(fs.readFileSync(path.join(__dirname, 'build/SimpleTransfer.abi')).toString());

// https://sepolia.etherscan.io/
// 连接到Base链节点
const RPC_URL = "https://purple-white-bridge.ethereum-sepolia.quiknode.pro/54a5eab64069fd6e5760d77af3fdef8cef9d95e7/";
const CHAIN_ID = 11155111;

const provider = new ethers.providers.JsonRpcProvider(RPC_URL, CHAIN_ID);
const cryptoService = new CryptoService();
const contractsPath = path.resolve(__dirname, 'contracts.sol');
const source = fs.readFileSync(contractsPath, 'utf8');
const {randomExecute} = require('../../common2/util/schedule');


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

const deploy = async (wallet, contractData) => {
    // Get all contract names from the compilation output
    const contractABI = contractData.abi;
    const contractBytecode = contractData.evm.bytecode.object;

    console.log('✅ Contract Has been compiled.'.green);
    console.log('🔨 Preparing Deployment...'.cyan);

    // Retrieve latest block to get baseFeePerGas (if available)
    const block = await provider.getBlock('latest');
    const baseFee = block.baseFeePerGas
      ? block.baseFeePerGas
      : ethers.BigNumber.from(0);
    // Calculate fees: baseFee + 15%
    const maxFeePerGas = baseFee.mul(115).div(100);
    const maxPriorityFeePerGas = baseFee.mul(115).div(100);

    // Set a random gasLimit between 150,000 and 250,000
    const gasLimit = Math.floor(Math.random() * (250000 - 150000 + 1)) + 250000;

    const factory = new ethers.ContractFactory(
      contractABI,
      contractBytecode,
      wallet
    );

    // Deploy the contract using its constructor arguments
    const contract = await factory.deploy({
          gasLimit,
          maxFeePerGas,
          maxPriorityFeePerGas,
        });

    console.log(
      `🚀 Deploy Tx Sent! - ${contract.address}`
        .magenta
    );

    await contract.deployed();

    console.log(`[${wallet.address}] deployed Contract at address: ${contract.address} `.yellow);
    return contract.address;
};

const transfer = async (to, amount, contractAddress, wallet, abi) => {
    const contract = new ethers.Contract(contractAddress, abi, wallet);
    // Estimate gas
    // const gasEstimate = await contract.estimateGas.transfer(to, {
    //     value: ethers.utils.parseEther(amount.toString())
    // });
    // console.log("Gas Estimate:", gasEstimate.toString());
    // return

    // Retrieve latest block to get baseFeePerGas (if available)

    console.log(`Transfer [${wallet.address} -> ${to}] balance ${amount} MON `.green);

    const block = await provider.getBlock('latest');
    const baseFee = block.baseFeePerGas
      ? block.baseFeePerGas
      : ethers.BigNumber.from(0);
    // Calculate fees: baseFee + 15%
    const maxFeePerGas = baseFee.mul(115).div(100);
    const maxPriorityFeePerGas = baseFee.mul(115).div(100);

    // Set a random gasLimit between 150,000 and 250,000
    const value = ethers.utils.parseEther(amount.toString()); // Amount in token's smallest unit

    console.log("Executing transfer...");
    const gasLimit = await contract.estimateGas.transfer(to, {value});

    // const baseNonce = await provider.getTransactionCount(wallet.address, "pending");
    const tx = await contract.transfer(to, {
        // nonce: baseNonce + 1,
        value,
        gasLimit: ethers.BigNumber.from(Math.floor(Number(gasLimit) + Number(gasLimit) * 10/100)),
        maxFeePerGas,
        maxPriorityFeePerGas,
    });

    let result =  await tx.wait();
    console.log(`[${wallet.address} -> ${to}] Transfer transaction receipt: ${result.blockNumber}, ${amount} MON `.yellow);
};

async function mint(task){
  if(task.is_init  == 2){
    return
  }
  try{
    let balance = await EthUtil.getBalance(task.eth_wallet_address, provider);
    if(Number(balance.format) < 0.1){
        console.log(`wallet [${task.eth_wallet_address}] balance ${balance.format} MON `.red);
        return;
    }

    task.privateKey = cryptoService.decryptData(task.eth_wallet_private);
    const data = `0x6a627842000000000000000000000000${task.eth_wallet_address.slice(2).toLowerCase()}`;
    console.log(data);

    await EthUtil.sendTransaction(task.privateKey, "0x3eDF60dd017aCe33A0220F78741b5581C385A1BA", '0', data, provider);

    balance = await EthUtil.getBalance(task.eth_wallet_address, provider);
    task.balance = balance.format;
    task.is_init = 2;
    console.log(`wallet [${task.eth_wallet_address}] balance ${balance.format} ETH `.blue);
    await db.update_common_airdroip_task(task);
  }catch(err){
      console.log(err, task.eth_wallet_address)
  }
}

const execute = async (task)=> {
    let balance = await getBalance(wallet.address, RPC_URL);
    if(Number(balance) < 2){
        console.log(`wallet [${wallet.address}] balance ${balance} MON `.red);
        return;
    }

    let target_balance = await getBalance(task.eth_wallet_address, RPC_URL);
    // if(Number(target_balance) > 0.1){
    //     console.log(`wallet [${task.eth_wallet_address}] balance ${target_balance} MON `.blue);
    //     task.balance = await getBalance(task.eth_wallet_address, RPC_URL);
    //     task.is_init = 1;
    //     await db.update_common_airdroip_task(task);
    //     return;
    // }

    try{
        let amount = roundToDecimals((0.18 + getRandomInt(600)/10000), 4);
        if(Number(balance) < amount){
            console.log(`wallet [${wallet.address}] balance ${balance} ETH < ${amount} `.red);
            return;
        }
        console.log(amount);
        const to = task.eth_wallet_address;
        let contractData = await compileContract();
        let contractAddress = await deploy(wallet, contractData);
        
        await transfer(to, amount , contractAddress, wallet, contractData.abi);

        console.log(`wallet [${to}] balance `.blue);
        task.balance = await getBalance(to, RPC_URL);
        task.is_init = 1;
        console.log(`wallet [${to}] balance ${task.balance} ETH `.blue);
        await db.update_common_airdroip_task(task);
    }catch(err){
        console.log(err)
    }
}

//16

let wallet;
// 0x8C091A48ed82F24698bee5C39dd0053Fba5A33B2. 1
// 0x662D9983823563472375C06361F90aF7B631404C
// 0xf56fc0c66db97b62fec6dde290828557a10b0dc7 剩余140个 https://testnet.narwhal.finance/staking
async function main() {
  let wallets = await db.get_common_airdroip_tasks('zama');//monad_fault
  await cryptoService.init();

  // const signAddress = "0x30438C1Abe7426Db6e8B50f5fD83c414B7b1FeFd";
  // const senderWallet = wallets.filter(wallet => (signAddress == wallet.eth_wallet_address));
  // if(senderWallet.length == 0){
  //   console.log('cannot find the sender!')
  //   return
  // }
  console.log(wallets.length)

  const privateKey = "0x4c98077ea1e4e6164321b6bfbf4ed3c00467d690f646d41a70d54b339ad3d215";

  wallet = new ethers.Wallet(privateKey, provider);
  // wallets.push({
  //   "eth_wallet_address":"0xd085b649e0249d0aaacb9d74e3230bc19b8b055e",
  // })
// 0x3c2cbCFC7E838d228DD39bd4C3D03A9eEfcf29AD----0x4c98077ea1e4e6164321b6bfbf4ed3c00467d690f646d41a70d54b339ad3d215----produce advice piece public bubble shift pony pioneer invite plunge ankle extra
  // const ids = ["0x11Dd10a295d37Ea916c7870Df2355e3b61bF2Ba3"];//0x8c091a48ed82f24698bee5c39dd0053fba5a33b2
  // wallets = wallets.filter(wallet => (ids.includes(wallet.eth_wallet_address)));
  await randomExecute(wallets, mint, 3000  * wallets.length);
    
}


// okx12_3. 1
// okx12_8.  22
// okx12_13 
// okx12_15 12
// okx12_16 1
// okx12_18. 1

main().catch(console.error);