import { checkedToPhoneNumber } from "@/domain/users"
import { InputValidationError } from "@/graphql/error"
import { GT } from "@/graphql/index"

const Phone = GT.Scalar({
  name: "Phone",
  description: "Phone number which includes country code",
  parseValue(value) {
    if (typeof value !== "string") {
      return new InputValidationError({ message: "Invalid type for Phone" })
    }
    return validPhoneValue(value)
  },
  parseLiteral(ast) {
    if (ast.kind === GT.Kind.STRING) {
      return validPhoneValue(ast.value)
    }
    return new InputValidationError({ message: "Invalid type for Phone" })
  },
})

function validPhoneValue(value: string) {
  const phoneNumberValid = checkedToPhoneNumber(value)
  if (phoneNumberValid instanceof Error)
    return new InputValidationError({
      message: "Phone number is not a valid phone number",
    })
  return phoneNumberValid
}

export default Phone
