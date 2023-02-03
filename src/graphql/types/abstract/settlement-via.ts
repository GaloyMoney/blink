import dedent from "dedent"

import { GT } from "@graphql/index"

import { SettlementMethod } from "@domain/wallets"

import WalletId from "../scalar/wallet-id"
import Username from "../scalar/username"
import OnChainTxHash from "../scalar/onchain-tx-hash"
import LnPaymentPreImage from "../scalar/ln-payment-preimage"
import LnPaymentSecret from "../scalar/ln-payment-secret"

const SettlementViaIntraLedger = GT.Object({
  name: "SettlementViaIntraLedger",
  isTypeOf: (source) => source.type === SettlementMethod.IntraLedger,
  fields: () => ({
    counterPartyWalletId: {
      // type: GT.NonNull(WalletId),
      type: WalletId,
    },
    counterPartyUsername: {
      type: Username,
      description: dedent`Settlement destination: Could be null if the payee does not have a username`,
    },
  }),
})

const SettlementViaLn = GT.Object({
  name: "SettlementViaLn",
  isTypeOf: (source: SettlementViaLn) => source.type === SettlementMethod.Lightning,
  fields: () => ({
    paymentSecret: {
      type: LnPaymentSecret,
      resolve: (source: SettlementViaLn) => source.revealedPreImage,
      deprecationReason:
        "Shifting property to 'preImage' to improve granularity of the LnPaymentSecret type",
    },
    preImage: {
      type: LnPaymentPreImage,
      resolve: (source: SettlementViaLn) => source.revealedPreImage,
    },
  }),
})

const SettlementViaOnChain = GT.Object({
  name: "SettlementViaOnChain",
  isTypeOf: (source) => source.type === SettlementMethod.OnChain,
  fields: () => ({
    transactionHash: {
      type: GT.NonNull(OnChainTxHash),
    },
  }),
})

const SettlementVia = GT.Union({
  name: "SettlementVia",
  types: () => [SettlementViaIntraLedger, SettlementViaLn, SettlementViaOnChain],
})

export default SettlementVia
