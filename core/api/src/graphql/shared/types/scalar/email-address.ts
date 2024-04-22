import { checkedToEmailAddress } from "@/domain/users"
import { InputValidationError } from "@/graphql/error"
import { GT } from "@/graphql/index"

const EmailAddress = GT.Scalar({
  name: "EmailAddress",
  description: "Email address",
  parseValue(value) {
    if (typeof value !== "string") {
      return new InputValidationError({ message: "Invalid type for Email" })
    }
    return validEmailValue(value)
  },
  parseLiteral(ast) {
    if (ast.kind === GT.Kind.STRING) {
      return validEmailValue(ast.value)
    }
    return new InputValidationError({ message: "Invalid type for Email" })
  },
})

function validEmailValue(value: string) {
  const emailValid = checkedToEmailAddress(value)
  if (emailValid instanceof Error)
    return new InputValidationError({
      message: "Email is not a valid email address",
    })
  return emailValid
}

export default EmailAddress
