import { GT } from "@graphql/index"
import Currency from "../scalar/currency"

const GlobalSettings = new GT.Object({
  name: "GlobalSettings",
  fields: () => ({
    baseCurrency: { type: GT.NonNull(Currency) },
    depositFeePercentage: { type: GT.NonNull(GT.Float) },
  }),
})

export default GlobalSettings
