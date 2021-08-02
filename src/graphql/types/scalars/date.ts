import { GT } from "@graphql/index"

const Date = new GT.Scalar({
  name: "Date",
  serialize(value) {
    return value.getTime()
  },
  // TODO: db work for dates
  parseValue(value) {
    return new Date(value)
  },
  parseLiteral(ast) {
    if (ast.kind === GT.Kind.STRING) {
      return new Date(parseInt(ast.value, 10))
    }
    return null
  },
})

export default Date
