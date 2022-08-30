import { wrapAsyncToRunInSpan, wrapToRunInSpan } from "@services/tracing"

import * as FacadeMod from "./facade"
import * as TxMetadataMod from "./tx-metadata"

const allFunctions = { ...FacadeMod, ...TxMetadataMod }

for (const fn in allFunctions) {
  const fnType = fn.constructor.name
  const wrapFn = fnType === "AsyncFunction" ? wrapAsyncToRunInSpan : wrapToRunInSpan
  /* eslint @typescript-eslint/ban-ts-comment: "off" */
  // @ts-ignore-next-line no-implicit-any error
  allFunctions[fn] = wrapFn({
    namespace: "ledger.facade",
    // @ts-ignore-next-line no-implicit-any error
    fn: allFunctions[fn],
  })
}

export default allFunctions
