import { UnknownRepositoryError } from "@domain/errors"

export const PaymentsRepository = (): IPaymentFlowRepository => {
  const persistNew = async <S extends WalletCurrency>(
    payment: PaymentFlowOld<S>,
  ): Promise<PaymentFlowOld<S> | RepositoryError> => {
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
  }): Promise<PaymentFlowOld<S> | RepositoryError> => {
    return new UnknownRepositoryError()
  }

  return {
    findLightningPaymentFlow,
    persistNew,
  }
}
