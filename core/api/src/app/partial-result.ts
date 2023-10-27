export const PartialResult = {
  ok: <T>(result: T): PartialResult<T> => ({
    result,
    type: PartialResultType.Ok,
  }),
  partial: <T>(result: T, error: ApplicationError): PartialResult<T> => ({
    result,
    error,
    type: PartialResultType.Partial,
  }),
  err: <T>(error: ApplicationError): PartialResult<T> => ({
    result: null,
    error,
    type: PartialResultType.Err,
  }),
}

export const PartialResultType = {
  Partial: "Partial",
  Ok: "Ok",
  Err: "Err",
} as const
