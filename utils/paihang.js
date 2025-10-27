const {writeToFile} = require('../../common2/util/file');


async function getAll(){
  let response = await fetch("https://leaderboard.lilchogstars.com/api/leaderboard?category=entries&page=1&limit=100000", {
    "headers": {
      "accept": "*/*",
      "accept-language": "zh-CN,zh;q=0.9",
      "priority": "u=1, i",
      "sec-ch-ua": "\"Google Chrome\";v=\"137\", \"Chromium\";v=\"137\", \"Not/A)Brand\";v=\"24\"",
      "sec-ch-ua-mobile": "?0",
      "sec-ch-ua-platform": "\"macOS\"",
      "sec-fetch-dest": "empty",
      "sec-fetch-mode": "cors",
      "sec-fetch-site": "same-origin",
      "Referer": "https://leaderboard.lilchogstars.com/",
      "Referrer-Policy": "strict-origin-when-cross-origin"
    },
    "body": null,
    "method": "GET"
  });

  const datas = await response.json();

  for(let data of datas.data){
    await writeToFile("./file.csv", data.address + ","+ data.total_entries 
      + ","+ data.mon_spent + ","+ data.apr_mon_spent + "\n");
  }

}

getAll()