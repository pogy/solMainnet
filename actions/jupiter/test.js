const {sleep, getRandomInt} = require('../../../common2/util/common');
const { HttpsProxyAgent } = require( 'https-proxy-agent');


async function main(){
	for (var i =0; i<1; i++){
	 //    let username = `C94CEC90972EE3B0-residential-country_SG-r_10m-s_${10000 + getRandomInt(1000000)}` 
	 //    let letpassword = 'monad-expensive'
	 //    let host = 'gate.nstproxy.io'
	 //    let port = '24125'

	 //    let proxy = `http://{username}:{password}@{host}:{port}` 
	 //    proxy_dict = {
	 //        "http": proxy,
	 //        "https": proxy
	 //    }
	 //    response = requests.get("https://lite-api.jup.ag/swap/v1/quote?inputMint=So11111111111111111111111111111111111111112&outputMint=EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v&amount=10000000&slippageBps=100&onlyDirectRoutes=false&asLegacyTransaction=false", proxies=proxy_dict)
	 //    print(username,response.status_code)

	    // const response = await fetch("https://lite-api.jup.ag/swap/v1/quote?inputMint=So11111111111111111111111111111111111111112&outputMint=EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v&amount=10000000&slippageBps=100&onlyDirectRoutes=false&asLegacyTransaction=false", {
	    //   agent: new HttpsProxyAgent('http://127.0.0.1:7890'),
	    //   headers: {'Connection': 'keep-alive' }
	    // });

	    const response = await fetch("https://lite-api.jup.ag/swap/v1/quote?inputMint=So11111111111111111111111111111111111111112&outputMint=EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v&amount=10000000&slippageBps=100&onlyDirectRoutes=false&asLegacyTransaction=false", {
		  "headers": {
		    "accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7",
		    "accept-language": "zh-CN,zh;q=0.9",
		    "priority": "u=0, i",
		    "sec-fetch-dest": "document",
		    "sec-fetch-mode": "navigate",
		    "sec-fetch-site": "none",
		    "sec-fetch-user": "?1",
		    "upgrade-insecure-requests": "1"
		  },
		  "referrerPolicy": "strict-origin-when-cross-origin",
		  "body": null,
		  "method": "GET",
		   // agent: new HttpsProxyAgent('http://127.0.0.1:7890')
		});
	    console.log(response);
	}

	// curl -x user:password@192.168.1.100:8080 https://example.com
    
}

main()