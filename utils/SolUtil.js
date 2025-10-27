const solc = require('solc');
// const chalk = require("chalk");
const {logger} = require('../../common2/util/logger');
const { VersionedTransaction, Keypair,PublicKey, Connection } = require('@solana/web3.js');
const bip39 = require('bip39');
const { TOKEN_PROGRAM_ID, getAccount } = require( '@solana/spl-token');
const { derivePath } = require('ed25519-hd-key');

class SolUtil{

    static mnemonicToKeypair(mnemonic, accountIndex = 0) {
      if (!bip39.validateMnemonic(mnemonic)) {
        throw new Error('无效的助记词');
      }
      
      const seed = bip39.mnemonicToSeedSync(mnemonic, '');
      const path = `m/44'/501'/${accountIndex}'/0'`;
      const derivedSeed = derivePath(path, seed.toString('hex')).key;
      
      return Keypair.fromSeed(derivedSeed);
    }

    // 获取SOL余额
    static async getSOLBalance(publicKey, connection) {
        const balance = await connection.getBalance(publicKey);
        return balance / 1e9; // 转换为SOL    
    }

    static async getTokenBalance(
      owner,          // 钱包地址
      tokenContract,           // 代币地址
      connection
    ) {
      // 1. 找到关联代币账户（ATA）
      const [ata] = PublicKey.findProgramAddressSync(
        [
          new PublicKey(owner).toBuffer(),
          TOKEN_PROGRAM_ID.toBuffer(),
          new PublicKey(tokenContract).toBuffer(),
        ],
        new PublicKey('ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL')
      );

      // // 2. 读余额
      // const info = await getAccount(connection, ata);
      // console.log(info);
      // return info.amount.toString(); // 原始数量（含小数位）

      // 2. 直接读链上数据
      const accInfo = await connection.getParsedAccountInfo(ata);
      if (!accInfo.value) throw new Error('ATA not found');
        // amount: '1',
        // decimals: 6,
        // uiAmount: 0.000001,
        // uiAmountString: '0.000001'
      return accInfo.value.data.parsed.info.tokenAmount;
    }

    static async sendTransaction(signerWallet, swapTransaction, connection, needCheck = true){
        // Buffer.from() 是一个在 Node.js 中非常核心和常用的方法，主要用于将不同类型的数据（如字符串、数组）转换成一个 Buffer 对象。
        // Buffer 对象是 Node.js 用于处理二进制数据的一种方式。你可以把它想象成一个存放原始字节数据的内存区域。 在与区块链（如 Solana）或任何需要进行底层二进制数据操作的系统交互时，Buffer 至关重要。
        // 4. 签署交易 (模拟时，交易通常需要签名，以便 RPC 节点可以验证其完整性) [1]
        // 注意：这里用 payer 签名是为了模拟验证，真实发送时用户会通过钱包签名。
        const transaction = VersionedTransaction.deserialize(Buffer.from(swapTransaction, 'base64'));
        transaction.sign([signerWallet]);

        if(needCheck){
            const {success, message} = await SolUtil.validateTransaction(connection, transaction, signerWallet);
            if(!success){
                return {
                    success : false,
                    message
                }
            }
        }

        const txHash = await connection.sendRawTransaction(transaction.serialize(), {
                skipPreflight: true,
                preflightCommitment: 'processed',
                maxRetries: 5
            });

        const txResult = await connection.confirmTransaction(txHash);
        return {
            txHash,
            txResult,
            success : true
        }
    }

    static async validateTransaction(connection, transaction, payer) {
        try {
            // 5. 模拟交易 [3, 12, 13]
            const simulationResult = await connection.simulateTransaction(transaction, {
                commitment: 'confirmed',
                sigVerify: true, // 验证签名 [13]
                // replaceRecentBlockhash: true // 对于 VersionedTransaction 除非有特殊需求，否则通常不需要
            });


            if (simulationResult.value.err) {
                if (typeof simulationResult.value.err === 'string') {
                    return {
                        message:`错误字符串 ${simulationResult.value.err}`,
                        success:false
                    }
                } else if (simulationResult.value.err && 'InstructionError' in simulationResult.value.err) {
                    return {
                        message:`指令错误 ${simulationResult.value.err.InstructionError}`,
                        success:false
                    }
                }
                return {
                    message:`Jupiter Swap 交易模拟失败 ${simulationResult.value.err}`,
                    success:false
                }
            } else {
                // console.log("Jupiter Swap 交易模拟成功！");
                // console.log("消耗的计算单元:", simulationResult.value.unitsConsumed);
                if (simulationResult.value.logs) {
                    // console.log("交易日志:");
                    // simulationResult.value.logs.forEach(log => console.log(`  ${log}`));
                }
                return {
                    success:true
                }
            }
        } catch (error) {
            console.error("模拟交易时发生网络或客户端错误:", error);
            return {
                message:`模拟交易时发生网络或客户端错误 ${error}`,
                success:false
            }
        }
    }

    
}



module.exports = {
  SolUtil
};
