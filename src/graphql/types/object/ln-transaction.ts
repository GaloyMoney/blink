import { GT } from "@graphql/index"
import Transaction from "../abstract/transaction"
import Timestamp from "../scalar/timestamp"

const LnTransaction = new GT.Object({
  name: "LnTransaction",
  interfaces: () => [Transaction],
  isTypeOf: (source) => true || source.type === "on-chain", // TODO: make this work
  fields: () => ({
    id: {
      type: GT.NonNullID,
    },
    createdAt: {
      type: GT.NonNull(Timestamp),
    },
  }),
})

export default LnTransaction
