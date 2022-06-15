import dedent from "dedent"

import { GT } from "@graphql/index"
import { connectionDefinitions } from "@graphql/connections"

import { SAT_PRICE_PRECISION_OFFSET } from "@config"

import Memo from "../scalar/memo"

import InitiationVia from "../abstract/initiation-via"
import SettlementVia from "../abstract/settlement-via"
import Timestamp from "../scalar/timestamp"
import TxDirection, { txDirectionValues } from "../scalar/tx-direction"
import TxStatus from "../scalar/tx-status"
import SignedAmount from "../scalar/signed-amount"
import WalletCurrency from "../scalar/wallet-currency"

import Price from "./price"

const Transaction = GT.Object<WalletTransaction>({
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
      type: GT.NonNull(SignedAmount),
      description: "Amount of the settlement currency sent or received.",
    },
    settlementFee: {
      type: GT.NonNull(SignedAmount),
    },
    settlementPrice: {
      type: GT.NonNull(Price),
      resolve: (source) => {
        const displayCurrencyPerSettlementCurrencyUnitInCents =
          source.displayCurrencyPerSettlementCurrencyUnit * 100
        return {
          formattedAmount: displayCurrencyPerSettlementCurrencyUnitInCents.toString(),
          base: Math.round(
            displayCurrencyPerSettlementCurrencyUnitInCents *
              10 ** SAT_PRICE_PRECISION_OFFSET,
          ),
          offset: SAT_PRICE_PRECISION_OFFSET,
          currencyUnit: "USDCENT",
        }
      },
      description: "Price in USDCENT/SETTLEMENTUNIT at time of settlement.",
    },
    settlementCurrency: {
      type: GT.NonNull(WalletCurrency),
      description: "Wallet currency for transaction.",
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
