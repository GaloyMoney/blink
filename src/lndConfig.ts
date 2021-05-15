import {authenticatedLndGrpc} from 'lightning';
import _ from "lodash";
import { exit } from "process";

const params = [{
  cert: process.env.TLS || exit(1),
  macaroon: process.env.MACAROON || exit(1),
  node: process.env.LNDDNS || exit(1),
  port: process.env.LNDRPCPORT ?? 10009,
  socket: `${process.env.LNDDNS}:${process.env.LNDRPCPORT ?? 10009}`,
  pubkey: "TODO"
}]

const lndsGrpc = params.map(item => authenticatedLndGrpc(item).lnd)

export const getActiveLnd = () => ({ lnd: lndsGrpc[0], node: params[0].node })

// only doing onchain from one node to get started
// we probably want to use bitcoind instead of lnd for onchain tx anyway
export const getOnchainLnd = () => ({ lnd: lndsGrpc[0], node: params[0].node })


export const getLndFromNode = ({ node }: {node: string}) => lndsGrpc[_.findIndex(params, { node })]

export const TIMEOUT_PAYMENT = process.env.NETWORK !== "regtest" ? 45000 : 3000
export const FEECAP = 0.02 // = 2%
export const FEEMIN = 10 // sats
