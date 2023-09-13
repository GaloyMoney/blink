import { InputValidationError } from "@graphql/error"
import { GT } from "@graphql/index"

const PushNotificationSubType = GT.Scalar({
  name: "PushNotificationSubType",
  parseValue(value) {
    if (typeof value !== "string") {
      return new InputValidationError({
        message: "Invalid type for PushNotificationSubType",
      })
    }
    return validPushNotificationSubType(value)
  },
  parseLiteral(ast) {
    if (ast.kind === GT.Kind.STRING) {
      return validPushNotificationSubType(ast.value)
    }
    return new InputValidationError({
      message: "Invalid type for PushNotificationSubType",
    })
  },
})

function validPushNotificationSubType(
  value: string,
): PushNotificationSubType | InputValidationError {
  return value as PushNotificationSubType
}

export default PushNotificationSubType
