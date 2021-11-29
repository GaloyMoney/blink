import dedent from "dedent"

import { GT } from "@graphql/index"

import WalletId from "../scalar/wallet-id"
import Username from "../scalar/username"
import OnChainTxHash from "../scalar/onchain-tx-hash"
import LnPaymentSecret from "../scalar/ln-payment-secret"
import { SettlementMethod } from "@domain/wallets"

const SettlementViaIntraLedger = new GT.Object({
  name: "SettlementViaIntraLedger",
  isTypeOf: (source) => source.type === SettlementMethod.IntraLedger,
  fields: () => ({
    counterPartyWalletId: {
      type: GT.NonNull(WalletId),
    },
    counterPartyUsername: {
      type: Username,
      description: dedent`Settlement destination: Could be null the payee does not have a username`,
    },
  }),
})

const SettlementViaLn = new GT.Object({
  name: "SettlementViaLn",
  isTypeOf: (source) => source.type === SettlementMethod.Lightning,
  fields: () => ({
    paymentSecret: {
      type: LnPaymentSecret,
    },
  }),
})

const SettlementViaOnChain = new GT.Object({
  name: "SettlementViaOnChain",
  isTypeOf: (source) => source.type === SettlementMethod.OnChain,
  fields: () => ({
    transactionHash: {
      type: GT.NonNull(OnChainTxHash),
    },
  }),
})

const SettlementVia = new GT.Union({
  name: "SettlementVia",
  types: () => [SettlementViaIntraLedger, SettlementViaLn, SettlementViaOnChain],
})

export default SettlementVia
