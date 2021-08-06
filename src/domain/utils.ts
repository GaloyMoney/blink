export const toTypedError = <ErrorType>({
  unknownMessage,
  _type,
}): ErrorConverter<ErrorType> => {
  return (error: any): ErrorWithMessage<ErrorType> => {
    if (error.message && typeof error.message == "string") {
      return { _type, message: error.message as string }
    } else {
      return { _type, message: unknownMessage }
    }
  }
}
