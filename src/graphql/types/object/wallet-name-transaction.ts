import { GT } from "@graphql/index"
import ITransaction from "../abstract/transaction"
import PaymentInitiationMethod from "../scalar/payment-initiation-method"
import SatAmount from "../scalar/sat-amount"
import SettlementMethod from "../scalar/settlement-method"
import Timestamp from "../scalar/timestamp"
// import Memo from "../scalar/memo"
// import TxDirection from "../scalar/tx-direction"
// import TxStatus from "../scalar/tx-status"
// import BtcUsdPrice from "./btc-usd-price"
import WalletName from "../scalar/wallet-name"

const WalletNameTransaction = new GT.Object({
  name: "WalletNameTransaction",
  interfaces: () => [ITransaction],
  isTypeOf: (source) => source.type === "wallet-name", // TODO: make this work
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
    recipient: {
      type: WalletName,
      description: `Settlement destination:
  Could be null when originalDestination is onChain/LN
  and the payeee does not have a WalletName`,
    },
  }),
})

export default WalletNameTransaction
