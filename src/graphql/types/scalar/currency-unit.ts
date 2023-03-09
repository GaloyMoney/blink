import { GT } from "@graphql/index"

const CurrencyUnit = GT.Enum({
  name: "CurrencyUnit",
  values: {
    MINOR: { value: "MINOR" },
    MAJOR: { value: "MAJOR" },
  },
})

export default CurrencyUnit
