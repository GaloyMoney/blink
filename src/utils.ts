import * as moment from 'moment'
export const validate = require("validate.js")
import * as jwt from 'jsonwebtoken'
import * as lnService from "ln-service"
import { sendText } from './text'
import { Transaction, User } from "./mongodb";
import { sendNotification } from "./notification";

export const logger = require('pino')({ level: "debug" })
const util = require('util')

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

export function timeout(delay, msg) {
    return new Promise(function(resolve, reject) {
        setTimeout(function() {
            reject(new Error(msg));
        }, delay);
    });
}

export const createToken = ({uid}) => jwt.sign(
    { uid, network: process.env.NETWORK }, process.env.JWT_SECRET, {
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
    logger.debug({ current_block_height, is_synced_to_chain})
    
    let time = 0
    const ms = 50
    while (current_block_height < blockHeight || !is_synced_to_chain) {
        await sleep(ms);
        ({ current_block_height, is_synced_to_chain } = await lnService.getWalletInfo({ lnd }))
        // logger.debug({ current_block_height, is_synced_to_chain})
        time++
    }
    logger.debug(`Seconds to sync blockheight ${blockHeight}: ${time / (1000/ ms)}`)
    return
}

export async function measureTime(operation: Promise<any>): Promise<[any, number]> {
    const startTime = process.hrtime()
    const result = await operation
    const timeElapsed = process.hrtime(startTime)
    const timeElapsedms = timeElapsed[0] * 1000 + timeElapsed[1] / 1000000
    return [result, timeElapsedms]
}

export async function getOnChainTransactions({ lnd, incoming }: { lnd: any, incoming: boolean }) {
    try {
        let onchainTransactions = await lnService.getChainTransactions({ lnd })
        return onchainTransactions.transactions.filter(tx => incoming ? !tx.is_outgoing : tx.is_outgoing)
    } catch (err) {
        const err_string = `${util.inspect({ err }, { showHidden: false, depth: null })}`
        throw new Error(`issue fetching transaction: ${err_string})`)
    }
}

export async function onchainTransactionEventHandler(tx) {
    logger.debug({ tx })
    if (!tx.is_outgoing) {
        let _id
        try {
            ({ _id } = await User.findOne({ onchain_addresses: { $in: tx.output_addresses } }, { _id: 1 }))
            if (!_id) {
                //FIXME: Log the onchain address, need to first find which of the tx.output_addresses
                // belongs to us
                const error = `No user associated with the onchain address`
                logger.error(error)
                throw new Error(error)
            }
        } catch (error) {
            logger.error(error)
            throw error
        }
        //FIXME: Maybe USD instead of sats?
        let body = tx.is_confirmed ? 
            `Your wallet has been credited with ${tx.tokens} sats` :
            `You have a pending incoming transaction of ${tx.tokens} sats`
        
        await sendNotification({ title: "New transaction", body, uid: _id })
    }
    } else {
        //TODO: sms for onchain payments also
        //for outgoing onchain payment
        const fee = tx.fee
        if (tx.is_confirmed) {
            await Transaction.updateMany({ hash: tx.id}, {pending: false })
        }
    }
}

export async function sendToAdmin(body) {
    await sendText({body, to: '+1***REMOVED***'})
    await sendText({body, to: '***REMOVED***'})
}