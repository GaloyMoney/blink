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

const params = input.map(input => {
  const socket = `${input.node}:${input.port}`
  return {
    ...input,
    socket,
    lnd: authenticatedLndGrpc({...input, socket}).lnd,

    // FIXME active should be false first
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

// only one for now
export const getActiveLnd = () => {
  const lnds = getLnds({active: true})
  if (!lnds) {
    throw Error("no active lnd to send/receive a payment")
  }
  return lnds[0]
}

// only one for now
export const getOnchainLnd = getLnds({type: "onchain"})[0]

export const nodesPubKey = getAllOffchainLnd.map(item => item.pubkey)
export const isMyNode = ({pubkey}) => _.includes(nodesPubKey, pubkey)

export const getLndFromNode = ({ node }: {node: string}) => getLnds()[_.findIndex(params, { node })]

export const TIMEOUT_PAYMENT = process.env.NETWORK !== "regtest" ? 45000 : 3000
export const FEECAP = 0.02 // = 2%
export const FEEMIN = 10 // sats

const refresh_time = 30000 // ms

const loop = async ({lnd, socket}: {lnd: AuthenticatedLnd, socket: string}) => {
  try {
    const active = await isUp({lnd})
    _.find(params, {socket})!.active = active
    baseLogger.info({socket, active}, "lnd pulse")
  } catch (err) {
    baseLogger.warn({err}, "issue updating lnd status")
  } finally {
    setTimeout(async function () {
      // TODO check if this could lead to a stack overflow
      loop({lnd, socket})
    }, refresh_time);
  }
}

export const isUp = async ({lnd}) => {
  try {
    getWalletInfo({lnd})
  } catch (err) {
    baseLogger.warn({err}, `can't get wallet info from ${lnd}`)
    return false
  }
  return true
}

// launching a loop to update whether lnd are active or not
// params.forEach(loop)