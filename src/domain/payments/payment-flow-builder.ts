import { ValidationError, WalletCurrency } from "@domain/shared"
import { PaymentInitiationMethod, SettlementMethod } from "@domain/wallets"
import { checkedToBtcPaymentAmount, checkedToUsdPaymentAmount } from "@domain/payments"

import { LnFees } from "./ln-fees"
import { PriceRatio } from "./price-ratio"
import { PaymentFlow } from "./payment-flow"

export const LightningPaymentFlowBuilder = (
  config: LightningPaymentFlowBuilderConfig,
) => {
  const withInvoice = (invoice: LnInvoice) => {
    return LPFBWithInvoice(config)
  }

  const withNoAmountInvoice = ({
    invoice,
    uncheckedAmount,
  }: {
    invoice: LnInvoice
    uncheckedAmount: number
  }) => {
    return LPFBWithInvoice(config)
  }

  return {
    withInvoice,
    withNoAmountInvoice,
  }
}

const LPFBWithInvoice = (state: LPFBWithInvoiceState) => {
  const withSenderWallet = <S extends WalletCurrency>(
    senderWallet: WalletDescriptor<S>,
  ) => {
    return LPFBWithSenderWallet({
      ...state,
    })
  }

  return {
    withSenderWallet,
  }
}

const LPFBWithSenderWallet = <S extends WalletCurrency>(
  state: LPFBWithSenderWalletState<S>,
) => {
  const withoutRecipientWallet = () => {
    return LPFBWithRecipientWallet({ ...state })
  }

  return {
    withoutRecipientWallet,
  }
}

const LPFBWithRecipientWallet = <S extends WalletCurrency, R extends WalletCurrency>(
  state: LPFBWithRecipientWalletState<S, R>,
) => {
  const withConversion = ({
    usdFromBtc,
    btcFromUsd,
  }: {
    usdFromBtc(
      amount: BtcPaymentAmount,
    ): Promise<UsdPaymentAmount | DealerPriceServiceError>
    btcFromUsd(
      amount: UsdPaymentAmount,
    ): Promise<BtcPaymentAmount | DealerPriceServiceError>
  }) => {
    return LPFBWithConversion({
      ...state,
    })
  }

  return {
    withConversion,
  }
}

const LPFBWithConversion = <S extends WalletCurrency, R extends WalletCurrency>(
  state: LPFBWithConversionState<S, R>,
) => {
  const withRoute = async ({
    pubkey,
    rawRoute,
  }: {
    pubkey: Pubkey
    rawRoute: RawRoute
  }): Promise<PaymentFlow<S> | ValidationError | DealerPriceServiceError> => {
    return Promise.resolve(new ValidationError())
  }
  return {
    withRoute,
  }
}
