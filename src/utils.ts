import * as jwt from 'jsonwebtoken'
import * as lnService from "ln-service"
import * as moment from 'moment'
import { Price } from "./priceImpl"
import { sendText } from './text'
export const validate = require("validate.js")
const lightningPayReq = require('bolt11')
const BitcoindClient = require('bitcoin-core')

export const logger = require('pino')({ level: process.env.LOGLEVEL || "info" })
const util = require('util')

const connection_obj = {
  network: process.env.NETWORK, username: 'rpcuser', password: 'rpcpass',
  host: process.env.BITCOINDADDR, port: process.env.BITCOINDPORT
}

export const bitcoindClient = new BitcoindClient(connection_obj)

export const getHash = (request) => {
  const decoded = lightningPayReq.decode(request)
  return decoded.tags.filter(item => item.tagName === "payment_hash")[0].data
}

export const getAmount = (request): number | undefined => {
  const decoded = lightningPayReq.decode(request)
  return decoded.satoshis
}

export const btc2sat = (btc: number) => {
  return btc * Math.pow(10, 8)
}

export const sat2btc = (sat: number) => {
  return sat / Math.pow(10, 8)
}

export const addCurrentValueToMetadata = async (metadata, { sats, usd, fee }: { sats: number, usd?: number, fee?: number }) => {
  let _usd = usd

  if (!usd) {
    _usd = await satsToUsd(sats)
  }

  metadata['sats'] = sats
  metadata['usd'] = _usd

  if (fee) {
    metadata['fee'] = fee
    metadata['feeUsd'] = await satsToUsd(fee)
  }
}

export const satsToUsd = async sats => {
  // TODO: caching in graphql, should be passed as a variable to addInvoice
  const lastPrices = await new Price().lastPrice() // sats/usd
  const usdValue = lastPrices * sats
  return usdValue
}

export const satsToUsdCached = (sats, price) => {
  return price * sats
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

export const createToken = ({ uid, currency, network }) => jwt.sign(
  { uid, network, currency }, process.env.JWT_SECRET, {
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

export const getAuth = () => {
  // network = process.env.NETWORK // TODO
  const cert = process.env.TLS
  const macaroon = process.env.MACAROON
  const lndip = process.env.LNDIP
  const port = process.env.LNDRPCPORT ?? 10009

  if (!cert || !macaroon || !lndip) {
    throw new Error('missing environment variable for lnd')
  }

  const socket = `${lndip}:${port}`

  return { macaroon, cert, socket };
}

export async function measureTime(operation: Promise<any>): Promise<[any, number]> {
  const startTime = process.hrtime()
  const result = await operation
  const timeElapsed = process.hrtime(startTime)
  const timeElapsedms = timeElapsed[0] * 1000 + timeElapsed[1] / 1000000
  return [result, timeElapsedms]
}

export async function sendToAdmin(body) {
  await sendText({ body, to: '+1***REMOVED***' })
  await sendText({ body, to: '***REMOVED***' })
}

export async function nodeStats ({lnd}) {
  const result = await lnService.getWalletInfo({ lnd })
  const peersCount = result.peers_count
  const channelsCount = result.active_channels_count
  return {
    peersCount,
    channelsCount
  }
}
