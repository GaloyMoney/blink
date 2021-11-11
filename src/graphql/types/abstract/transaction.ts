import dedent from "dedent"
import { connectionDefinitions } from "graphql-relay"

import { GT } from "@graphql/index"

import Memo from "../scalar/memo"
import PaymentInitiationMethod from "../scalar/payment-initiation-method"
import Price from "../object/price"
import SatAmount from "../scalar/sat-amount"
import SettlementMethod from "../scalar/settlement-method"
import Timestamp from "../scalar/timestamp"
import TxDirection, { txDirectionValues } from "../scalar/tx-direction"
import TxStatus from "../scalar/tx-status"

export const transactionInterfaceFields = {
  id: {
    type: GT.NonNullID,
  },
  initiationVia: {
    type: GT.NonNull(PaymentInitiationMethod),
    description: "From which protocol the payment has been initiated.",
  },
  settlementVia: {
    type: GT.NonNull(SettlementMethod),
    description: "To which protocol the payment has settled on.",
  },
  settlementAmount: {
    type: GT.NonNull(SatAmount),
    description: "Amount of sats paid by the user.",
  },
  settlementFee: {
    type: GT.NonNull(SatAmount),
  },
  settlementPrice: {
    type: GT.NonNull(Price),
    resolve: (source) => {
      const settlementUsdPerSatInCents = source.settlementUsdPerSat * 100
      console.warn(settlementUsdPerSatInCents, Math.round(settlementUsdPerSatInCents * 10 ** 4))
      return {
        formattedAmount: settlementUsdPerSatInCents.toString(),
        base: Math.round(settlementUsdPerSatInCents * 10 ** 4),
        offset: 4,
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
}

const ITransaction = new GT.Interface({
  name: "Transaction",
  fields: () => transactionInterfaceFields,
  description: dedent`Give details about an individual transaction.
    Galoy have a smart routing system which is automatically
    settling intraledger when both the payer and payee use the same wallet
    therefore it's possible the transactions is being initiated onchain
    or with lightning but settled intraledger.`,
})

export const { connectionType: TransactionConnection } = connectionDefinitions({
  nodeType: ITransaction,
})

export default ITransaction
