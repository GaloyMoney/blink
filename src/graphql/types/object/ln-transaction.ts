import { GT } from "@graphql/index"
import Transaction from "../abstract/transaction"
import Date from "../scalars/date"
// import Memo from "../scalars/memo"
// import TxStatus from "../scalars/tx-status"

const LnTransaction = new GT.Object({
  name: "LnTransaction",
  interfaces: () => [Transaction],
  isTypeOf: (source) => true || source.type === "on-chain", // TODO: make this work
  fields: () => ({
    id: {
      type: GT.NonNullID,
    },

    // TODO: amount/fee/currency

    // memo: {
    //   type: Memo,
    // },
    // status: {
    //   type: GT.NonNull(TxStatus),
    // },
    createdAt: {
      type: GT.NonNull(Date),
    },
  }),
})

export default LnTransaction
