import { authenticatedLndGrpc } from "lightning"
import { getLndParams } from "@config/app"
import sortBy from "lodash.sortby"

const inputs: LndParams[] = getLndParams()

// is this file being imported from trigger.ts?
// FIXME: this is a hacky workaround to get active = true
// for params to make the tests working.
// otherwise the tests will have to probe before being able to call lnd
// TODO: use a mock instead.
// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
const isTest = require.main!.filename.indexOf(".spec.") !== -1

export const addProps = (array: LndParams[]) => {
  const result: LndParamsAuthed[] = array.map((input) => {
    const socket = `${input.node}:${input.port}`
    return {
      ...input,
      socket,
      lnd: authenticatedLndGrpc({ ...input, socket }).lnd,
      active: isTest,
    }
  })
  return result
}

export const params = addProps(sortBy(inputs, ["priority"]))

export const TIMEOUT_PAYMENT = process.env.NETWORK !== "regtest" ? 45000 : 3000
