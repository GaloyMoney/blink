import { wrapAsyncToRunInSpan } from "@services/tracing"

import * as AccountsMod from "./accounts"
import * as AdminMod from "./admin"
import * as ColdStorageMod from "./cold-storage"
import * as LightningMod from "./lightning"
import * as PricesMod from "./prices"
import * as UsersMod from "./users"
import * as WalletsMod from "./wallets"
import * as PaymentsMod from "./payments"

const allFunctions = {
  Accounts: { ...AccountsMod },
  Admin: { ...AdminMod },
  ColdStorage: { ...ColdStorageMod },
  Lightning: { ...LightningMod },
  Prices: { ...PricesMod },
  Users: { ...UsersMod },
  Wallets: { ...WalletsMod },
  Payments: { ...PaymentsMod },
} as const

let subModule: keyof typeof allFunctions
for (subModule in allFunctions) {
  console.log("HERE 10:", allFunctions[subModule])
  if (Object.values(allFunctions[subModule]).includes(undefined)) {
    const fns = Object.keys(allFunctions[subModule]).filter(
      (key) => allFunctions[subModule][key] === undefined,
    )
    console.log(`UNDEFINED!!! ${subModule}: ${JSON.stringify(fns, null, 2)}`)
  }
  for (const fn in allFunctions[subModule]) {
    // console.log("HERE 11:", fn)
    // console.log("HERE 12:", allFunctions[subModule][fn])
    /* eslint @typescript-eslint/ban-ts-comment: "off" */
    // @ts-ignore-next-line no-implicit-any error
    allFunctions[subModule][fn] = wrapAsyncToRunInSpan({
      namespace: `app.${subModule.toLowerCase()}`,
      // @ts-ignore-next-line no-implicit-any error
      fn: allFunctions[subModule][fn],
    })
    // if (fn === "addEarn") throw new Error()
  }
}

export const {
  Accounts,
  Admin,
  ColdStorage,
  Lightning,
  Prices,
  Users,
  Wallets,
  Payments,
} = allFunctions
