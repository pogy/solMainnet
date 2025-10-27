// 钱包工具函数集合
const WalletUtils = {
  // 从助记词创建钱包
  createFromMnemonic: function(mnemonic, accountIndex = 0) {
    return safeConvertMnemonic(mnemonic, accountIndex);
  },
  
  // 生成新钱包
  generateNew: function() {
    const mnemonic = bip39.generateMnemonic(256);
    const keypair = mnemonicToKeypair(mnemonic, 0);
    
    return {
      mnemonic: mnemonic,
      keypair: keypair,
      publicKey: keypair.publicKey.toBase58(),
      words: mnemonic.split(' ')
    };
  },
  
  // 检查助记词有效性
  checkMnemonic: function(mnemonic) {
    try {
      const cleaned = mnemonic.trim().toLowerCase().replace(/\s+/g, ' ');
      const words = cleaned.split(' ');
      
      return {
        valid: bip39.validateMnemonic(cleaned),
        wordCount: words.length,
        expectedCount: 24,
        message: words.length === 24 ? 
          (bip39.validateMnemonic(cleaned) ? '助记词有效' : '助记词格式错误') :
          `需要24个单词，当前${words.length}个`
      };
    } catch (error) {
      return {
        valid: false,
        error: error.message
      };
    }
  },
  
  // 批量转换地址
  batchConvert: function(mnemonic, count = 10) {
    const results = [];
    
    for (let i = 0; i < count; i++) {
      const result = safeConvertMnemonic(mnemonic, i);
      if (result.success) {
        results.push({
          index: i,
          address: result.publicKey,
          path: result.path
        });
      }
    }
    
    return results;
  }
};

module.exports = {
  WalletUtils
};