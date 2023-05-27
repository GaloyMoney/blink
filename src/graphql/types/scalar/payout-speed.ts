import { PayoutSpeed as DomainPayoutSpeed } from "@domain/bitcoin/onchain"
import { GT } from "@graphql/index"

const PayoutSpeed = GT.Enum({
  name: "PayoutSpeed",
  values: {
    FAST: { value: DomainPayoutSpeed.Fast },
    MEDIUM: { value: DomainPayoutSpeed.Medium },
    SLOW: { value: DomainPayoutSpeed.Slow },
  },
})

export default PayoutSpeed
