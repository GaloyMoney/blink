import { ResultAsync } from "neverthrow"

export const toTypedError = <ErrorType>({
  unknownMessage,
  _type,
}: {
  unknownMessage: string
  _type: ErrorType
}): ErrorConverter<ErrorType> => {
  return (error: any): ErrorWithMessage<ErrorType> => {
    if (error.message && typeof error.message == "string") {
      return { _type, message: error.message as string }
    }
    return { _type, message: unknownMessage }
  }
}

export const unsafeThrowErrAsync = async <T, EType>(
  result: ResultAsync<T, ErrorWithMessage<EType>>,
): Promise<T> => {
  const awaited = await result
  if (awaited.isErr()) {
    throw new Error(awaited.error.message)
  }
  return awaited.value
}
