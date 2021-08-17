import { GT } from "@graphql/index"
import Transaction from "../abstract/transaction"
import Date from "../scalars/date"

const IntraLedgerTransaction = new GT.Object({
  name: "IntraLedgerTransaction",
  interfaces: () => [Transaction],
  isTypeOf: (source) => source.type === "intra-ledger", // TODO: make this work
  fields: () => ({
    id: {
      type: GT.NonNullID,
    },
    createdAt: {
      type: GT.NonNull(Date),
    },
  }),
})

export default IntraLedgerTransaction
