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
    //TODO: Does the amount include fees.
    description: "Amount of sats paid by the user.",
  },
  settlementFee: {
    //TODO: Fees will be incorrect if probing fails and there is a fee refund.
    type: GT.NonNull(SatAmount),
  },
  settlementPrice: {
    type: GT.NonNull(Price),
    resolve: (source) => {
      const settlementUsdPerSatInCents = source.settlementUsdPerSat * 100
      return {
        formattedAmount: settlementUsdPerSatInCents.toString(),
        base: Math.round(settlementUsdPerSatInCents * 10 ** 4),
        //TODO: What is offset?  What is difference between offset + sats/usd?
        offset: 4,
        //TODO: Is current offset 0.000001 to the dollar which would be 4 for offset and 2 for usd/cent?
        // Why not use offset 6 and USD?
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
  description:
    "Give details about an individual transaction.\nGaloy have a smart routing system which is automatically settling intraledger when both the payer and payee use the same wallet - therefore it's possible the transactions is being initiated onchain or with lightning but settled intraledger.",
})

export const { connectionType: TransactionConnection } = connectionDefinitions({
  nodeType: ITransaction,
})

export default ITransaction
