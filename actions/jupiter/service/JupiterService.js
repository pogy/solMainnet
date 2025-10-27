const { Keypair, Connection, PublicKey, sendRawTransaction, VersionedTransaction } = require('@solana/web3.js');
const bip39 = require('bip39');
const fetch = require('node-fetch');
const { HttpsProxyAgent } = require( 'https-proxy-agent');
const {SolUtil} = require('../../../utils/SolUtil');
const {RPC_URL} = require('../../../config/SolChain');
const {JUPITER_API_CONFIG} = require('../config/JupiterConfig');

const chalk = require('chalk');
const {logger} = require('../../../../common2/util/logger');


// 'https://api.mainnet-beta.solana.com',
//       'https://solana-api.projectserum.com',
//       'https://rpc.ankr.com/solana',
//       'https://solana.public-rpc.com',
//       'https://api.mainnet-beta.solana.com'
// Jupiter 交换类
class JupiterService {
  constructor(proxyUrl) {
    this.connection = new Connection(RPC_URL);
    // 创建一个代理 agent 实例
    if(proxyUrl){
      this.proxyAgent = new HttpsProxyAgent(proxyUrl);
    }
  }

  async getQuote(inputMint, outputMint, amount, slippageBps = 50) {
    const params = new URLSearchParams({
      inputMint,
      outputMint,
      amount: amount.toString(),
      slippageBps: slippageBps.toString(),
      onlyDirectRoutes: 'false',
      asLegacyTransaction: 'false'
    });

    const response = await fetch(`${JUPITER_API_CONFIG}/quote?${params}`, {
      agent: this.proxyAgent,
      headers: {'Connection': 'keep-alive' }
    });
    
    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Jupiter API错误: ${response.status} - ${error}`);
    }
    return await response.json();
  }

  async executeSwap(keypair, inputMint, outputMint, amount, slippageBps = 50) {
    try {
      // 获取报价
      const quote = await this.getQuote(inputMint, outputMint, amount, slippageBps);
      logger.info(chalk.green(`✅ Jupiter getQuote`));

      // 创建交换请求
      const swapRequest = {
        quoteResponse: quote,
        userPublicKey: keypair.publicKey.toString(),
        wrapAndUnwrapSol: true,
        useSharedAccounts: true,
        computeUnitPriceMicroLamports: 'auto'
      };
      // https://lite-api.jup.ag/swap/v1/swap

      const swapResponse = await fetch(`${JUPITER_API_CONFIG}/swap`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Connection': 'keep-alive' },
        body: JSON.stringify(swapRequest),
        agent: this.proxyAgent
      });

      if (!swapResponse.ok) {
        const error = await swapResponse.text();
        logger.info(chalk.red(`Jupiter swap API错误: ${swapResponse.status} - ${error}`));
        throw new Error(`交换API错误: ${swapResponse.status} - ${error}`);
      }

      const swapResult = await swapResponse.json();

      return {
        quote,
        swapTransaction: swapResult.swapTransaction,
        success: true
      };
      
    } catch (error) {
      throw error;
    }
  }
}

module.exports = {
  JupiterService
};