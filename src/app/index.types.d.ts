type PartialResult<T> = {
  result: T | null
  error?: ApplicationError
}

type ApplicationError =
  | AuthorizationError
  | RepositoryError
  | ValidationError
  | LedgerError
  | OnChainError
  | LightningError
  | PriceServiceError
  | TwoFAError
  | LockServiceError
  | IpFetcherError
  | AccountError
  | NotificationsError
