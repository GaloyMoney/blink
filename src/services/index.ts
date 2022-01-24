import { wrapAsyncToRunInSpan } from "@services/tracing"

import { LockService as LockServiceMod } from "./lock"

const allFunctions = {
  LockService: LockServiceMod,
}

for (const subModule in allFunctions) {
  for (const fn in allFunctions[subModule]) {
    allFunctions[subModule][fn] = wrapAsyncToRunInSpan({
      namespace: `app.${subModule.toLowerCase()}`,
      fn: allFunctions[subModule][fn],
    })
  }
}

export const { LockService } = allFunctions
