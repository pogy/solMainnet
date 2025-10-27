// actions/KuruSwap/scripts/apis.js

const {requestJSONPost, requestGet, requestPut, getMobileUserAgent} = require('../../../../common2/util/commonHttp');
const {logger} = require('../../../../common2/util/logger');


// const POOL = "0x301F38161Dd907b7602c91B8E6303ED6992c0d8E";

// https://api.geckoterminal.com/api/v2/networks/monad-testnet/pools/0x301F38161Dd907b7602c91B8E6303ED6992c0d8E/ohlcv/minute?aggregate=15&limit=96&token=0xf817257fed379853cDe0fa4F97AB987181B1E5Ea

async function ohlcvminute(poolAddress, token, task) {
    const url = `https://api.geckoterminal.com/api/v2/networks/monad-testnet/pools/${poolAddress}/ohlcv/minute?aggregate=15&limit=96&token=${token}`;
    const headers = {
      "User-Agent": task.useragent,
    };
    logger.log(  task.eth_wallet_address, `ohlcvminute `, url);
    return await requestGet(url, headers, task.proxy, task, function(data, task){
            logger.log(  task.eth_wallet_address, `ohlcvminute ✅ `);
            return data;
        }, function(error, task){
            logger.error( task.eth_wallet_address,`ohlcvminute ❌`, error.message);
        });
}


module.exports = {
  ohlcvminute
};
