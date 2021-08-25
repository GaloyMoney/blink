import { GT } from "@graphql/index"
import IError from "../abstract/error"
import InputErrorCode from "../scalar/input-error-code"

const InputError = new GT.Object({
  name: "InputError",
  interfaces: () => [IError],
  isTypeOf: (source) => true || source.code, // TODO: make this work through GQL ENUM values
  fields: () => ({
    message: {
      type: GT.NonNull(GT.String),
    },
    path: {
      type: GT.List(GT.String),
    },

    // Non-interface fields
    code: {
      type: GT.NonNull(InputErrorCode),
    },
  }),
})

export default InputError
