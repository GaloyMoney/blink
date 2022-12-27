import { GT } from "@graphql/index"

const Currency = GT.Object({
  name: "Currency",
  fields: () => ({
    code: { type: GT.NonNull(GT.String) },
    symbol: { type: GT.NonNull(GT.String) },
    name: { type: GT.NonNull(GT.String) },
    flag: { type: GT.NonNull(GT.String) },
  }),
})

export default Currency
