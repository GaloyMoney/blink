import { wrapAsyncToRunInSpan } from "@services/tracing"

import * as AccountsMod from "./accounts"
import * as AuthMod from "./auth"
import * as AdminMod from "./admin"
import * as ColdStorageMod from "./cold-storage"
import * as LightningMod from "./lightning"
import * as OnChainMod from "./on-chain"
import * as PricesMod from "./prices"
import * as TransactionsMod from "./transactions"
import * as UsersMod from "./users"
import * as WalletsMod from "./wallets"
import * as PaymentsMod from "./payments"
import * as SwapMod from "./swap"

const allFunctions = {
  Accounts: { ...AccountsMod },
  Auth: { ...AuthMod },
  Admin: { ...AdminMod },
  ColdStorage: { ...ColdStorageMod },
  Lightning: { ...LightningMod },
  OnChain: { ...OnChainMod },
  Prices: { ...PricesMod },
  Transactions: { ...TransactionsMod },
  Users: { ...UsersMod },
  Wallets: { ...WalletsMod },
  Payments: { ...PaymentsMod },
  Swap: { ...SwapMod },
} as const

let subModule: keyof typeof allFunctions
for (subModule in allFunctions) {
  for (const fn in allFunctions[subModule]) {
    /* eslint @typescript-eslint/ban-ts-comment: "off" */
    // @ts-ignore-next-line no-implicit-any error
    allFunctions[subModule][fn] = wrapAsyncToRunInSpan({
      namespace: `app.${subModule.toLowerCase()}`,
      // @ts-ignore-next-line no-implicit-any error
      fn: allFunctions[subModule][fn],
    })
  }
}

export const {
  Accounts,
  Auth,
  Admin,
  ColdStorage,
  Lightning,
  OnChain,
  Prices,
  Transactions,
  Users,
  Wallets,
  Payments,
  Swap,
} = allFunctions
