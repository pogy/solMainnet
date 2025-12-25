const inquirer = require('inquirer');
const chalk = require('chalk');
const { TokenUtil } = require('../../utils/TokenUtil');


const {CryptoService} = require('../../../common2/util/CryptoUtil');
const {randomExecute} = require('../../../common2/util/schedule');
const {DB} = require('../../../common2/util/db');
const {sleep, getRandomInt} = require('../../../common2/util/common');
const {MathUtil} = require('../../../common2/util/MathUtil');


const {logger} = require('../../../common2/util/logger');
const {getProxy} = require('../../../common2/proxy/proxy');
const {JupiterManager} = require('./manager/JupiterManager');
const {SOL_CONTRACT, USDC_CONTRACT, USDT_CONTRACT, JUP_CONTRACT, JLP_CONTRACT, GEOD_CONTRACT} = require('../../config/TokenConfig');



const db = new DB();
const cryptoService = new CryptoService();

// 0.008MON
async function execute(task){
  const title = ` [Jupiter-${task.task_id}-${task.sol_wallet_address} ]`;

  logger.info(chalk.green(` ${title} start`));
  let manager ;
  try{
    manager = new JupiterManager(task.privateKey, task.proxy ? task.proxy.proxyUrl :null);
    
    for(var i=0; i<2+getRandomInt(3); i++){
        const balance = await manager.getSOLBalance();//有时获取不到准确余额
        logger.log(` ${title} balance: ${balance} SOL` );
        if(balance < 0.01){
          logger.log(` ${title} lace of sol. balance: ${balance} SOL` );
          return;
        }else if(balance > 0.03){
          await manager.swapSOLToUSDC(MathUtil.floor((balance-0.02) * 0.7, 3), 100);
        }else{
          const tokenAmount = await manager.getTokenBalance(USDC_CONTRACT);
          if (tokenAmount.uiAmount < 1) {      
            logger.info(chalk.red(` Jupiter swap fail! lack of USDC balance ${tokenAmount.uiAmount} < 1`));
            return;
          }
          let amount = Math.floor(tokenAmount.uiAmount);

          await manager.swapUSDCToSOL(amount > 0 ? amount : 1, 100); 
        }

        await sleep(getRandomInt(3000)+30000)
    }
  }catch(error){
     console.log(error)
     const balance = await manager.getSOLBalance();
     logger.log(` ${title} balance: ${balance} SOL` );
     logger.error(error, chalk.red(`⚠️  Error ${title} : ${error}\n`));
  }
}

async function swapForSol(title, manager){
  let targetTokens = [USDT_CONTRACT, USDC_CONTRACT, JUP_CONTRACT, JLP_CONTRACT, GEOD_CONTRACT];
  let tokenAmount;
  for (let item of targetTokens){
    tokenAmount = await manager.getTokenBalance(item);//有时获取不到准确余额
    if(tokenAmount.uiAmount > 0.3){
      logger.log(` ${title} balance: ${tokenAmount.uiAmount} JLP` );
      await manager.swap(item, SOL_CONTRACT,  MathUtil.floor(tokenAmount.uiAmount, 2), 100);
      await sleep(getRandomInt(3000)+30000);
    }
  }
}

async function execute2(task){
  const title = ` [Jupiter-${task.task_id}-${task.sol_wallet_address} ]`;

  logger.info(chalk.green(` ${title} start`));
  let manager ;
  try{
    manager = new JupiterManager(task.privateKey, task.proxy ? task.proxy.proxyUrl :null);
    let tokenAmount;

    for(var i=0; i< 50 + getRandomInt(30); i++){
        const balance = await manager.getSOLBalance();//有时获取不到准确余额
        logger.log(` ${title} balance: ${balance} SOL` );
        if(balance < 0.01){
          logger.log(` ${title} lace of sol. balance: ${balance} SOL` );
          await swapForSol(title, manager);
          return;
        }

        tokenAmount = await manager.getTokenBalance(GEOD_CONTRACT);//有时获取不到准确余额
        logger.log(` ${title} balance: ${tokenAmount.uiAmount} GEOD` );
        if(tokenAmount.uiAmount > 1){
          await manager.swap(GEOD_CONTRACT, USDC_CONTRACT, MathUtil.floor(tokenAmount.uiAmount, 1), 100);
          await sleep(getRandomInt(3000)+30000)
          continue;
        }

        tokenAmount = await manager.getTokenBalance(JUP_CONTRACT);//有时获取不到准确余额
        logger.log(` ${title} balance: ${tokenAmount.uiAmount} JUP` );
        if(tokenAmount.uiAmount > 1){
          await manager.swap(JUP_CONTRACT, USDC_CONTRACT, MathUtil.floor(tokenAmount.uiAmount, 1), 100);
          await sleep(getRandomInt(3000)+30000)
          continue;
        }

        tokenAmount = await manager.getTokenBalance(JLP_CONTRACT);//有时获取不到准确余额
        logger.log(` ${title} balance: ${tokenAmount.uiAmount} JLP` );
        if(tokenAmount.uiAmount > 0.1){
          await manager.swap(JLP_CONTRACT, USDC_CONTRACT,  MathUtil.floor(tokenAmount.uiAmount, 2), 100);
          await sleep(getRandomInt(3000)+30000);
          continue;
        }

        tokenAmount = await manager.getTokenBalance(USDT_CONTRACT);//有时获取不到准确余额
        logger.log(` ${title} balance: ${tokenAmount.uiAmount} JLP` );
        if(tokenAmount.uiAmount > 0.1){
          await manager.swap(USDT_CONTRACT, USDC_CONTRACT,  MathUtil.floor(tokenAmount.uiAmount, 2), 100);
          await sleep(getRandomInt(3000)+30000);
          continue;
        }

        tokenAmount = await manager.getTokenBalance(USDC_CONTRACT);//有时获取不到准确余额
        logger.log(` ${title} balance: ${tokenAmount.uiAmount} USDC` );
        if(tokenAmount.uiAmount > 1){
          await manager.swap(USDC_CONTRACT, USDT_CONTRACT,  MathUtil.floor(tokenAmount.uiAmount, 1), 100);
          await sleep(getRandomInt(3000)+30000);
          continue;
        }

        if(balance > 0.02){
          await manager.swap(null, USDC_CONTRACT, MathUtil.floor((balance-0.015) * 0.7, 3), 100);
          await sleep(getRandomInt(3000)+30000);
        }
    }
  }catch(error){
     console.log(error)
     const balance = await manager.getSOLBalance();
     logger.log(` ${title} balance: ${balance} SOL` );
     logger.error(error, chalk.red(`⚠️  Error ${title} : ${error}\n`));
  }
}

function getInfo(){
  const TEST = "cram town couple lottery dove celery region new nesta notable frown elite";

  const manager = new JupiterManager(TEST, "http://C94CEC90972EE3B0-residential-country_SG-r_10m-s_DVRMeFhlIC:monad-expensive@gate.nstproxy.io:24125");
  console.log(manager.getWalletAddress());
  let privateKey = manager.getPrivateKey();
  console.log(privateKey);
  console.log(cryptoService.encryptData(privateKey))
}

async function init(tasks){
  for(let task of tasks){
    try{
      if(task.sol_wallet_address != '6yzifBy4HA56bnD42yKHLCqmvCd8kE2rw2sTwRLPuXwu'){
        continue;
      }

      task.privateKey = cryptoService.decryptData(task.sol_wallet_private);
      const manager = new JupiterManager(task.privateKey, "http://C94CEC90972EE3B0-residential-country_SG-r_10m-s_DVRMeFhlIC:monad-expensive@gate.nstproxy.io:24125");
      task.sol_wallet_address = manager.getWalletAddress();
        console.log(task)

      task.balance = (await manager.getSOLBalance());
      await db.update_common_airdroip_task(task);
      console.log(task.sol_wallet_address)
    }catch(error){
       console.log(error)
       console.log(task)
    }
  }
}

async function main() {
  let tasks = await db.get_common_airdroip_tasks('seeker');
  await cryptoService.init();
  // await getInfo()
  // return

  // await init(tasks)
  // return;

  // const ids = ["DJF4wDhiYW7paNhnEmkWhSKJZq8iqVGhX95WoEHZTRv"];
  // tasks = tasks.filter(task => (ids.includes(task.sol_wallet_address)));

  for(let task of tasks){
    task.privateKey = cryptoService.decryptData(task.sol_wallet_private);
    // task.proxy = await getProxy("C94CEC90972EE3B0", "SG", "10", task.sol_wallet_address);
    
    // gate.nstproxy.io:24125:C94CEC90972EE3B0-residential-country_SG-r_10m-s_oNm6SC7J8q:monad-expensive
    // http://[username:password@]host:port
    // task.proxy = {'proxyUrl' :  'http://127.0.0.1:7890'};
    // task.proxy = {'proxyUrl' :  'http://C94CEC90972EE3B0-residential-country_SG-r_10m-s_oNm6SC7J8q:monad-expensive@gate.nstproxy.io:24125'};
  }

  while(true){
      await randomExecute(tasks, execute2, 60000 * 4 * tasks.length);
      await sleep(60000  * 60 * 8);
  }
  
}

// 0x3D3f7d001280267505862eEBcB6df2bBFf06Caed

main().catch(err => {
  logger.log(chalk.red(`❌ ${err}`));
});