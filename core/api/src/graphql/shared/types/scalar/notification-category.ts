import { InputValidationError } from "@/graphql/error"
import { GT } from "@/graphql/index"

const NotificationCategory = GT.Scalar({
  name: "NotificationCategory",
  parseValue(value) {
    if (typeof value !== "string") {
      return new InputValidationError({
        message: "Invalid type for NotificationCategory",
      })
    }
    return validNotificationCategory(value)
  },
  parseLiteral(ast) {
    if (ast.kind === GT.Kind.STRING) {
      return validNotificationCategory(ast.value)
    }
    return new InputValidationError({ message: "Invalid type for NotificationCategory" })
  },
})

function validNotificationCategory(
  value: string,
): NotificationCategory | InputValidationError {
  return value as NotificationCategory
}

export default NotificationCategory
