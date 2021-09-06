import { GT } from "@graphql/index"

const ExchangeCurrency = new GT.Enum({
  name: "ExchangeCurrency",
  values: {
    SAT: {},
    USD: {},
  },
})

export default ExchangeCurrency
