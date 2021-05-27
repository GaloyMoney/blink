import {AuthenticatedLnd, authenticatedLndGrpc, getWalletInfo} from 'lightning';
import _ from "lodash";
import { exit } from "process";
import { baseLogger } from "./logger";

type nodeType = "offchain" | "onchain"

interface IParams {
  cert: string;
  macaroon: string;
  node: string;
  port: string | number;
  pubkey: string | undefined;
  type: nodeType[];
}

interface IParamsAuthed extends IParams {
  lnd: AuthenticatedLnd,
  socket: string;
  active: boolean,
}

const input: IParams[] = [{
  cert: process.env.LND_1_TLS || exit(1),
  macaroon: process.env.LND_1_MACAROON || exit(1),
  node: process.env.LND_1_DNS || exit(1),
  port: process.env.LND_1_RPCPORT ?? 10009,
  type: ["offchain"],
  pubkey: process.env.LND_1_PUBKEY,
},
{
  cert: process.env.LND_2_TLS || exit(1),
  macaroon: process.env.LND_2_MACAROON || exit(1),
  node: process.env.LND_2_DNS || exit(1),
  port: process.env.LND_2_RPCPORT ?? 10009,
  type: ["offchain"],
  pubkey: process.env.LND_2_PUBKEY,
},
{
  cert: process.env.LND_ONCHAIN_TLS || exit(1),
  macaroon: process.env.LND_ONCHAIN_MACAROON || exit(1),
  node: process.env.LND_ONCHAIN_DNS || exit(1),
  port: process.env.LND_ONCHAIN_RPCPORT ?? 10009,
  type: ["onchain"],
  pubkey: undefined,
}]

// FIXME remove export
export const params = input.map(input => {
  const socket = `${input.node}:${input.port}`
  return {
    ...input,
    socket,
    lnd: authenticatedLndGrpc({...input, socket}).lnd,
    active: true,
  }
})

export const getLnds = ({type, active}: {type?: nodeType, active?: boolean} = {}): IParamsAuthed[] => {
  let result = params

  if (!!type) {
    result = _.filter(result, item => item.type.some(item => item === type))
  }

  if (!!active) {
    result = _.filter(result, {active})
  }

  return result
}

export const getAllOffchainLnd = getLnds({type: "offchain"})

// only returning the first one for now
export const getActiveLnd = () => {
  const lnds = getLnds({active: true})
  if (!lnds) {
    throw Error("no active lnd to send/receive a payment")
  }
  return lnds[0]
}

// there is only one lnd responsible for onchain tx
export const getOnchainLnd = getLnds({type: "onchain"})[0]

export const nodesPubKey = getAllOffchainLnd.map(item => item.pubkey)
export const isMyNode = ({pubkey}) => _.includes(nodesPubKey, pubkey)

export const getLndFromNode = ({ node }: {node: string}) => getLnds()[_.findIndex(params, { node })]

export const TIMEOUT_PAYMENT = process.env.NETWORK !== "regtest" ? 45000 : 3000
export const FEECAP = 0.02 // = 2%
export const FEEMIN = 10 // sats

const refresh_time = 5000 // ms

const loop = async ({socket}: {socket: string}) => {
  try {
    await isUp({socket})
  } finally {
    setTimeout(async function () {
      // TODO check if this could lead to a stack overflow
      loop({socket})
    }, refresh_time);
  }
}

export const isUp = async ({socket}): Promise<void> => {
  let active
  try {
    // @ts-ignore
    const { lnd } = _.find(params, {socket})

    // will throw if there is an error
    await getWalletInfo({lnd})
    active = true
  } catch (err) {
    baseLogger.warn({err}, `can't get wallet info from ${socket}`)

    // if we get disconnected, we need to recreate the lnd object
    const paramIndex = _.findIndex(params, {socket})
    params[paramIndex] = {
      ...params[paramIndex],
      lnd: authenticatedLndGrpc(params[paramIndex]).lnd
    }

    active = false
  }
  _.find(params, {socket})!.active = active
  baseLogger.info({socket, active}, "lnd pulse")
}

// launching a loop to update whether lnd are active or not
// params.forEach(loop)