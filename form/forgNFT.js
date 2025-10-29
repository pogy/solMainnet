const {logger} = require('../../common2/util/logger');
const {requestJSONPost, requestGet, getMobileUserAgent} = require('../../common2/util/commonHttp');
const {getProxy} = require('../../common2/proxy/proxy');


const {randomString, getRandomInt, sleep, read_csv} = require('../../common2/util/common');




function getHeaders(bot_account){
    const headers = {
        'Host': 'prodapi.angelpoop.xyz',
        'accept':'application/json, text/plain, */*',
        'sec-fetch-site': 'same-site',
        'origin': 'https://bot.angelpoop.xyz',
        'accept-encoding': 'gzip, deflate, br',
        'sec-fetch-mode': 'cors',
        'user-agent': bot_account.useragent,
        "accept-language": "zh-CN,zh-Hans;q=0.9",
        'sec-fetch-dest': 'empty',
        'content-type': 'application/json'
    }

    return headers;
}


// {
//     "success": true
// }
async function whitelist(wallet, twitter, bot_account) {
    let url = 'https://foggynft.xyz/api/whitelist.php';
    let data = {
        "wallet": wallet,//"0xf482759c8d3f1b42fff283e61d63a1c52fe1907b",
        "twitter": "@"+ twitter//pogy1201i
    }
   
    return await requestJSONPost(url, getHeaders(bot_account), data, bot_account.proxy, bot_account, function(data, bot_account){
            if(data.success){
                logger.log( bot_account.phone, `whitelist ✅ `);
                return data.data;
            }else{
                logger.log(  bot_account.phone,`whitelist ❌`, data.message);
            }
        }, function(error, bot_account){
            logger.log( bot_account.phone,`whitelist ❌`, error.message);
        });
}

async function execute(bot_account){
    try{
        if(bot_account.is_init == 0){
            logger.log( bot_account.phone, `no init ❌ `);
            return;
        }
        if(!bot_account.useragent){
            bot_account.useragent = getMobileUserAgent();
        }
        if(!bot_account.proxy){
            bot_account.proxy = await getProxy("B7E84542D3080514", "US", "10", bot_account.wallet);
            // {
            //       protocol: 'http',
            //       host: '127.0.0.1',
            //       port: 8888
            //     }
            // await getProxy("B7E84542D3080514", "US", "10", bot_account.phone);
        }
        logger.info(bot_account.wallet, bot_account.twitter, JSON.stringify(bot_account.proxy));
        
        await whitelist(bot_account.wallet, bot_account.twitter, bot_account)

    }catch (error) {
        logger.log(error, '执行定时任务❌', bot_account.phone)
        //else await sleep(1000); // 等待10秒后重试
    }finally{
        logger.info( bot_account.phone, `定时任务执行结束`);
    }
    // fss.appendFile('./config/' + getDateStr() + '.properties', JSON.stringify(configs, null, "\t"));  
}



async function main(){
    let bot_accounts = await read_csv("./form/frogNFT.csv")
    bot_accounts = bot_accounts.slice(1, bot_accounts.length);
    logger.log('获取配置成功，执行自动初始化任务', bot_accounts.length);


    for(var bot_account of bot_accounts){
        if(bot_account[2] == '1'){
            continue;
        }
        await execute({
            "wallet": bot_account[1],
            "twitter": bot_account[0],
        })
        await sleep(getRandomInt(500000) + 120000);
    }

}


// node --inspect-brk  initUser.js
main().catch(err => {
    console.error(err);
});


