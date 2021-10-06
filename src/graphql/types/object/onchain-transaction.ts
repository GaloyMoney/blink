import { GT } from "@graphql/index"
import ITransaction from "../abstract/transaction"
import Memo from "../scalar/memo"
import OnChainAddress from "../scalar/on-chain-address"
import PaymentInitiationMethod from "../scalar/payment-initiation-method"
import SatAmount from "../scalar/sat-amount"
import SettlementMethod from "../scalar/settlement-method"
import Timestamp from "../scalar/timestamp"
// import TxDirection from "../scalar/tx-direction"
import TxStatus from "../scalar/tx-status"
// import BtcUsdPrice from "./btc-usd-price"
import { SettlementMethod as DomainSettlementMethod } from "@domain/wallets"

const OnChainTransaction = new GT.Object({
  name: "OnChainTransaction",
  interfaces: () => [ITransaction],
  isTypeOf: (source) => source.settlementVia === DomainSettlementMethod.OnChain,
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
    memo: {
      type: Memo,
    },
    status: {
      type: TxStatus,
    },
    createdAt: {
      type: GT.NonNull(Timestamp),
    },

    // Non-interface fields
    addresses: {
      type: GT.NonNullList(OnChainAddress),
    },
  }),
})

export default OnChainTransaction
