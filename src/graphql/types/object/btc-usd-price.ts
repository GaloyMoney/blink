import { GT } from "@graphql/index"

const BtcUsdPrice = new GT.Object({
  name: "BtcUsdPrice",
  fields: () => ({
    price: {
      type: GT.NonNull(SatAmount),
    },
  }),
})

export default BtcUsdPrice
