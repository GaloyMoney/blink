import { GT } from "@graphql/index"
import Transaction from "../abstract/transaction"
import Timestamp from "../scalars/timestamp"

const IntraLedgerTransaction = new GT.Object({
  name: "IntraLedgerTransaction",
  interfaces: () => [Transaction],
  isTypeOf: (source) => source.type === "intra-ledger", // TODO: make this work
  fields: () => ({
    id: {
      type: GT.NonNullID,
    },
    createdAt: {
      type: GT.NonNull(Timestamp),
    },
  }),
})

export default IntraLedgerTransaction
