import { GT } from "@graphql/index"

import { BtcTransactionConnection } from "./btc-transaction"
import { UsdTransactionConnection } from "./usd-transaction"

const TransactionConnection = GT.Union({
  name: "TransactionConnection",
  types: () => [BtcTransactionConnection, UsdTransactionConnection],
})

export default TransactionConnection
