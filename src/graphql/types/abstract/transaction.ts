import { connectionDefinitions } from "graphql-relay"

import { GT } from "@graphql/index"
import Timestamp from "../scalars/timestamp"

const Transaction = new GT.Interface({
  name: "Transaction",
  fields: () => ({
    id: {
      type: GT.NonNullID,
    },
    createdAt: {
      type: GT.NonNull(Timestamp),
    },
  }),
})

export const { connectionType: TransactionConnection } = connectionDefinitions({
  nodeType: Transaction,
})

export default Transaction
