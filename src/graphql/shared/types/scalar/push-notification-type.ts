import { InputValidationError } from "@graphql/error"
import { GT } from "@graphql/index"

const PushNotificationType = GT.Scalar({
  name: "PushNotificationType",
  parseValue(value) {
    if (typeof value !== "string") {
      return new InputValidationError({
        message: "Invalid type for PushNotificationType",
      })
    }
    return validPushNotificationType(value)
  },
  parseLiteral(ast) {
    if (ast.kind === GT.Kind.STRING) {
      return validPushNotificationType(ast.value)
    }
    return new InputValidationError({ message: "Invalid type for PushNotificationType" })
  },
})

function validPushNotificationType(
  value: string,
): PushNotificationType | InputValidationError {
  return value as PushNotificationType
}

export default PushNotificationType
