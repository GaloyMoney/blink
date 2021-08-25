import { GT } from "@graphql/index"

const PaymentErrorCode = new GT.Enum({
  name: "PaymentErrorCode",
  values: {
    ACCOUNT_LOCKED: {},
    LIMIT_EXCEEDED: {},
    INSUFFICENT_BALANCE: {},
    INVOICE_PAID: {},

    // LN
    NO_LIQUIDITY: {},
    NO_ROUTE: {},
  },
})

export default PaymentErrorCode
