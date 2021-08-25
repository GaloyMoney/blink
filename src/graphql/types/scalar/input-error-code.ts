import { GT } from "@graphql/index"

const InputErrorCode = new GT.Enum({
  name: "InputErrorCode",
  values: {
    INVALID_INPUT: {},
    VALUE_TOO_SHORT: {},
    VALUE_TOO_LONG: {},
    VALUE_NOT_ALLOWED: {},
  },
})

export default InputErrorCode
