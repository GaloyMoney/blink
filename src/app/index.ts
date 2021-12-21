import * as AccountsMod from "./accounts"
import * as AdminMod from "./admin"
import * as LightningMod from "./lightning"
import * as PricesMod from "./prices"
import * as UsersMod from "./users"
import * as WalletsMod from "./wallets"
import { wrapAsyncToRunInSpan, wrapToRunInSpan } from "@services/tracing"

const allFunctions = {
  Accounts: { ...AccountsMod },
  Admin: { ...AdminMod },
  Lightning: { ...LightningMod },
  Prices: { ...PricesMod },
  Users: { ...UsersMod },
  Wallets: { ...WalletsMod },
}
const syncFunctions = ["PaymentStatusChecker"]

for (const subModule in allFunctions) {
  for (const fn in allFunctions[subModule]) {
    const wrapper = syncFunctions.includes(fn) ? wrapToRunInSpan : wrapAsyncToRunInSpan
    allFunctions[subModule][fn] = wrapper({
      namespace: "app",
      fn: allFunctions[subModule][fn],
    })
  }
}

export const { Accounts, Admin, Lightning, Prices, Users, Wallets } = allFunctions
