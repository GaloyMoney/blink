import { GT } from "@graphql/index"
import Transaction from "../abstract/transaction"
import Date from "../scalars/date"

const OnChainTransaction = new GT.Object({
  name: "OnChainTransaction",
  interfaces: () => [Transaction],
  isTypeOf: (source) => source.type === "on-chain", // TODO: make this work
  fields: () => ({
    id: {
      type: GT.NonNullID,
    },
    createdAt: {
      type: GT.NonNull(Date),
    },
  }),
})

export default OnChainTransaction
