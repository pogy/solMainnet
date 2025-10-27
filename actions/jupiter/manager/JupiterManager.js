const chalk = require('chalk');
const { Connection } = require('@solana/web3.js');

const {logger} = require('../../../../common2/util/logger');
const {SolUtil} = require('../../../utils/SolUtil');
const {RPC_URL, TX_EXPLORER} = require('../../../config/SolChain');

const {JupiterService} = require('../service/JupiterService');
const {SOL_CONTRACT, USDC_CONTRACT} = require('../../../config/TokenConfig');


// 你的代理服务器地址，格式为: http://[username:password@]host:port
// const proxyUrl = 'http://your-proxy-user:your-proxy-password@proxy.example.com:8080';

class JupiterManager {

  constructor(mnemonic, proxyUrl) {
    this.keypair = SolUtil.mnemonicToKeypair(mnemonic, 0);
    this.jupiter = new JupiterService(proxyUrl);
    this.connection = new Connection(RPC_URL);
    this.walletAddress = this.keypair.publicKey.toBase58();
    this.messageTitle = `[Jupiter swap ${this.walletAddress}]`;
  }

  getWalletAddress(){
    return this.walletAddress;
  }
  // 获取SOL余额
  async getSOLBalance() {
    const balance = await SolUtil.getSOLBalance(this.keypair.publicKey, this.connection);
    return balance;
  }

  async getTokenBalance(tokenContract) {
    const balance = await SolUtil.getTokenBalance(this.keypair.publicKey, tokenContract, this.connection);
    return balance;
  }


  // 执行代币交换
  async swapTokens(fromMint, toMint, amount, slippage = 50) {
    try {
      logger.info(chalk.green(`${this.messageTitle} from ${fromMint}  - > ${toMint}, amount ${amount}, 滑点 ${slippage}bps`));

      const result = await this.jupiter.executeSwap(
        this.keypair,
        fromMint,
        toMint,
        amount,
        slippage
      );

      logger.info(chalk.green(`✅  ${this.messageTitle}  ${result.quote.inAmount} ${fromMint}  - > ${result.quote.outAmount} ${toMint}, 
        价格影响: ${result.quote.priceImpactPct}%`));
      return result;
      
    } catch (error) {
      logger.error(chalk.red(`Jupiter swap 失败`), error);
      throw error;
    }
  }

 
  // SOL转USDC示例
  async swapSOLToUSDC(solAmount, slippage = 50) {  
    const tokenAmount = await this.getSOLBalance();
    console.log(tokenAmount,  "tokenAmount");
    if (tokenAmount < solAmount) {      
      logger.info(chalk.red(`${this.messageTitle} fail! lack of SOL balance ${tokenAmount} < ${solAmount}`));
      return;
    }

    // 转换为最小单位 (1 SOL = 1e9 lamports)
    const lamports = Math.floor(solAmount * 1e9);
    
    const {quote, swapTransaction, success} = await this.swapTokens(SOL_CONTRACT, USDC_CONTRACT, lamports, slippage);

    // const {quote,swapTransaction,success} = await this.connection.confirmTransaction(tx);
    if(success){
      const {txHash,txResult, success, message} = await SolUtil.sendTransaction(this.keypair, swapTransaction, this.connection);
      if(success){
        logger.info(chalk.yellow(`✅  ${this.messageTitle} success ${TX_EXPLORER}${txHash}`));
        return {
          txHash,
          txResult,
          success
        }
      }else{
        logger.info(chalk.red(`${this.messageTitle} fail ${message}`));
        return {
          message,
          success
        }
      }
    }else{
      logger.info(chalk.red(`${this.messageTitle} error`));
      return {
        success: false,
        message: 'Jupiter swap error'
      }
    }
  }

  // USDC转SOL示例
  async swapUSDCToSOL(swapAmountHuman, slippage = 50) {
    const tokenAmount = await this.getTokenBalance(USDC_CONTRACT);
    if (tokenAmount.uiAmount < swapAmountHuman) {      
      logger.info(chalk.red(` ${this.messageTitle} fail! lack of USDC balance ${tokenAmount.uiAmount} < ${swapAmountHuman}`));
      return;
    }
    
    // USDC有6位小数
    const microUsdc = Math.floor(swapAmountHuman * Math.pow(10, tokenAmount.decimals));
    
    const {quote, swapTransaction, success} =  await this.swapTokens(USDC_CONTRACT, SOL_CONTRACT, microUsdc, slippage);
    if(success){
      const {txHash,txResult,status} = await SolUtil.sendTransaction(this.keypair, swapTransaction, this.connection);
      console.log(txResult);
      logger.info(chalk.yellow(`✅  ${this.messageTitle} success ${TX_EXPLORER}${txHash}`));
      return {
        txHash,
        txResult,
        success
      }
    }else{
      logger.info(chalk.red(`${this.messageTitle} error`));
      return {
        success: false,
        message: 'Jupiter swap error'
      }
    }
  }
}



module.exports = {
  JupiterManager
};
