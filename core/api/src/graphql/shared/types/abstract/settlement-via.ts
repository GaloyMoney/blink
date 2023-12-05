import dedent from "dedent"

import OnChainTxHash from "../scalar/onchain-tx-hash"

import LnPaymentSecret from "../scalar/ln-payment-secret"

import { OnChain } from "@/app"

import { GT } from "@/graphql/index"

import { SettlementMethod } from "@/domain/wallets"

import WalletId from "@/graphql/shared/types/scalar/wallet-id"

import Username from "@/graphql/shared/types/scalar/username"

import LnPaymentPreImage from "@/graphql/shared/types/scalar/ln-payment-preimage"

import Timestamp from "@/graphql/shared/types/scalar/timestamp"

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
      resolve: (source) => source.revealedPreImage,
      deprecationReason:
        "Shifting property to 'preImage' to improve granularity of the LnPaymentSecret type",
    },
    preImage: {
      type: LnPaymentPreImage,
      resolve: (source) => source.revealedPreImage,
    },
  }),
})

const SettlementViaOnChain = GT.Object({
  name: "SettlementViaOnChain",
  isTypeOf: (source) => source.type === SettlementMethod.OnChain,
  fields: () => ({
    transactionHash: { type: OnChainTxHash },
    vout: { type: GT.Int },
    arrivalInMempoolEstimatedAt: {
      type: Timestamp,
      resolve: async (source) => {
        const estimation = await OnChain.getBatchInclusionEstimatedAt(source.parent.id)
        if (estimation instanceof Error) {
          return null
        }
        return estimation
      },
    },
  }),
})

const SettlementVia = GT.Union({
  name: "SettlementVia",
  types: () => [SettlementViaIntraLedger, SettlementViaLn, SettlementViaOnChain],
})

export default SettlementVia
