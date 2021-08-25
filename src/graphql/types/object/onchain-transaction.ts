import { GT } from "@graphql/index"
import ITransaction from "../abstract/transaction"
// import Memo from "../scalar/memo"
import OnChainAddress from "../scalar/on-chain-address"
import PaymentInitiationMethod from "../scalar/payment-initiation-method"
import SatAmount from "../scalar/sat-amount"
import SettlementMethod from "../scalar/settlement-method"
import Timestamp from "../scalar/timestamp"
// import TxDirection from "../scalar/tx-direction"
// import TxStatus from "../scalar/tx-status"
// import BtcUsdPrice from "./btc-usd-price"

const OnChainTransaction = new GT.Object({
  name: "OnChainTransaction",
  interfaces: () => [ITransaction],
  isTypeOf: (source) => source.type === "on-chain", // TODO: make this work
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

    // Non-interface fields
    address: {
      type: GT.NonNull(OnChainAddress),
    },
  }),
})

export default OnChainTransaction
