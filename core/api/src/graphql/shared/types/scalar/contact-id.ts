import { checkedToContactId } from "@/domain/contacts"
import { InputValidationError } from "@/graphql/error"
import { GT } from "@/graphql/index"

const ContactId = GT.Scalar<ContactId | InputValidationError>({
  name: "ContactId",
  description: "Unique identifier of a contact",
  parseValue(value) {
    if (typeof value !== "string") {
      return new InputValidationError({ message: "Invalid type for ContactId" })
    }
    return validContactIdValue(value)
  },
  parseLiteral(ast) {
    if (ast.kind === GT.Kind.STRING) {
      return validContactIdValue(ast.value)
    }
    return new InputValidationError({ message: "Invalid type for ContactId" })
  },
})

function validContactIdValue(value: string): ContactId | InputValidationError {
  const checkedContactId = checkedToContactId(value)
  if (checkedContactId instanceof Error) {
    return new InputValidationError({ message: "Invalid value for ContactId" })
  }
  return checkedContactId
}

export default ContactId
