import { GT } from "@graphql/index"

const Limits = GT.Object({
  name: "Limits",
  fields: () => ({
    maxSend: { type: GT.NonNull(GT.Int) }, // LN | OnChain
    intraLedgerMaxSend: { type: GT.NonNull(GT.Int) },
  }),
})

export default Limits
