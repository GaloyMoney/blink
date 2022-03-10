import { defaultTimeToExpiryInSeconds } from "@domain/bitcoin/lightning/invoice-expiration"
import { DealerPriceServiceError } from "@domain/dealer-price"
import { NotImplementedError, NotReachableError } from "@domain/errors"
import { WalletCurrency } from "@domain/shared"

export const AmountConverter = ({}: AmountConverterConfig): AmountConverter => {
  const addMissingAmounts = <S extends WalletCurrency>(
    builder: LightningPaymentFlowBuilder<S>,
  ) => {
    return builder as LightningPaymentFlowBuilderWithAmounts<S>
  }
  return {
    addMissingAmounts,
  }
}
