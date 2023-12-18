export const PartialResult = {
  ok: <T>(result: T): PartialResult<T> => ({
    result,
    partialResult: true,
  }),
  partial: <T>(result: T, error: ApplicationError): PartialResult<T> => ({
    result,
    error,
    partialResult: true,
  }),
  err: <T>(error: ApplicationError): PartialResult<T> => ({
    result: null,
    error,
    partialResult: true,
  }),
}
