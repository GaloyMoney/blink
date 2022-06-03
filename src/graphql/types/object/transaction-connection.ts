import { connectionDefinitions } from "@graphql/connections"

import Transaction from "../abstract/transaction"

const { connectionType: TransactionConnection } = connectionDefinitions({
  nodeType: Transaction,
})

export default TransactionConnection
