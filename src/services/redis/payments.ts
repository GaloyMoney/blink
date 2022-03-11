import { UnknownRepositoryError } from "@domain/errors"

export const PaymentsRepository = (): IPaymentFlowRepository => {
  const persistNew = async <S extends WalletCurrency>(
    payment: PaymentFlow<S>,
  ): Promise<PaymentFlow<S> | RepositoryError> => {
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
  }): Promise<PaymentFlow<S> | RepositoryError> => {
    return new UnknownRepositoryError()
  }

  return {
    findLightningPaymentFlow,
    persistNew,
  }
}
