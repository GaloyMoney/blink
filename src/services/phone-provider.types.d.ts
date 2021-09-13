type SendTextFunction = (arg0: {
  body: string
  to: string
  logger: Logger
}) => Promise<boolean>
