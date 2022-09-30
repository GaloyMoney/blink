import { CustomApolloErrorCode } from "@graphql/error"
import { GT } from "@graphql/index"

import IError from "../abstract/error"
import AppErrorCode from "../scalar/app-error-code"

const AppError = GT.Object({
  name: "AppError",
  interfaces: () => [IError],
  isTypeOf: (source) => Object.values(CustomApolloErrorCode).includes(source.code),
  fields: () => ({
    message: {
      type: GT.NonNull(GT.String),
    },
    path: {
      type: GT.List(GT.String),
    },

    // Non-interface fields
    code: {
      type: GT.NonNull(AppErrorCode),
    },
  }),
})

export default AppError
