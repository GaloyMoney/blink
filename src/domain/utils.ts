import { RepositoryError, UnknownRepositoryError } from "./errors"

export const isRepoError = (obj): boolean =>
  obj instanceof RepositoryError || obj instanceof UnknownRepositoryError

export const isWalletInvoice = (invoice): invoice is WalletInvoice =>
  (invoice as WalletInvoice).paymentHash !== undefined
