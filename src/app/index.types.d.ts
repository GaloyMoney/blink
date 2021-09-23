type PartialResult<T> = {
  result: T | null
  error?: ApplicationError
}

type ApplicationError =
  | LedgerError
  | OnChainError
  | RepositoryError
  | LightningError
  | PriceServiceError
  | ValidationError
  | LockServiceError

type ToWalletIdsFunction = (args0: {
  account: Account
  walletPublicIds: WalletPublicId[]
}) => Promise<WalletId[] | ApplicationError>
