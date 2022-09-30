import { InputErrorCode, OtherErrorCode, PaymentErrorCode } from "@graphql/error"
import { GT } from "@graphql/index"

import AppErrorCode from "../scalar/app-error-code"

const IError = GT.Interface({
  name: "Error",
  fields: () => ({
    message: {
      type: GT.NonNull(GT.String),
    },
    path: {
      type: GT.List(GT.String),
    },
    code: {
      type: GT.NonNull(AppErrorCode),
    },
  }),
})

const PaymentError = GT.Object({
  name: "PaymentError",
  interfaces: () => [IError],
  isTypeOf: (source) => Object.values(PaymentErrorCode).includes(source.code),
  fields: () => ({
    message: {
      type: GT.NonNull(GT.String),
    },
    path: {
      type: GT.List(GT.String),
    },
    code: {
      type: GT.NonNull(AppErrorCode),
    },
  }),
})

const InputError = GT.Object({
  name: "InputError",
  interfaces: () => [IError],
  isTypeOf: (source) => Object.values(InputErrorCode).includes(source.code),
  fields: () => ({
    message: {
      type: GT.NonNull(GT.String),
    },
    path: {
      type: GT.List(GT.String),
    },
    code: {
      type: GT.NonNull(AppErrorCode),
    },
  }),
})

const OtherError = GT.Object({
  name: "OtherError",
  interfaces: () => [IError],
  // TODO: make this work in e2e tests with InvalidWalletId validation
  isTypeOf: (source) => Object.values(OtherErrorCode).includes(source.code),
  fields: () => ({
    message: {
      type: GT.NonNull(GT.String),
    },
    path: {
      type: GT.List(GT.String),
    },
    code: {
      type: GT.NonNull(AppErrorCode),
    },
  }),
})

const AppError = GT.Union({
  name: "AppError",
  types: () => [PaymentError, InputError, OtherError],
})

export default AppError
