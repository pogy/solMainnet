const { ethers } = require("ethers");
const fs = require('fs');
const path = require('path');

const colors = require('colors');
const solc = require('solc');
const {CryptoService} = require('../../common2/util/CryptoUtil');
const {EthUtil} = require('../../common2/web3/EthUtil');
const {logger} = require('../../common2/util/logger');


// const account = web3.eth.accounts.privateKeyToAccount('YOUR_PRIVATE_KEY');
// web3.eth.accounts.wallet.add(account);
// web3.eth.defaultAccount = account.address;

// 读取编译后的合约字节码和ABI
// const bytecode = fs.readFileSync(path.join(__dirname, 'build/SimpleTransfer.bin')).toString();
// const abi = JSON.parse(fs.readFileSync(path.join(__dirname, 'build/SimpleTransfer.abi')).toString());

// 连接到Base链节点
const RPC_URL = "https://eth.llamarpc.com";
const CHAIN_ID = 1;
const TX_EXPLORER = "https://etherscan.io/tx/";

const cryptoService = new CryptoService();
const contractsPath = path.resolve(__dirname, 'contracts.sol');
const source = fs.readFileSync(contractsPath, 'utf8');
const {randomExecute} = require('../../common2/util/schedule');


const {DB} = require('../../common2/util/db');
const {sleep, getRandomInt, roundToDecimals, hashCode} = require('../../common2/util/common');
const UNISWAP_CONTRACT = "0x000000000022d473030f116ddee9f6b43ac78ba3";

const ERC_USDT = "0xdAC17F958D2ee523a2206206994597C13D831ec7";
const ERC_USDC = "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48";
const ERC_WBTC = "0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599";
const ERC_DAI  = "0x6B175474E89094C44Da98b954EedeAC495271d0F";
const ERC_UNI  = "0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984";
const ERC_LINK = "0x514910771AF9Ca656af840dff83E8264EcF986CA";
const ERC_LDO  = "0x5A98FcBEA516Cf06857215779Fd812CA3beF1B32";
const ERC_AAVE = "0x7Fc66500c84A76Ad7e9c93437bFc5Ac33E2DdAE9";
const ERC_MKR  = "0x9f8F72aA9304c8B593d555F12eF6589cC3A579A2";
const ERC_SHIB = "0x95aD61b0a150d79219dCF64E1E6Cc01f0B64C4cE";
const ERC_COMP = "0xc00e94Cb662C3520282E6f5717214004A7f26888";
const ERC_SUSHI= "0x6B3595068778DD592e39A122f4f5a5Cf09C90fE2";
const ERC_MATIC= "0x7d1afa7b718fb893db30a3abc0cfc608aacfebb0";
const ERC_ENJ  = "0xf629cbd94d3791c9250152bd8dfbdf380e2a3b9c";
const ERC_BAT  = "0x0d8775f648430679a709e98d2b0cb6250d2887ef";


const db = new DB();
class WalletBase{
  provider;
  signerWallet;
  routerContract;
  chainId;
  TX_EXPLORER;
  contractData;

  /**
   * buy nft
   * @param {string} providerUrl - rpc url
   * @param {string} adminPrivateKey -  operation wallet 
   * @param {string} agentAddress -  agent router Address
   * @param {json} task - task data
   */
  constructor(rpcUrl, chainId, TX_EXPLORER, privateKey) {
    this.provider = new ethers.providers.JsonRpcProvider(rpcUrl);
    this.signerWallet = new ethers.Wallet(privateKey, this.provider);
    this.chainId = chainId;
    this.TX_EXPLORER = TX_EXPLORER;
    // this.contractData = this.compileContract()
  }

  async compileContract (){
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

  async deploy () {
    // Get all contract names from the compilation output
    const contractABI = this.contractData.abi;
    const contractBytecode = this.contractData.evm.bytecode.object;

    logger.log(chalk.cyan('✅ Contract Has been compiled.Preparing Deployment..'));

    const gasCost = await EthUtil.getCostGas(this.provider)

    // Set a random gasLimit between 150,000 and 250,000
    gasCost.gasLimit = Math.floor(Math.random() * (250000 - 150000 + 1)) + 350000;

    const factory = new ethers.ContractFactory(
      contractABI,
      contractBytecode,
      this.signerWallet
    );

    // 获取部署交易数据
    const deployTx = factory.getDeployTransaction(/* 构造参数 */);

    // 预估 gas
    const gasLimit = await this.provider.estimateGas({
      ...deployTx,
      from: this.signerWallet.address, // 必须加上 from 字段
    });
    console.log("预估gas:", gasLimit.toString());
    gasCost.gasLimit = ethers.BigNumber.from(Math.floor(Number(gasLimit) + Number(gasLimit) * 10/100));//459474;

    // Deploy the contract using its constructor arguments
    const contract = await factory.deploy(gasCost);

    logger.log(chalk.yellow(`🚀 Deploy Tx Sent! - ${contract.address}`));

    await contract.deployed();

    logger.log(chalk.yellow(`[${this.signerWallet.address}] deployed Contract at address: ${contract.address} `));
    return contract.address;
  }

  async transfer(to, amount){
    const contract = new ethers.Contract(this.contractAddress, this.contractData.abi, this.signerWallet);
    console.log(this.signerWallet.address, '->',  to, 'amount', amount);

    const gasCost = await EthUtil.getCostGas(this.provider);

    const value = ethers.utils.parseEther(amount.toString()); // Amount in token's smallest unit

    console.log("Executing transfer...");
    const baseNonce = await provider.getTransactionCount(wallet.address, "pending");

    const gasLimit = await contract.estimateGas.transfer(to);
    gasCost.gasLimit = ethers.BigNumber.from(Math.floor(Number(gasLimit) + Number(gasLimit) * 10/100));//459474;

    const tx = await contract.transfer(to, gasCost);
    let result =  await tx.wait();
    console.log('Transfer transaction receipt:', result.blockNumber, 'amount ', amount, 'ETH', to);
  }

  async approve(){
    await EthUtil.approveToken(this.signerWallet, 1, ERC_USDC, UNISWAP_CONTRACT);//0.39
    await EthUtil.approveToken(this.signerWallet, 1, ERC_USDT, UNISWAP_CONTRACT);//0.39
    await EthUtil.approveToken(this.signerWallet, 0.000001, ERC_WBTC, UNISWAP_CONTRACT);//0.39
  }

}

async function execute(task) {
  try{
    // if(task.param3 != 1){
    //     console.log(task.wallet_index, task.eth_wallet_address, 'status end');
    //     return;
    // }
    const privateKey = cryptoService.decryptData(task.eth_wallet_private);

    const provider = new ethers.providers.JsonRpcProvider(RPC_URL);
    const balance = await EthUtil.getBalance(task.eth_wallet_address, provider);
    if(Number(balance.format) < 0.0301){
      task.param3 = 5;
      await db.update_common_airdroip_task(task);
      console.log(task.wallet_index, task.eth_wallet_address, 'lack of balance end', balance.format);
      return
    }

    console.log(task.wallet_index, task.eth_wallet_address, 'task start');
    const service = new WalletBase(RPC_URL, CHAIN_ID, TX_EXPLORER, privateKey);
    await service.approve();
    console.log(task.wallet_index, task.eth_wallet_address, 'task sucess');
    task.param3 = 3;
    await db.update_common_airdroip_task(task);
  }catch(err){
    console.log(err)
  }
}

let wallet;

async function main() {
  let wallets = await db.get_common_airdroip_tasks('monad');
  await cryptoService.init();

  const ids = ["0x96A50327Ea85cB028CFa52c36525731A0dA5c607"];
  wallets = wallets.filter(wallet => (ids.includes(wallet.eth_wallet_address)));
    
  await randomExecute(wallets, execute, 5000  * wallets.length);
    
}


main().catch(console.error);