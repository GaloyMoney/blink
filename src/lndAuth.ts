import { AuthenticatedLnd, authenticatedLndGrpc } from "lightning"
import _ from "lodash"
import { exit } from "process"
import { yamlConfig } from "./config"

export type nodeType = "offchain" | "onchain"

interface ILndParams {
  cert: string
  macaroon: string
  node: string
  port: string | number
  type: nodeType[]
  pubkey: string
}

export interface ILndParamsAuthed extends ILndParams {
  lnd: AuthenticatedLnd
  socket: string
  active: boolean
}

const inputs: ILndParams[] = yamlConfig.lnds.map((input) => ({
  cert: process.env[`${input.name}_TLS`] || exit(98),
  macaroon: process.env[`${input.name}_MACAROON`] || exit(98),
  node: process.env[`${input.name}_DNS`] || exit(98),
  port: process.env[`${input.name}_RPCPORT`] ?? 10009,
  pubkey: process.env[`${input.name}_PUBKEY`] || exit(98),
  priority: 1,
  ...input,
}))

// is this file being imported from trigger.ts?
// FIXME: this is a hacky workaround to get active = true
// for params to make the tests working.
// otherwise the tests will have to probe before being able to call lnd
// TODO: use a mock instead.
// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
const isTrigger = require.main!.filename.indexOf("trigger") !== -1

export const addProps = (array) =>
  array.map((input) => {
    const socket = `${input.node}:${input.port}`
    return {
      ...input,
      socket,
      lnd: authenticatedLndGrpc({ ...input, socket }).lnd,

      // FIXME: should be inactive first
      // find a way to mock this up for jest
      // for now only trigger is active = false at start
      // because trigger will start listening to lnd event on lnd start/restart
      active: !isTrigger,
    }
  })

export const params = addProps(_.sortBy(inputs, ["priority"]))

export const TIMEOUT_PAYMENT = process.env.NETWORK !== "regtest" ? 45000 : 3000
export const FEECAP = 0.02 // = 2%
export const FEEMIN = 10 // sats
