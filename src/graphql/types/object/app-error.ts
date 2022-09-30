import { GT } from "@graphql/index"

import IError from "../abstract/error"
import AppErrorCode from "../scalar/app-error-code"

const AppError = GT.Object({
  name: "AppError",
  interfaces: () => [IError],
  // TODO: make this work in e2e tests with InvalidWalletId validation
  // isTypeOf: (source) => Object.values(CustomApolloErrorCode).includes(source.code),
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
