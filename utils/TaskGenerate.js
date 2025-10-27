const fs = require('fs');
const {DB} = require('../../common2/util/db');
const {CryptoService} = require('../../common2/util/CryptoUtil');
const {personalSign, getAddressByMnemonic, signMessage,getAddressUper} = require('../../common2/web3/okx_eth');
const { getMobileUserAgent} = require('../../common2/util/commonHttp');
const {sleep, getRandomInt} = require('../../common2/util/common');

const db = new DB();
const cryptoService = new CryptoService();

// wallet iphonex 
// let mnemonic = "Zq75Ow1vvGE034EfgDZvaQpzUmnEZPsRKqU/p65TSE4ZMUVm3VTkTsplCB91ywWzhtBYpYR5f8YUOnWuf+kcsD5yTGToo6/qqE0e08iQ/GqeJnyUJMOU17EPsIOCNf2vicCMSl9B8uDz8HpGZIalNb5vFG0SILMQVVVtDTx8RLZnZ5snBNo9oSRMGmxSahwJjrg96bcyJSKzh9HvQiRLJ2T3Np3Hay+0OtcqhpS8uq38g/d1EBvGtnVghv2ItEk7bKxEd0gNJVj/ab5dWfCpD/51B6A7BhhkEahZFmcQ6TyI5VPFD7gDmNDvsGHc5QtlzDhvhsqqOuNe3QdJQCCH5A==";

// wallet iphone12
let mnemonic = "a7eFmzXl/rKQKrh8to9UE9xvFR7A1uAY5QdJhSoxTTSGAFalQ9XX5cA1GK3YHysrUJucCkg995MhtvcI7I5XH2uSsrR/JbN71gxDzJhklOxgWvGAxUSB1y9oA5vTVx5tjtmm8sOyWmAqqYmYCVroxSn+t0t6s7whpARA8lbOh/6CiaLogFpsBANgc4fIRFi39DGLTIozAro//EhFqcIiaHU6ew5dvNfDjYqIW9uGWg8ePiFj9BT9Eqsplg7aNmTwW1Ur+Ft4PeWyjvyBnSF7As+62bPooKrITv98eD68qf2WzocPS+QcsuN/q/deBzNzWi6ubM4VF4k7g+K1P8tmpA==";

//let tianzhi
// let mnemonic = "Akp6BdaBOGWF+7BMZwHj1CVVIjZKLj00u0ITjFR4TDAszmmrpqu9XUF4VSQJgMYOt0j/t4hHQzfEzzp849RimDddqV3H1qHFPuy7Pju2tXwZrGaPK01EBHXDbPVDVMye8fj7bP/Nvug3BPdz4n1ri5nkriAvatSAL7msRx/uLRe6Y/h9aeuLnto6ZHb5Cuf1F1VSl8PmeOfiyUYowdTUyLMCMQkObt/DkbJJdP5bC4NNIRdiuEFFBOCSTGJ+O/mJ4iUCzm1nbt4cgGW4OKNzMgeczChRXKHVBrBbWXOP7lKR5xEA3Mvi8IHSeuGXpVI+dpKGG4ID2LPXnD+7PMZgow==";

const loadWallets = () => {
    if (!fs.existsSync('wallets.json')) {
        fs.writeFileSync('wallets.json', JSON.stringify([]));
    }
    const data = fs.readFileSync('wallets.json', 'utf-8');
    return JSON.parse(data);
};

const saveWallets = (wallets) => {
    fs.writeFileSync('wallets.json', JSON.stringify(wallets, null, 2));
};



const generateWallets = async () => {
    await cryptoService.init();
    // console.log(cryptoService.decryptData(mnemonic))
    // return;

    let task_id = 110010;
    let task = {};

    // 60～100
    // 100 ～ 180
    for(let i= 0; i < 10; i++){
        task = {};
        console.log(i)
        let eth_wallet = await getAddressByMnemonic( cryptoService.decryptData(mnemonic), i);//
        task.eth_wallet_private = cryptoService.encryptData(eth_wallet.privateKey);
        task.eth_wallet_address = await getAddressUper(eth_wallet.privateKey);

        task.boot_username = 'bnbchain';
        task.task_id = 1000 + getRandomInt(90000);
        task.useragent = getMobileUserAgent();
        task.wallet_index = 'okx-lixian-' + (i+1);
        task.invite_code = 'me';
        // console.log(task.eth_wallet_address, task.eth_wallet_private)

        await db.insert_common_airdroip_task(task);

        console.log('success create' + task.eth_wallet_address, task.eth_wallet_private);
    }
};

generateWallets();
