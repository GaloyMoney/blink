import { GT } from "@graphql/index"

const PaymentInitiationMethod = new GT.Enum({
  name: "PaymentInitiationMethod",
  values: {
    WALLET_NAME: {},
    ON_CHAIN: {},
    LIGHTNING: {},
  },
})

export default PaymentInitiationMethod
