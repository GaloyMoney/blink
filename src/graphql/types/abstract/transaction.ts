import { connectionDefinitions } from "graphql-relay"

import { GT } from "@graphql/index"
import Date from "../scalars/date"
// import Memo from "../scalars/memo"
// import TxStatus from "../scalars/tx-status"

const Transaction = new GT.Interface({
  name: "Transaction",
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

export const { connectionType: TransactionConnection } = connectionDefinitions({
  nodeType: Transaction,
})

export default Transaction
