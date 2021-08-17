export const PartialResult = {
  ok: <T>(result: T): PartialResult<T> => ({
    result,
  }),
  partial: <T>(result: T, error: ApplicationError): PartialResult<T> => ({
    result,
    error,
  }),
  err: <T>(error: ApplicationError): PartialResult<T> => ({
    result: null,
    error,
  }),
}
