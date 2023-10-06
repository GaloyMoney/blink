import { GT } from "@/graphql/index"
import { InputValidationError } from "@/graphql/error"

const CountryCode = GT.Scalar<string | InputValidationError>({
  name: "CountryCode",
  description: "A CCA2 country code (ex US, FR, etc)",
  parseValue(value) {
    if (typeof value !== "string") {
      return new InputValidationError({ message: "Invalid type for CountryCode" })
    }
    return validCountryCodeValue(value)
  },
  parseLiteral(ast) {
    if (ast.kind === GT.Kind.STRING) {
      return validCountryCodeValue(ast.value)
    }
    return new InputValidationError({ message: "Invalid type for CountryCode" })
  },
})

function validCountryCodeValue(value: string): string | InputValidationError {
  if (!value || value.length !== 2) {
    return new InputValidationError({ message: "Invalid value for CountryCode" })
  }
  return value.toUpperCase()
}

export default CountryCode
