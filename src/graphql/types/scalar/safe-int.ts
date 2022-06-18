import { GT } from "@graphql/index"

const MAX_INT = Number.MAX_SAFE_INTEGER
const MIN_INT = Number.MIN_SAFE_INTEGER

const SafeInt = GT.Scalar({
  name: "SafeInt",
  description:
    "Non-fractional signed whole numeric value between -(2^53) + 1 and 2^53 - 1",
  serialize: coerceSafeInt,
  parseValue: coerceSafeInt,
  parseLiteral(ast) {
    if (ast.kind === GT.Kind.INT) {
      const num = parseInt(ast.value, 10)
      if (num <= MAX_INT && num >= MIN_INT) {
        return num
      }
    }
    return null
  },
})

function coerceSafeInt(value: unknown) {
  if (value === "") {
    throw new Error(
      "SafeInt cannot represent non 53-bit signed integer value: (empty string)",
    )
  }
  const num = Number(value)
  if (num !== value || num > MAX_INT || num < MIN_INT) {
    throw new Error(
      "SafeInt cannot represent non 53-bit signed integer value: " + String(value),
    )
  }
  const int = Math.floor(num)
  if (int !== num) {
    throw new Error("SafeInt cannot represent non-integer value: " + String(value))
  }
  return int
}

export default SafeInt
