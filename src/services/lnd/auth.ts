import { authenticatedLndGrpc } from "lightning"
import { getLndParams } from "@config"
import sortBy from "lodash.sortby"

const inputs: LndParams[] = getLndParams()

const addProps = (array: LndParams[]) => {
  const result: LndParamsAuthed[] = array.map((input) => {
    const socket = `${input.node}:${input.port}`
    return {
      ...input,
      socket,
      lnd: authenticatedLndGrpc({ ...input, socket }).lnd,
      active: false,
    }
  })
  return result
}

export const params: LndParamsAuthed[] = addProps(sortBy(inputs, ["priority"]))

export const TIMEOUT_PAYMENT = process.env.NETWORK !== "regtest" ? 45000 : 3000
