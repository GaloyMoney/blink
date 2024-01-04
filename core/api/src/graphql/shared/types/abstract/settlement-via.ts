import dedent from "dedent"

import OnChainTxHash from "../scalar/onchain-tx-hash"

import LnPaymentSecret from "../scalar/ln-payment-secret"

import { OnChain, Transactions } from "@/app"

import { ErrorLevel } from "@/domain/shared"
import { SettlementMethod } from "@/domain/wallets"

import { recordExceptionInCurrentSpan } from "@/services/tracing"

import { GT } from "@/graphql/index"
import Username from "@/graphql/shared/types/scalar/username"
import WalletId from "@/graphql/shared/types/scalar/wallet-id"
import Timestamp from "@/graphql/shared/types/scalar/timestamp"
import LnPaymentPreImage from "@/graphql/shared/types/scalar/ln-payment-preimage"

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
    preImage: {
      type: LnPaymentPreImage,
      resolve: async (source) => {
        if (source.parent.initiationVia.type !== "lightning") {
          return null
        }
        if (source.parent.settlementAmount > 0) {
          return null
        }

        const preImage = await Transactions.getInvoicePreImageByHash({
          paymentHash: source.parent.initiationVia.paymentHash,
        })
        if (preImage instanceof Error) {
          recordExceptionInCurrentSpan({
            error: preImage,
            level: ErrorLevel.Warn,
            attributes: { ["error.parentId"]: source.parent.id },
          })
          return null
        }
        return preImage
      },
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
        if (source.parent.settlementAmount > 0) {
          return null
        }
        const estimation = await OnChain.getBatchInclusionEstimatedAt({
          ledgerTransactionId: source.parent.id,
        })
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
