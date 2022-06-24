// https://lightning.engineering/loopapi/#loop-rest-api-reference
import fs from "fs"
import https from "https"

import axios, { AxiosResponse } from "axios"

import { getLoopConfig } from "@config"

// @todo - get from yaml or .envrc
const loopMacaroon = convertMacaroonToHexString(
  fs.readFileSync("./dev/lnd/loop.macaroon"),
)
const cert = fs.readFileSync("./dev/lnd/tls.cert")
const key = fs.readFileSync("./dev/lnd/tls.key")

export const loopRestClient = {
  loopOut,
  swapStatus,
  swapStatusAll,
  liquidityParams,
  loopOutTerms,
  loopOutQuote,
  convertMacaroonToHexString,
}

function loopClient() {
  const loopClientInstance = axios.create({
    headers: {
      "Content-Type": "application/json",
      "Grpc-Metadata-macaroon": loopMacaroon,
    },
    httpsAgent: new https.Agent({
      keepAlive: true,
      rejectUnauthorized: false,
      cert,
      key,
    }),
  })
  return loopClientInstance
}

function convertMacaroonToHexString(macaroon) {
  const macaroonHexStr = macaroon.toString("hex")
  return macaroonHexStr
}

async function loopOut(amt, swap_fee?): Promise<AxiosResponse> {
  const fee = swap_fee ? swap_fee : "20000"
  const body = {
    amt,
    max_swap_routing_fee: fee,
    max_prepay_routing_fee: fee,
    max_swap_fee: fee,
    max_prepay_amt: fee,
    max_miner_fee: fee,
    sweep_conf_target: "2",
    htlc_confirmations: "1",
    swap_publication_deadline: "600", // @todo - play with these params --fast
  }
  let resp
  try {
    resp = await loopClient().post(`${getLoopConfig().loopUrl}/v1/loop/out`, body)
  } catch (e) {
    resp = e
  }
  return resp
}

async function swapStatus(swapId) {
  let resp: AxiosResponse
  try {
    // https://lightning.engineering/loopapi/#v1-loop-swap
    // The swap identifier which currently is the hash that locks the HTLCs.
    // When using REST, this field must be encoded as URL safe base64.
    const id = swapId.replaceAll("+", "-").replaceAll("/", "_")
    resp = await loopClient().get(`${getLoopConfig().loopUrl}/v1/loop/swap/${id}`)
  } catch (e) {
    resp = e
  }
  console.log(resp.data)
  return resp
}

async function swapStatusAll() {
  let resp: AxiosResponse
  try {
    resp = await loopClient().get(`${getLoopConfig().loopUrl}/v1/loop/swaps`)
  } catch (e) {
    resp = e
  }
  console.log(resp.data)
  return resp
}

async function liquidityParams() {
  let resp: AxiosResponse
  try {
    resp = await loopClient().get(`${getLoopConfig().loopUrl}/v1/liquidity/params`)
  } catch (e) {
    resp = e
  }
  console.log(resp.data)
  return resp
}

async function loopOutTerms() {
  let resp: AxiosResponse
  try {
    resp = await loopClient().get(`${getLoopConfig().loopUrl}/v1/loop/out/terms`)
  } catch (e) {
    resp = e
  }
  console.log(resp.data)
  return resp
}

async function loopOutQuote(amt) {
  let resp: AxiosResponse
  try {
    resp = await loopClient().get(`${getLoopConfig().loopUrl}/v1/loop/out/quote/${amt}`)
  } catch (e) {
    resp = e
  }
  console.log(resp.data)
  return resp
}
