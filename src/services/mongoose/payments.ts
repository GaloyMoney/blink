import { UnknownRepositoryError } from "@domain/errors"

export const PaymentsRepository = (): IPaymentsRepository => {
  const persistNew = async (payment: Payment): Promise<Payment | RepositoryError> => {
    return new UnknownRepositoryError()
  }

  return {
    persistNew,
  }
}
