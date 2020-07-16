import * as moment from 'moment'
export const validate = require("validate.js")
import * as jwt from 'jsonwebtoken'
import { JWT_SECRET } from "./const"
import * as lnService from "ln-service"
export const btc2sat = (btc: number) => {
    return btc * Math.pow(10, 8)
}

export const sat2btc = (sat: number) => {
    return sat / Math.pow(10, 8)
}

export const randomIntFromInterval = (min, max) => 
    Math.floor(Math.random() * (max - min + 1) + min)

export async function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

export function timeout(t, msg) {
    return new Promise(function(resolve, reject) {
        setTimeout(function() {
            reject(new Error(msg));
        }, t);
    });
}

export const createToken = ({uid, network}) => jwt.sign({ uid, network }, JWT_SECRET, {
    // TODO use asymetric signature
    // and verify the signature from the client
    // otherwise we could get subject to DDos attack
    //
    // we will also need access token for this to work
    // otherwise, the client could still receive a fake invoice/on chain address
    // from a malicious address and the client app would not be able to
    // verify signature
    //
    // see: https://www.theregister.com/2018/04/24/myetherwallet_dns_hijack/
    algorithm: 'HS256',
})

// we are extending validate so that we can validate dates
// which are not supported date by default
validate.extend(validate.validators.datetime, {
    // The value is guaranteed not to be null or undefined but otherwise it
    // could be anything.
    parse: function(value: any, options: any) {
        return +moment.utc(value);
    },
    // Input is a unix timestamp
    format: function(value: any, options: any) {
        const format = options.dateOnly ? "YYYY-MM-DD" : "YYYY-MM-DD hh:mm:ss";
        return moment.utc(value).format(format);
    }
})

export const shortenHash = (hash: string, length = 4) => {
  return `${hash.substring(0, length)}...${hash.substring(hash.length - length)}`
}

export const getAuth = () => {
    try {
        // network = process.env.NETWORK // TODO
        const cert = process.env.TLS
        const macaroon = process.env.MACAROON 
        const lndip = process.env.LNDIP
        const port = process.env.LNDRPCPORT ?? 10009
        
        const socket = `${lndip}:${port}`
        if (!cert || !macaroon || !lndip) {
            throw new Error('missing environment variable for lnd')
        }
        return { macaroon, cert, socket };
    }
    catch (err) {
        throw Error(`failed-precondition: ${err}`);
    }
}

export async function waitUntilBlockHeight({lnd, blockHeight}) {
    let current_block_height, is_synced_to_chain
    ({ current_block_height, is_synced_to_chain } = await lnService.getWalletInfo({ lnd }))
    console.log({ current_block_height, is_synced_to_chain})
    
    let time = 0
    while (current_block_height < blockHeight || !is_synced_to_chain) {
        await sleep(50);
        ({ current_block_height, is_synced_to_chain } = await lnService.getWalletInfo({ lnd }))
        // console.log({ current_block_height, is_synced_to_chain})
        time++
    }
    console.log(`Seconds to sync blockheight ${blockHeight}: ${time / 20}`)
    return
}