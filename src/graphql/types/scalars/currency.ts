import { GT } from "@graphql/index"

const Currency = new GT.Enum({
  name: "Currency",
  values: {
    USD: {},
    BTC: {},
  },
})

export default Currency
