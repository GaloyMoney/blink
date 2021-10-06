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
  },
  settlementVia: {
    type: GT.NonNull(SettlementMethod),
  },
  settlementAmount: {
    type: GT.NonNull(SatAmount),
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
        base: Math.round(settlementUsdPerSatInCents * 10 ** 4),
        offset: 4,
        currencyUnit: "USDCENT",
      }
    },
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
})

export const { connectionType: TransactionConnection } = connectionDefinitions({
  nodeType: ITransaction,
})

export default ITransaction
