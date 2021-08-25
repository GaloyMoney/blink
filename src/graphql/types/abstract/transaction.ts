import { connectionDefinitions } from "graphql-relay"

import { GT } from "@graphql/index"
import Timestamp from "../scalar/timestamp"
import PaymentInitiationMethod from "../scalar/payment-initiation-method"
import SettlementMethod from "../scalar/settlement-method"
import SatAmount from "../scalar/sat-amount"
// import BtcUsdPrice from "../object/btc-usd-price"
// import Memo from "../scalar/memo"
// import TxStatus from "../scalar/tx-status"
// import TxDirection from "../scalar/tx-direction"

const ITransaction = new GT.Interface({
  name: "Transaction",
  fields: () => ({
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
    // priceAtSettlement: {
    //   type: GT.NonNull(BtcUsdPrice),
    // },
    // direction: {
    //   type: GT.NonNull(TxDirection),
    // },
    // memo: {
    //   type: Memo,
    // },
    // status: {
    //   type: TxStatus,
    // },
    createdAt: {
      type: GT.NonNull(Timestamp),
    },
  }),
})

export const { connectionType: TransactionConnection } = connectionDefinitions({
  nodeType: ITransaction,
})

export default ITransaction
