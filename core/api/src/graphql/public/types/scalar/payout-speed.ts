import { PayoutSpeed as DomainPayoutSpeed } from "@/domain/bitcoin/onchain"
import { GT } from "@/graphql/index"

const PayoutSpeed = GT.Enum({
  name: "PayoutSpeed",
  values: {
    FAST: { value: DomainPayoutSpeed.Fast },
  },
})

export default PayoutSpeed
