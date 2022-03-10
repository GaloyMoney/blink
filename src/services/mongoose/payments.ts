import { UnknownRepositoryError } from "@domain/errors"

export const PaymentsRepository = (): IPaymentFlowRepository => {
  const persistNew = async <S extends WalletCurrency>(
    payment: PaymentFlow<S>,
  ): Promise<PaymentFlow<S> | RepositoryError> => {
    return payment
  }

  return {
    persistNew,
  }
}
