import { GT } from "@graphql/index"

const PaymentErrorCode = GT.Enum({
  name: "PaymentErrorCode",
  values: {
    ACCOUNT_LOCKED: {},
    LIMIT_EXCEEDED: {},
    INSUFFICIENT_BALANCE: {},
    INVOICE_PAID: {},

    // LN
    NO_LIQUIDITY: {},
    NO_ROUTE: {},
  },
})

export default PaymentErrorCode
