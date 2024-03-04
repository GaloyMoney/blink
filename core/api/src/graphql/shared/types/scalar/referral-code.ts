import { checkedToReferralCode } from "@/domain/accounts"
import { InputValidationError } from "@/graphql/error"
import { GT } from "@/graphql/index"

const ReferralCode = GT.Scalar({
  name: "ReferralCode",
  description: "ReferralCode provided by a community",
  parseValue(value) {
    if (typeof value !== "string") {
      return new InputValidationError({ message: "Invalid type for ReferralCode" })
    }
    return validReferralValue(value)
  },
  parseLiteral(ast) {
    if (ast.kind === GT.Kind.STRING) {
      return validReferralValue(ast.value)
    }
    return new InputValidationError({ message: "Invalid type for ReferralCode" })
  },
})

function validReferralValue(value: string) {
  const ReferralCodeNumberValid = checkedToReferralCode(value)
  if (ReferralCodeNumberValid instanceof Error)
    return new InputValidationError({
      message: "ReferralCode is not a valid",
    })
  return ReferralCodeNumberValid
}

export default ReferralCode
