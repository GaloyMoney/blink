import { GT } from "@/graphql/index"

const DepositFeesInformation = GT.Object({
  name: "DepositFeesInformation",
  fields: () => ({
    minBankFee: { type: GT.NonNull(GT.String) },
    minBankFeeThreshold: {
      description: "below this amount minBankFee will be charged",
      type: GT.NonNull(GT.String),
    },
    ratio: {
      description: "ratio to charge as basis points above minBankFeeThreshold amount",
      type: GT.NonNull(GT.String),
    },
  }),
})

const FeesInformation = GT.Object({
  name: "FeesInformation",
  fields: () => ({
    deposit: { type: GT.NonNull(DepositFeesInformation) },
  }),
})

export default FeesInformation
