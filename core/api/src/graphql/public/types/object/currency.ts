import { GT } from "@/graphql/index"

const Currency = GT.Object({
  name: "Currency",
  fields: () => ({
    id: {
      type: GT.NonNullID,
      resolve: (source) => source.code,
    },
    symbol: { type: GT.NonNull(GT.String) },
    name: { type: GT.NonNull(GT.String) },
    flag: { type: GT.NonNull(GT.String) },
    fractionDigits: { type: GT.NonNull(GT.Int) },
  }),
})

export default Currency
