

const TOKEN_TO_MON = {
  ERC_USDT: 0.32,
  ERC_CHI: 0,
  ERC_MAX: 0,
  ERC_MIST: 0.0004,
  ERC_MCA: 0,
  ERC_muBOND: 0.9,
  ERC_RWAGMI: 0,
  ERC_ETH: 0,
  ERC_TED: 0.000805414,
  ERC_KB: 0,
  ERC_USDC: 0.32,//不加流动性
  ERC_DAK: 0.45,
  ERC_YAKI: 0.0026,
  ERC_CHOG: 0.035,
  ERC_aprMON: 0.995932,//不加流动性
  ERC_shMON: 1.00006,
  ERC_WMON: 1.15,
  ERC_GMON: 0.999514,

  W_SOL:130,
  W_ETH:2251,
  W_BTC:87278,
  ERC_MOON:0.000006,
  ERC_OWL:0.0000213066,
  ERC_BEAN:0.247586,
  ERC_JAI:0.0000482524,
  ERC_MONAI:0.00280389,
  ERC_REAL:0.0000396474,
  // ERC_SOCERC_SOC:0,
  ERC_FEEDMONAD:0.00448588,
  ERC_suUSD:0.460654,
  ERC_MAD:0
};

class TokenUtil{

  static isExist(tokenAddress){
    // 遍历所有枚举值
    for (const key in TOKEN_EMUNS) {
      if(TOKEN_EMUNS[key] == tokenAddress){
        return true;
      }
    }
  }

  static getRandom() {
    const values = Object.values(TOKEN_EMUNS);
    return values[Math.floor(Math.random() * values.length)];
  }

  static getTokenAddress(key) {
    return TOKEN_EMUNS[key];
  }

  static getAllTokens() {
    return Object.values(TOKEN_EMUNS);
  }

  static getTokenValue(tokenAddress, balanceHuman){
    for (const key in TOKEN_EMUNS) {
      if(TOKEN_EMUNS[key] == tokenAddress){
        return TOKEN_TO_MON[key] * Number(balanceHuman)/TOKEN_TO_MON["ERC_USDC"];
      }
    }
    return 0;
  }

  static parseMon(tokenAddress, balanceHuman){
    for (const key in TOKEN_EMUNS) {
      if(TOKEN_EMUNS[key] == tokenAddress){
        return TOKEN_TO_MON[key] * Number(balanceHuman);
      }
    }
    return 0;
  }

  static getRate(token0Address, token1Address){
    let token0Usdt,token1Usdt;
    for (const key in TOKEN_EMUNS) {
      if(TOKEN_EMUNS[key] == token0Address){
        token0Usdt = TOKEN_TO_MON[key];
      }else if(TOKEN_EMUNS[key] == token1Address){
        token1Usdt = TOKEN_TO_MON[key];
      }
    }
    return token0Usdt/token1Usdt;
  }

}

module.exports = {
  TokenUtil
};