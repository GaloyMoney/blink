import {authenticatedLndGrpc} from 'lightning';
import _ from "lodash";
import { exit } from "process";

const params = [{
  cert: process.env.LND_1_TLS || exit(1),
  macaroon: process.env.LND_1_MACAROON || exit(1),
  node: process.env.LND_1_DNS || exit(1),
  port: process.env.LND_1_RPCPORT ?? 10009,
  socket: `${process.env.LND_1_DNS}:${process.env.LND_1_RPCPORT ?? 10009}`,
  pubkey: "TODO",
  type: ["offchain"]
},
{
  cert: process.env.LND_2_TLS || exit(1),
  macaroon: process.env.LND_2_MACAROON || exit(1),
  node: process.env.LND_2_DNS || exit(1),
  port: process.env.LND_2_RPCPORT ?? 10009,
  socket: `${process.env.LND_2_DNS}:${process.env.LND_2_RPCPORT ?? 10009}`,
  pubkey: "TODO",
  type: ["offchain"]
},
{
  cert: process.env.LND_ONCHAIN_TLS || exit(1),
  macaroon: process.env.LND_ONCHAIN_MACAROON || exit(1),
  node: process.env.LND_ONCHAIN_DNS || exit(1),
  port: process.env.LND_ONCHAIN_RPCPORT ?? 10009,
  socket: `${process.env.LND_ONCHAIN_DNS}:${process.env.LND_ONCHAIN_RPCPORT ?? 10009}`,
  pubkey: "TODO",
  type: ["onchain"]
}
]

export const lndsGrpc = params.map(item => authenticatedLndGrpc(item).lnd)

export const getActiveLnd = () => ({ lnd: lndsGrpc[0], node: params[0].node })

// only doing onchain from one node to get started
// we probably want to use bitcoind instead of lnd for onchain tx anyway
export const getOnchainLnd = () => ({ lnd: lndsGrpc[2], node: params[2].node })


export const getLndFromNode = ({ node }: {node: string}) => lndsGrpc[_.findIndex(params, { node })]

export const TIMEOUT_PAYMENT = process.env.NETWORK !== "regtest" ? 45000 : 3000
export const FEECAP = 0.02 // = 2%
export const FEEMIN = 10 // sats
