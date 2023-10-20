import { InputValidationError } from "@/graphql/error"
import { GT } from "@/graphql/index"

const isNumber = (value: string) => /^-?(\d+|\d*\.\d+)$/.test(value)

const SignedDisplayMajorAmount = GT.Scalar({
  name: "SignedDisplayMajorAmount",
  description:
    "A string amount (of a currency) that can be negative (e.g. in a transaction)",
  parseValue(value) {
    if (typeof value !== "string") {
      return new InputValidationError({
        message: "Invalid type for SignedDisplayMajorAmount",
      })
    }
    return validSignedDisplayMajorAmount(value)
  },
  parseLiteral(ast) {
    if (ast.kind === GT.Kind.INT || ast.kind === GT.Kind.FLOAT) {
      return validSignedDisplayMajorAmount(ast.value)
    }
    return new InputValidationError({
      message: "Invalid type for SignedDisplayMajorAmount",
    })
  },
})

function validSignedDisplayMajorAmount(
  value: string | number,
): string | CustomGraphQLError {
  const numberValue = typeof value === "number" ? `${value}` : value

  if (isNumber(numberValue)) {
    return numberValue
  }
  return new InputValidationError({
    message: "Invalid value for SignedDisplayMajorAmount",
  })
}

export default SignedDisplayMajorAmount
