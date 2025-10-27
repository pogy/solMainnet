const inquirer = require('inquirer');
const chalk = require('chalk');
const path = require('path');
const crypto = require('crypto');
// const ed25519 = require('ed25519');
// 引入 @noble/ed25519
// const ed25519 = require('@noble/ed25519');

// 可选：引入 hashes 以验证依赖（通常自动加载）
// const hashes = require('@noble/hashes');

const WebSocket = require('ws');
const {BASE_URL, WS_URL, BASE_URL_DEV, WS_URL_DEV, instructionMap} = require('../config/backpack.json');
const {ProxyAgent} = require('proxy-agent');

const {randomBytes} = require('../../../../common2/util/string');
const {logger} = require('../../../../common2/util/logger');
const {requestJSONPost, requestGet, requestPut, getMobileUserAgent} = require('../../../../common2/util/commonHttp');

const SIGNATURE_VALIDITY_MS = 60000

// let ed25519;

// 使用异步函数
async function loadEd25519() {
    if(ed25519){
      return ed25519;
    }else{
      ed25519 = await import('@noble/ed25519');
      return ed25519;
    }
}

function sha512(data) {
  return crypto.createHash('sha512').update(data).digest('hex');
}

function convertStringsToNumbers(obj) {
  if (Array.isArray(obj)) {
    return obj.map(convertStringsToNumbers)
  } else if (typeof obj === 'object' && obj !== null) {
    return Object.fromEntries(
      Object.entries(obj).map(([key, value]) => [
        key,
        convertStringsToNumbers(value)
      ])
    )
  } else if (
    typeof obj === 'string' &&
    !isNaN(parseFloat(obj)) &&
    isFinite(obj)
  ) {
    return parseFloat(obj)
  } else {
    return obj
  }
}

async function generateVerifyingKey(signingKeyBase64 = null) {
  let seed

  if (signingKeyBase64) {
    // Decode the specified signing key from base64
    seed = Buffer.from(signingKeyBase64, 'base64')
    console.log('Using specified Signing Key (Seed):', signingKeyBase64)
  } else {
    // Generate a new random 32-byte seed
    seed = randomBytes(32)
    const generatedKeyBase64 = Buffer.from(seed).toString('base64')
    console.log('Generated New Signing Key (Seed):', generatedKeyBase64)
  }

  // Derive the public key (32 bytes)
  const publicKeyBytes = await loadEd25519().getPublicKey(seed)

  // Convert that public key to base64
  const verifyingKeyBase64 = Buffer.from(publicKeyBytes).toString('base64')
  console.log('Verifying Key:', verifyingKeyBase64)
}


class BackpackService {
  task;
  proxy;
  messageTitle;


  /**
   * buy nft
   * @param {string} providerUrl - rpc url
   * @param {string} adminPrivateKey -  operation wallet 
   * @param {string} agentAddress -  agent router Address
   * @param {json} task - task data
   */
  constructor(apiKey, apiSecret, isDev, task) {
    this.task = task;

    this.verifyingKey = apiKey
    this.signingKey = apiSecret
    if (!this.verifyingKey || !this.signingKey) {
      throw new Error('API key and secret are required')
    }
    this.baseUrl = isDev ? BASE_URL_DEV : BASE_URL
    this.wsUrl = isDev ? WS_URL_DEV : WS_URL

    this.messageTitle = `[backpack ${this.task.email}]`;

    if(task.proxy){
      this.agent = new ProxyAgent(`http://${task.proxy.auth.username}:${task.proxy.auth.password}@${task.proxy.host}:${task.proxy.port}`);
    }

  }

  async get(uri) {
    try {
      const instruction = instructionMap[`GET ${uri}`]
      if (!instruction) {
        throw new Error(`No instruction found for URI ${uri}`)
      }
      const headers = await this.signRequest(
        instruction,
        this.signingKey,
        this.verifyingKey,
        {}
      )

      const response = await fetch(`${this.baseUrl}${uri}`, {
        headers: {
          'Content-Type': 'application/json',
          ...headers
        },
        method: 'GET',
        agent: this.agent
      })

      const data = await response.json();
      return { data: convertStringsToNumbers(data) }
    } catch (error) {
      return { error }
    }
  }

  async post(uri, body) {
    try {
      const instruction = instructionMap[`POST ${uri}`]
      if (!instruction) {
        throw new Error(`${this.messageTitle} No instruction found for URI ${uri}`);
      }

      const url = `${this.baseUrl}${uri}`
     
      const headers = await this.signRequest(
        instruction,
        this.signingKey,
        this.verifyingKey,
        body
      )

      const response = await fetch(url, {
        headers: {
          'Content-Type': 'application/json',
          ...headers
        },
        body: JSON.stringify(body),
        method: 'POST',
        agent: this.agent
      })

      const data = await response.json()
      return { data }
    } catch (error) {
      return { error }
    }
  }

  async  generateKeys() {
  try {
    const { utils, getPublicKey } = await import('@noble/ed25519');
    // const { getPublicKey } = await import('@noble/ed25519/sign');
    
    const privateKey = utils.randomSecretKey();  // Uint8Array (32 字节)
    const publicKey = getPublicKey(privateKey);  // Uint8Array (32 字节)
    
    console.log('Private Key (hex):', Buffer.from(privateKey).toString('hex'));
    console.log('Public Key (hex):', Buffer.from(publicKey).toString('hex'));
    
    return { privateKey, publicKey };
  } catch (err) {
    console.error('Key generation error:', err.message);
    throw err;
  }
}

async  signAndVerify() {
  try {
    const { privateKey, publicKey } = await this.generateKeys();
    
    // 显式 dynamic import hashes 的 sha512（关键：使用子路径）
    const { sha512Sync } = await import('@noble/hashes/sha512');
    
    // Dynamic import ed25519 的 sign 和 verify
    const { sign, verify } = await import('@noble/ed25519/sign');
    
    const message = Buffer.from('Hello, Ed25519 with fixed hashes!');
    
    // 步骤：预哈希消息为 64 字节 SHA-512（必须）
    const hashedMessage = sha512Sync(message);  // Uint8Array (64 字节)
    console.log('Hashed Message (first 16 bytes hex):', Buffer.from(hashedMessage).toString('hex').slice(0, 32));
    
    // 签名（输入 hashedMessage，而非原始 message）
    const signature = await sign(hashedMessage, privateKey);  // Uint8Array (64 字节)
    console.log('Signature (hex):', Buffer.from(signature).toString('hex'));
    
    // 验证
    const isValid = await verify(signature, hashedMessage, publicKey);
    console.log('Signature valid:', isValid);  // 应为 true
    
  } catch (err) {
    console.error('Signing/Verification error:', err.message);
    if (err.message.includes('hashes.sha512')) {
      console.error('Tip: Ensure @noble/hashes is installed and sha512 is imported before use.');
    }
  }
}


  async signRequest(instruction, signingKey, verifyingKey, body) {

    // fixed-signing-example.js (CommonJS 文件)


    await this.signAndVerify();

    // Extract all defined and non-null body values as [key, value] pairs
  //   const sha512 = await import('@noble/hashes/sha512');

  //   const ed25519 = await import('@noble/ed25519');
  //   const { sign, verify, getPublicKey, generateKeyPair, utils, hash } = ed25519;

  //   // utils.setHash(sha512);
  //   hash.sha512  = sha512;
  //   // console.log(utils)
  //   console.log(sha512)
  //   // const ed25519= await loadEd25519();
  //   const privateKey = utils.randomSecretKey();  // 32 字节
  //   const publicKey = getPublicKey(privateKey);

  //   // 步骤：预哈希消息为 64 字节 SHA-512（必须）
  //   const hashedMessage = sha512Sync(message);  // Uint8Array (64 字节)
  //   console.log('Hashed Message (first 16 bytes hex):', Buffer.from(hashedMessage).toString('hex').slice(0, 32));

  //   const signature = await sign(hashedMessage, privateKey);  // async，支持 Uint8Array
  //   const isValid = await verify(signature, 'Hello, world!', publicKey);

  //   console.log(privateKey)
  //   console.log(publicKey)
  //   console.log(signature)
  //   console.log(isValid)
  //   return
  //   const bodyEntries = Object.entries(body)
  //     .filter(
  //       ([, value]) => value !== undefined && JSON.stringify(value) !== 'null'
  //     )
  //     .map(([k, v]) => [k, v.toString()])
  //     .sort(([a], [b]) => a.localeCompare(b))

  //   bodyEntries.unshift(['instruction', instruction])

  //   const timestamp = String(Date.now())
  //   const window = String(SIGNATURE_VALIDITY_MS)

  //   bodyEntries.push(['timestamp', timestamp], ['window', window])

  //   const msg = bodyEntries.map(([k, v]) => `${k}=${v}`).join('&')
  //   const encodedMessage = new TextEncoder().encode(msg)
  //   // const privateKey = Uint8Array.from(Buffer.from(signingKey, 'base64'))

  //   const keyPair = nacl.sign.keyPair.fromSeed(seed);
  //   // const signature = await nacl.sign(encodedMessage, privateKey)
  //   const base64Signature = Buffer.from(signature).toString('base64')

  //   const headers = {
  //     'X-API-Key': verifyingKey,
  //     'X-Signature': base64Signature,
  //     'X-Timestamp': timestamp,
  //     'X-Window': window
  //   }

  //     console.log('Message to sign:', msg)
  //     console.log('Base64 encoded signature:', base64Signature)
  //     console.log('Headers:', headers)
  //     console.log('Request body:', body)

  //   return headers
  // }

  // async wsConnect() {
  //   return new Promise((resolve, reject) => {
  //     this.ws = new WebSocket(this.wsUrl)

  //     this.ws.on('open', () => {
  //       console.log('WebSocket connection opened.')
  //       resolve()
  //     })

  //     this.ws.on('message', (data) => {
  //       console.log('Message received:', data.toString())
  //     })

  //     this.ws.on('close', (code, reason) => {
  //       console.log('WebSocket connection closed:', {
  //         code,
  //         reason: reason.toString()
  //       })
  //     })

  //     this.ws.on('error', (error) => {
  //       console.error('WebSocket error:', error)
  //       reject(error)
  //     })
  //   })
  }

  async wsSend(params) {
    this.ws.send(JSON.stringify(params))
    console.log('Message sent:', params)
  }

  async wsSendWithSig(params) {
    const signature = await this.signRequest(
      'subscribe',
      this.signingKey,
      this.verifyingKey,
      {}
    )

    const signedParams = {
      ...params,
      signature: [
        signature['X-API-Key'],
        signature['X-Signature'],
        signature['X-Timestamp'],
        signature['X-Window']
      ],
      id: 1
    }

    this.ws.send(JSON.stringify(signedParams))
  }
 
}


module.exports = {
  BackpackService
};