type PartialResult<T> = {
  result: T | null
  error?: ApplicationError
}

type ApplicationError =
  | LedgerError
  | OnChainError
  | RepositoryError
  | LightningError
  | PriceError
  | ValidationError
