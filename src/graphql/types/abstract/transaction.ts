import dedent from "dedent"

import { GT } from "@graphql/index"

import Memo from "../scalar/memo"

import CentAmount from "../scalar/cent-amount"
import InitiationVia from "../abstract/initiation-via"
import SettlementVia from "../abstract/settlement-via"
import Timestamp from "../scalar/timestamp"
import TxDirection from "../scalar/tx-direction"
import TxStatus from "../scalar/tx-status"
import WalletCurrency from "../scalar/wallet-currency"
import Price from "../object/price"
import SatAmount from "../scalar/sat-amount"

const ITransaction = GT.Interface({
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
    // FIXME: make this union of SatAmount & CentAmount
    settlementAmount: {
      type: GT.NonNull(CentAmount),
      // type: GT.Union({
      //   name: "settlementAmount",
      //   types: () => [SatAmount, CentAmount],
      // }),
    },
    // FIXME: make this union of SatAmount & CentAmount
    settlementFee: {
      type: GT.NonNull(CentAmount),
      // type: GT.Union({
      //   name: "settlementFee",
      //   types: () => [SatAmount, CentAmount],
      // }),
    },
    settlementPrice: {
      type: GT.NonNull(Price),
    },
    settlementCurrency: {
      type: GT.NonNull(WalletCurrency),
      description: "Wallet currency for transaction.",
    },
    direction: {
      type: GT.NonNull(TxDirection),
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

export default ITransaction
