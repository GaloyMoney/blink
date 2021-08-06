type ErrorWithMessage<ErrorType> = {
  _type: ErrorType
  message: string
}

type ErrorConverter<ErrorType> = (error: any) => ErrorWithMessage<ErrorType>
