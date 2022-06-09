import { unauthenticatedLndGrpc } from "lightning"
import sortBy from "lodash.sortby"
import { getLndParams } from "@config"

const inputs: LndParams[] = getLndParams()

const addProps = (array: LndParams[]) =>
  array.map((input) => {
    const socket = `${input.node}:${input.port}`
    return {
      ...input,
      socket,
      lnd: unauthenticatedLndGrpc({ ...input, socket }).lnd,
      active: false,
    }
  })

export const params: LndParamsUnAuthed[] = addProps(sortBy(inputs, ["priority"]))
