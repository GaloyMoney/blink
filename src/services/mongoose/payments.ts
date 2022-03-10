import { UnknownRepositoryError } from "@domain/errors"

export const PaymentsRepository = (): IPaymentsRepository => {
  const persistNew = async <S extends WalletCurrency>(
    payment: Payment<S>,
  ): Promise<Payment<S> | RepositoryError> => {
    return new UnknownRepositoryError()
  }

  return {
    persistNew,
  }
}
