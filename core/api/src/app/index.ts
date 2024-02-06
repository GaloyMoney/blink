import * as AccountsMod from "./accounts"
import * as AuthenticationMod from "./authentication"
import * as AdminMod from "./admin"
import * as CallbackMod from "./callback"
import * as CommMod from "./comm"
import * as QuizMod from "./quiz"
import * as LightningMod from "./lightning"
import * as OnChainMod from "./on-chain"
import * as PricesMod from "./prices"
import * as TransactionsMod from "./transactions"
import * as UsersMod from "./users"
import * as WalletsMod from "./wallets"
import * as PaymentsMod from "./payments"
import * as MerchantsMod from "./merchants"

import { wrapAsyncToRunInSpan } from "@/services/tracing"

const allFunctions = {
  Accounts: { ...AccountsMod },
  Authentication: { ...AuthenticationMod },
  Admin: { ...AdminMod },
  Callback: { ...CallbackMod },
  Comm: { ...CommMod },
  Quiz: { ...QuizMod },
  Lightning: { ...LightningMod },
  OnChain: { ...OnChainMod },
  Prices: { ...PricesMod },
  Transactions: { ...TransactionsMod },
  Users: { ...UsersMod },
  Wallets: { ...WalletsMod },
  Payments: { ...PaymentsMod },
  Merchants: { ...MerchantsMod },
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
  Authentication,
  Admin,
  Callback,
  Comm,
  Quiz,
  Lightning,
  OnChain,
  Prices,
  Transactions,
  Users,
  Wallets,
  Payments,
  Merchants,
} = allFunctions
