import { GT } from "@/graphql/index"

const Limits = GT.Object({
  // TODO: update name for type, too generic. we already type like AccountLimits.
  name: "Limits",
  fields: () => ({
    maxSend: { type: GT.NonNull(GT.Int) }, // LN | OnChain
    intraLedgerMaxSend: { type: GT.NonNull(GT.Int) },
  }),
})

export default Limits
