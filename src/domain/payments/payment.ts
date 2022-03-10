import { WalletCurrency } from "@domain/shared"

export const Payment = <S extends WalletCurrency>(state: PaymentState<S>): Payment<S> => {
  const protocolFeeInSenderWalletCurrency = (): PaymentAmount<S> => {
    if (state.senderWalletCurrency === WalletCurrency.Btc) {
      return state.btcProtocolFee as PaymentAmount<S>
    }
    return state.usdProtocolFee as PaymentAmount<S>
  }

  return {
    ...state,
    protocolFeeInSenderWalletCurrency,
  }
}
