import { connectionDefinitions } from "graphql-relay"

import { GT } from "@graphql/index"
import Date from "../scalars/date"

const Transaction = new GT.Interface({
  name: "Transaction",
  fields: () => ({
    id: {
      type: GT.NonNullID,
    },
    createdAt: {
      type: GT.NonNull(Date),
    },
  }),
})

export const { connectionType: TransactionConnection } = connectionDefinitions({
  nodeType: Transaction,
})

export default Transaction
