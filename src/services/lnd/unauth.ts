import { unauthenticatedLndGrpc } from "lightning"
import sortBy from "lodash.sortby"
import { getLndParams } from "@config/app"

const inputs: LndParams[] = getLndParams()

// is this file being imported from trigger.ts?
// FIXME: this is a hacky workaround to get active = true
// for params to make the tests working.
// otherwise the tests will have to probe before being able to call lnd
// TODO: use a mock instead.
// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
const isTest = require.main!.filename.indexOf(".spec.") !== -1

export const addProps = (array) =>
  array.map((input) => {
    const socket = `${input.node}:${input.port}`
    return {
      ...input,
      socket,
      lnd: unauthenticatedLndGrpc({ ...input, socket }).lnd,
      active: isTest,
    }
  })

export const params = addProps(sortBy(inputs, ["priority"]))
