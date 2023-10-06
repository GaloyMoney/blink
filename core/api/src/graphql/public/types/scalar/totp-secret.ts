import { GT } from "@/graphql/index"

const TotpSecret = GT.Scalar({
  name: "TotpSecret",
  description: "A secret to generate time-based one-time password",
  serialize(value) {
    if (typeof value !== "string") {
      return "Invalid value for TotpSecret"
    }
    if (value.length !== 32) {
      return "Invalid value for TotpSecret"
    }
    return value as TotpSecret
  },
})

export default TotpSecret
