import { GT } from "@graphql/index"
import SatAmount from "@graphql/types/scalar/sat-amount"

const PsbtDetail = GT.Object({
  name: "PsbtDetail",
  fields: () => ({
    transaction: { type: GT.NonNull(GT.String) },
    fee: { type: GT.NonNull(SatAmount) },
  }),
})

export default PsbtDetail
