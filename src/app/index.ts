import { wrapAsyncToRunInSpan } from "@services/tracing"

import * as AccountsMod from "./accounts"
import * as AdminMod from "./admin"
import * as LightningMod from "./lightning"
import * as PricesMod from "./prices"
import * as UsersMod from "./users"
import * as WalletsMod from "./wallets"

const allFunctions = {
  Accounts: { ...AccountsMod },
  Admin: { ...AdminMod },
  Lightning: { ...LightningMod },
  Prices: { ...PricesMod },
  Users: { ...UsersMod },
  Wallets: { ...WalletsMod },
}


for (const subModule in allFunctions) {
  for (const fn in allFunctions[subModule]) {
    allFunctions[subModule][fn] = wrapAsyncToRunInSpan({
      namespace: `app.${subModule.toLowerCase()}`,
      fn: allFunctions[subModule][fn],
    })
  }
}

export const { Accounts, Admin, Lightning, Prices, Users, Wallets } = allFunctions
