import { UnknownRepositoryError } from "@domain/errors"

export const PaymentsRepository = (): IPaymentFlowRepository => {
  const persistNew = async <S extends WalletCurrency, R extends WalletCurrency>(
    payment: PaymentFlow<S, R>,
  ): Promise<PaymentFlow<S, R> | RepositoryError> => {
    return payment
  }

  const findLightningPaymentFlow = async <S extends WalletCurrency>({
    walletId,
    paymentHash,
    inputAmount,
  }: {
    walletId: WalletId
    paymentHash: PaymentHash
    inputAmount: BigInt
  }): Promise<PaymentFlow<S, WalletCurrency> | RepositoryError> => {
    return new UnknownRepositoryError()
  }

  return {
    findLightningPaymentFlow,
    persistNew,
  }
}
