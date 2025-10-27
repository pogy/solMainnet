const {DB} = require('../../common2/util/db');
const {getBalance} = require('../../common2/web3/okx_eth');
const {randomExecute} = require('../../common2/util/schedule');
const {RPC_URL} = require('./chain');
const {logger} = require('../../common2/util/logger');
const {getAddressUper} = require('../../common2/web3/okx_eth');


const db = new DB();

const {CryptoService} = require('../../common2/util/CryptoUtil');

const cryptoService = new CryptoService();

async function execute(wallet){
    // console.log(wallet.eth_wallet_address)
    // if(wallet.balance > 0.3){
    //     return
    // }
    // if("0x365197d33a0D56Ef625a232d5b41b1c71586045d" != wallet.eth_wallet_address){
    //     return
    // }

    logger.log('start task' + wallet.eth_wallet_address, wallet.eth_wallet_address == '0xe3A9DDE402D477eedC84dEbed414D2137698002B');

    try{
        if(wallet.eth_wallet_private){
            wallet.eth_wallet_address = getAddressUper(cryptoService.decryptData(wallet.eth_wallet_private));//区分大小写
        }
        
        wallet.balance = await getBalance(wallet.eth_wallet_address, RPC_URL);
        if(!wallet.balance){
            console.log('fail search' + wallet.eth_wallet_address);
            return;
        }
        wallet.balance = parseFloat(wallet.balance);
        await db.update_common_airdroip_task(wallet);

        logger.log('success task' + wallet.eth_wallet_address, wallet.balance);
    }catch(err){
        logger.error(err, wallet.eth_wallet_address)
    }
    
}


const main = async () => {
    let wallets = await db.get_common_airdroip_tasks('monad');
    await cryptoService.init();

    await randomExecute(wallets, execute, 600 * 3);
};

main();
