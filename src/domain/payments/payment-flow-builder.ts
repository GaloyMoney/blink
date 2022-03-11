import { ValidationError, WalletCurrency } from "@domain/shared"
import { PaymentInitiationMethod, SettlementMethod } from "@domain/wallets"
import { checkedToBtcPaymentAmount, checkedToUsdPaymentAmount } from "@domain/payments"

import { LnFees } from "./ln-fees"
import { PriceRatio } from "./price-ratio"
import { PaymentFlow } from "./payment-flow"

export const LightningPaymentFlowBuilder = (
  config: LightningPaymentFlowBuilderConfig,
) => {
  const settlementMethodFromInvoice = (
    invoice: LnInvoice,
  ): {
    settlementMethod: SettlementMethod
    btcProtocolFee: BtcPaymentAmount | undefined
    usdProtocolFee: UsdPaymentAmount | undefined
  } => {
    const settlementMethod = config.localNodeIds.includes(invoice.destination)
      ? SettlementMethod.IntraLedger
      : SettlementMethod.Lightning
    return {
      settlementMethod,
      btcProtocolFee:
        settlementMethod === SettlementMethod.IntraLedger
          ? LnFees().intraLedgerFees().btc
          : undefined,
      usdProtocolFee:
        settlementMethod === SettlementMethod.IntraLedger
          ? LnFees().intraLedgerFees().usd
          : undefined,
    }
  }

  const withInvoice = (invoice: LnInvoice) => {
    if (invoice.paymentAmount === null) {
      throw Error("withInvoice called with invoice without payment amount")
    }
    return LPFBWithInvoice({
      ...config,
      ...settlementMethodFromInvoice(invoice),
      paymentHash: invoice.paymentHash,
      btcPaymentAmount: invoice.paymentAmount,
      inputAmount: invoice.paymentAmount.amount,
    })
  }

  const withNoAmountInvoice = ({
    invoice,
    uncheckedAmount,
  }: {
    invoice: LnInvoice
    uncheckedAmount: number
  }) => {
    return LPFBWithInvoice({
      ...config,
      ...settlementMethodFromInvoice(invoice),
      paymentHash: invoice.paymentHash,
      uncheckedAmount,
    })
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
    const { id: senderWalletId, currency: senderWalletCurrency } = senderWallet
    if (state.uncheckedAmount) {
      if (senderWalletCurrency === WalletCurrency.Btc) {
        const paymentAmount = checkedToBtcPaymentAmount(state.uncheckedAmount)
        if (paymentAmount instanceof ValidationError) {
          return LPFBWithValidationError(paymentAmount)
        }
        return LPFBWithSenderWallet({
          ...state,
          senderWalletId,
          senderWalletCurrency,
          btcPaymentAmount: paymentAmount,
          inputAmount: paymentAmount.amount,
          btcProtocolFee: state.btcProtocolFee || LnFees().maxProtocolFee(paymentAmount),
        })
      }
    }
    const inputAmount = state.inputAmount
    const btcPaymentAmount = state.btcPaymentAmount
    if (inputAmount && btcPaymentAmount) {
      return LPFBWithSenderWallet({
        ...state,
        senderWalletId,
        senderWalletCurrency,
        btcPaymentAmount,
          btcProtocolFee: state.btcProtocolFee || LnFees().maxProtocolFee(btcPaymentAmount),
        inputAmount,
      })
    }

    throw new Error("withSenderWallet impossible")
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
    const { btcPaymentAmount, btcProtocolFee } = state
    if (btcPaymentAmount && btcProtocolFee) {
      return LPFBWithConversion({
        ...state,
        btcPaymentAmount,
        btcProtocolFee,
      })
    }
    throw new Error("unimplemented")
  }

  return {
    withConversion,
  }
}

const LPFBWithConversion = <S extends WalletCurrency, R extends WalletCurrency>(
  state: LPFBWithConversionState<S, R>,
) => {
  const withoutRoute = () => {
    return Promise.resolve(
      PaymentFlow({
        senderWalletId: state.senderWalletId,
        senderWalletCurrency: state.senderWalletCurrency,

        paymentHash: state.paymentHash,
        btcPaymentAmount: state.btcPaymentAmount,
        inputAmount: state.inputAmount,

        settlementMethod: state.settlementMethod,
        paymentInitiationMethod: PaymentInitiationMethod.Lightning,

        btcProtocolFee: state.btcProtocolFee,
        usdProtocolFee: state.usdProtocolFee,
      }),
    )
  }
  const withRoute = async ({
    pubkey,
    rawRoute,
  }: {
    pubkey: Pubkey
    rawRoute: RawRoute
  }): Promise<PaymentFlow<S> | ValidationError | DealerPriceServiceError> => {
    throw new Error("unimplemented")
  }

  return {
    withRoute,
    withoutRoute,
  }
}

const LPFBWithValidationError = (error: ValidationError) => {
  const withoutRecipientWallet = () => {
    return LPFBWithValidationError(error)
  }
  const withConversion = () => {
    return LPFBWithValidationError(error)
  }
  const withRoute = async () => {
    return Promise.resolve(error)
  }
  const withoutRoute = async () => {
    return Promise.resolve(error)
  }

  return {
    withoutRecipientWallet,
    withConversion,
    withRoute,
    withoutRoute,
  }
}
