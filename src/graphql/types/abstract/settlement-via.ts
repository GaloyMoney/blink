import dedent from "dedent"

import { GT } from "@graphql/index"

import WalletId from "../scalar/wallet-id"
import Username from "../scalar/username"
import OnChainTxHash from "../scalar/onchain-tx-hash"
import LnPaymentSecret from "../scalar/ln-payment-secret"

const SettlementViaIntraLedger = new GT.Object({
  name: "SettlementViaIntraLedger",
  fields: () => ({
    walletId: {
      type: GT.NonNull(WalletId),
    },
    counterPartyUsername: {
      type: Username,
      description: dedent`Settlement destination: Could be null the payee does not have a username`,
    },
  }),
})

const SettlementViaLn = new GT.Object({
  name: "SettlementViaIntraLn",
  fields: () => ({
    paymentSecret: {
      type: GT.NonNull(LnPaymentSecret),
    },
  }),
})

const SettlementViaOnChain = new GT.Object({
  name: "SettlementViaOnChain",
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
