import dedent from "dedent"
import { connectionDefinitions } from "graphql-relay"

import { GT } from "@graphql/index"

import { SAT_PRICE_PRECISION_OFFSET } from "@config"

import Memo from "../scalar/memo"

import SatAmount from "../scalar/sat-amount"
import InitiationVia from "../abstract/initiation-via"
import SettlementVia from "../abstract/settlement-via"
import Timestamp from "../scalar/timestamp"
import TxDirection, { txDirectionValues } from "../scalar/tx-direction"
import TxStatus from "../scalar/tx-status"

import Price from "./price"

const Transaction = GT.Object({
  name: "Transaction",
  description: dedent`Give details about an individual transaction.
  Galoy have a smart routing system which is automatically
  settling intraledger when both the payer and payee use the same wallet
  therefore it's possible the transactions is being initiated onchain
  or with lightning but settled intraledger.`,
  fields: () => ({
    id: {
      type: GT.NonNullID,
    },
    initiationVia: {
      type: GT.NonNull(InitiationVia),
      description: "From which protocol the payment has been initiated.",
    },
    settlementVia: {
      type: GT.NonNull(SettlementVia),
      description: "To which protocol the payment has settled on.",
    },
    settlementAmount: {
      type: GT.NonNull(SatAmount),
      description: "Amount of sats sent or received.",
    },
    settlementFee: {
      type: GT.NonNull(SatAmount),
    },
    settlementPrice: {
      type: GT.NonNull(Price),
      resolve: (source) => {
        const settlementUsdPerSatInCents = source.settlementUsdPerSat * 100
        return {
          formattedAmount: settlementUsdPerSatInCents.toString(),
          base: Math.round(settlementUsdPerSatInCents * 10 ** SAT_PRICE_PRECISION_OFFSET),
          offset: SAT_PRICE_PRECISION_OFFSET,
          currencyUnit: "USDCENT",
        }
      },
      description: "Price in USDCENT/SATS at time of settlement.",
    },
    direction: {
      type: GT.NonNull(TxDirection),
      resolve: (source) =>
        source.settlementAmount > 0 ? txDirectionValues.RECEIVE : txDirectionValues.SEND,
    },
    status: {
      type: GT.NonNull(TxStatus),
    },
    memo: {
      type: Memo,
    },
    createdAt: {
      type: GT.NonNull(Timestamp),
    },
  }),
})

export const { connectionType: TransactionConnection } = connectionDefinitions({
  nodeType: Transaction,
})

export default Transaction
