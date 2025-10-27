/**
 * 
 * https://app.crystal.exchange/leaderboard
 * **/
const inquirer = require('inquirer');
const chalk = require('chalk');
// const { ethers, BigNumber } = require('ethers');


const {randomExecute} = require('../../../common2/util/schedule');
const {DB} = require('../../../common2/util/db');
const {logger} = require('../../../common2/util/logger');
const {sleep, getRandomInt} = require('../../../common2/util/common');
const {BackpackService} = require('./service/BackpackService');
const { RPC_URL, TX_EXPLORER, CHAIN_ID } = require("../../utils/chain");
const {getProxy} = require('../../../common2/proxy/proxy');


const db = new DB();



// 0.008MON. 91183.33952050407 2000 ->4000 
async function swapForBestPendingOrder(task){
  const service = new BackpackService(task.param1, task.param2, false, task);

  service.post('/api/v1/order', {
    orderType: 'Market',
    quoteQuantity: '5',
    side: 'Bid',
    symbol: 'BTC_USDC'
  })
  .then((result) => {
    console.log('Response:', result)
  })
  return;

  const {status, message} = await service.prepareTargetBalance(1);
  if(status!=1){
     logger.info(chalk.red(`[crystal- ${task.wallet_index}- ${task.eth_wallet_address}]  Error  ${message}`));
     return;
  }

  try{
    await sellAprMon(service, task);

    const token0 = ERC_WMON; 
    const token1 = ERC_USDC;

    let isList = false;

    logger.info(chalk.gray(`${task.wallet_index}   start list order`));
    let token0Balance = await EthUtil.getTokenBalance(token0, task.eth_wallet_address, provider);
  
    if(token0Balance.format > 3){
      logger.info(chalk.green(`${task.wallet_index}  ${token0Balance.format} WMON start list order`));
      isList = true;
      await service.createBestPendingOrder(token0, token1, String(Math.floor(token0Balance.format)));
    }

    let token1Balance = await EthUtil.getTokenBalance(token1, task.eth_wallet_address, provider);
   
    if(token1Balance.format > 8){
      logger.info(chalk.green(`${task.wallet_index} ${token1Balance.format} USDC start list order`));
      isList = true;
      await service.createBestPendingOrder(token1, token0, String(Math.floor(token1Balance.format) - 5));
    }

    if(getRandomInt(6) == 1){// 没隔一分钟清理一次挂单
        await service.cancelOutOrder();
    }

    // task.balance = (await EthUtil.getBalance(task.eth_wallet_address, provider)).format;
    // await db.update_common_airdroip_task(task);
  }catch(error){
     logger.error(error, chalk.red(`⚠️${task.wallet_index}   Error swapForLeaderboard with wallet ${task.eth_wallet_address}: ${error.message}\n`));
  }
}

// async function swapForWin(task){
//   const service = new CrystalService(RPC_URL, CHAIN_ID, TX_EXPLORER, task);
//   const {status, balance, message} = await service.prepareTargetBalance(1);
//   if(status!=1){
//      logger.info(chalk.red(`⚠️${task.wallet_index}   Error ${message}`));
//      return;
//   }
//   try{
//     await sellAprMon(service, task);

//     const token0 = ERC_WMON; 
//     const token1 = ERC_USDC;

//     let isList = false;

//     logger.info(chalk.gray(`${task.wallet_index}   start list win order`));
//     let token0Balance = await EthUtil.getTokenBalance(token0, task.eth_wallet_address, provider);
  
//     if(token0Balance.format > 3){
//       logger.info(chalk.green(`${task.wallet_index}  ${token0Balance.format} WMON start list order`));
//       isList = true;
//       await service.createBestSpaceOrder(token0, token1, String(Math.floor(token0Balance.format)));
//     }

//     let token1Balance = await EthUtil.getTokenBalance(token1, task.eth_wallet_address, provider);
   
//     if(token1Balance.format > 8){
//       logger.info(chalk.green(`${task.wallet_index} ${token1Balance.format} USDC start list order`));
//       isList = true;
//       await service.createBestSpaceOrder(token1, token0, String(Math.floor(token1Balance.format)-5));
//     }

//     // 没隔一分钟清理一次挂单
//     await service.cancelOutOrder(false);
    
//     // task.balance = (await EthUtil.getBalance(task.eth_wallet_address, provider)).format;
//     // await db.update_common_airdroip_task(task);
//   }catch(error){
//      logger.error(error, chalk.red(`⚠️${task.wallet_index}   Error swapForLeaderboard with wallet ${task.eth_wallet_address}: ${error.message}\n`));
//   }
// }

// const referrals = ["pogy", "jingfeng"]

// // 0.008MON. 91183.33952050407 2000 ->4000 
// async function initAccount(task){
//   try{
//     const service = new CrystalService(RPC_URL, CHAIN_ID, TX_EXPLORER, task);

//     await service.setReferral();
//     await service.setUsername();

//     // task.balance = (await EthUtil.getBalance(task.eth_wallet_address, provider)).format;
//     // await db.update_common_airdroip_task(task);
//   }catch(error){
//      logger.error(error, chalk.red(`⚠️${task.wallet_index}   Error claim with wallet ${task.eth_wallet_address}: ${error.message}\n`));
//   }
// }

// async function sellAprMon(service, task){
//   try{
//     const token0 = ERC_WMON;
//     const token1 = ERC_APRMON;

//     let isList = false;

//     logger.info(chalk.gray(`${task.wallet_index}   start list order`));
//     let listAmount;
//     let token1Balance = await EthUtil.getTokenBalance(token1, task.eth_wallet_address, provider);
   
//     if(token1Balance.format > 3){
//       listAmount = parseInt(Number(token1Balance.format) - 2);
//       logger.info(chalk.green(`${task.wallet_index} ${token1Balance.format} ERC_APRMON start list ${listAmount}  order`));
//       isList = true;
//       await service.createBestPendingOrder(token1, token0, String(listAmount));
//     }
//   }catch(error){
//      logger.error(error, chalk.red(`⚠️${task.wallet_index}   Error sellAprMon with wallet ${task.eth_wallet_address}: ${error.message}\n`));
//   }
// }



async function main() {

  let tasks = await db.get_common_airdroip_tasks('backpack');
  // const ids =["0xf56fc0c66DB97b62FEc6DdE290828557A10B0DC7","0x662D9983823563472375C06361F90aF7B631404C","0x8C091A48ed82F24698bee5C39dd0053Fba5A33B2","0x30438C1Abe7426Db6e8B50f5fD83c414B7b1FeFd","0x00bb372787C0dcdE102d3254fbd69C9B7024df2E","0x11A3a6fe01AB6022e7904D336FfE18A4362E004A","0x674c36868118b3af2e5DCd3978Ee1a0276501764","0xF4151ca83fC7eeEf072A3C8386B65D1dc70baE33","0x6Dd48d4B0D4E793e67B5C1edF253C063f23Bc018","0x1Ad9056Df2A8dD32EF82896d8ea1C579E2B5B086","0x8A032c847C3b93D19dE12eF80E474B04b506BCb8","0xc209163bbEcA0fBf539D234CEC56fEc954031FB3","0x8C091A48ed82F24698bee5C39dd0053Fba5A33B2","0xd0Dcd639e135E4C329238Cb7146F82220B5d2343","0x6e47F2D9a9F3a3004eAd3bD21Df732C97670BbF4","0xe3A9DDE402D477eedC84dEbed414D2137698002B","0x84013bfCE81D644b7dF3293A2aEAE857f2120918","0x24F9095b89384E2f38b36455393FfFf9798a5dbf","0xd759Df704cd7fd2EcA8a7c9f8595CA67Cc9c4242","0x180A5b233ce0a9F55f034572f2A74C2A3a37A96F","0xE8201617Bd2503E9cC0e076093063dD09E865Cf2","0xEC96D0ef79Bc3c764a7E024D72D2E5970f02CB3E","0xcD39af92a3a98f9295066A001fcDBf93C25cACFc"];//0xF482759c8d3F1B42Fff283E61d63A1C52fe1907b
  const ids =[]
  if(ids.length>0)
    tasks = tasks.filter(task => (ids.includes(task.eth_wallet_address)));

  for(let task of tasks){
    task.proxy = await getProxy("80F5E3B4A6CE40EE", "HK", "10", task.email);
    // {
    //           protocol: 'http',
    //           host: '127.0.0.1',
    //           port: 8888
    //         }
  }
  // console.log(matchTasks.length, dailyTasks.length)
  
  while(true){
    await randomExecute(tasks, swapForBestPendingOrder, 3000 * tasks.length);

    await sleep(3600000 * 4);
  }
}

// 0x3D3f7d001280267505862eEBcB6df2bBFf06Caed

main().catch(err => {
  logger.log(chalk.red(`❌ ${err}`));
});