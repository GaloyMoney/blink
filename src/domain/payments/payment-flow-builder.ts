import { ValidationError, WalletCurrency } from "@domain/shared"
import { SelfPaymentError } from "@domain/errors"
import { PaymentInitiationMethod, SettlementMethod } from "@domain/wallets"
import { checkedToBtcPaymentAmount, checkedToUsdPaymentAmount } from "@domain/payments"
import { InvalidLightningPaymentFlowBuilderStateError } from "./errors"

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
          return LPFBWithError(paymentAmount)
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
    if (state.settlementMethod === SettlementMethod.IntraLedger) {
      return LPFBWithError(
        new InvalidLightningPaymentFlowBuilderStateError(
          "withoutRecipientWallet called but settlementMethod is IntraLedger",
        ),
      )
    }
    return LPFBWithRecipientWallet({ ...state })
  }

  const withRecipientWallet = <R extends WalletCurrency>({
    id: recipientWalletId,
    currency: recipientWalletCurrency,
    usdPaymentAmount,
  }: WalletDescriptor<R> & {
    usdPaymentAmount?: UsdPaymentAmount
  }) => {
    if (recipientWalletId === state.senderWalletId) {
      return LPFBWithError(new SelfPaymentError())
    }
    if (
      recipientWalletCurrency === WalletCurrency.Usd &&
      usdPaymentAmount === undefined &&
      state.uncheckedAmount === undefined
    ) {
      return LPFBWithError(
        new InvalidLightningPaymentFlowBuilderStateError(
          "withRecipientWallet called with recipient wallet currency USDC but no usdPaymentAmount",
        ),
      )
    }
    return LPFBWithRecipientWallet({
      ...state,
      recipientWalletId,
      recipientWalletCurrency,
      usdPaymentAmount: usdPaymentAmount || state.usdPaymentAmount,
    })
  }

  return {
    withoutRecipientWallet,
    withRecipientWallet,
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
    const { btcPaymentAmount, usdPaymentAmount, btcProtocolFee, usdProtocolFee } = state
    // Use mid price when no buy / sell required
    if (
      state.senderWalletCurrency === WalletCurrency.Btc &&
      (state.settlementMethod === SettlementMethod.Lightning ||
        state.recipientWalletCurrency === WalletCurrency.Btc)
    ) {
      if (btcPaymentAmount && btcProtocolFee) {
        return LPFBWithConversion(
          state.usdFromBtcMidPriceFn(btcPaymentAmount).then((convertedAmount) => {
            if (convertedAmount instanceof Error) {
              return convertedAmount
            }
            const usdProtocolFee = PriceRatio({
              usd: convertedAmount,
              btc: btcPaymentAmount,
            }).convertFromBtc(btcProtocolFee)
            return {
              ...state,
              btcPaymentAmount,
              usdPaymentAmount: convertedAmount,
              btcProtocolFee,
              usdProtocolFee,
            }
          }),
        )
      } else {
        return LPFBWithError(
          new InvalidLightningPaymentFlowBuilderStateError(
            "withConversion - btcPaymentAmount || btcProtocolFee not set",
          ),
        )
      }
    }

    if (btcPaymentAmount && btcProtocolFee && usdPaymentAmount && usdProtocolFee) {
      return LPFBWithConversion(
        Promise.resolve({
          ...state,
          btcPaymentAmount,
          usdPaymentAmount,
          btcProtocolFee,
          usdProtocolFee,
        }),
      )
    }
    throw new Error("unimplemented")
  }

  return {
    withConversion,
  }
}

const LPFBWithConversion = <S extends WalletCurrency, R extends WalletCurrency>(
  statePromise: Promise<LPFBWithConversionState<S, R> | DealerPriceServiceError>,
) => {
  const withoutRoute = async () => {
    const state = await statePromise
    if (state instanceof Error) {
      return state
    }
    return PaymentFlow({
      senderWalletId: state.senderWalletId,
      senderWalletCurrency: state.senderWalletCurrency,
      recipientWalletId: state.recipientWalletId,
      recipientWalletCurrency: state.recipientWalletCurrency,

      paymentHash: state.paymentHash,
      btcPaymentAmount: state.btcPaymentAmount,
      usdPaymentAmount: state.usdPaymentAmount,
      inputAmount: state.inputAmount,

      settlementMethod: state.settlementMethod,
      paymentInitiationMethod: PaymentInitiationMethod.Lightning,

      btcProtocolFee: state.btcProtocolFee,
      usdProtocolFee: state.usdProtocolFee,
    })
  }
  const withRoute = async ({
    pubkey,
    rawRoute,
  }: {
    pubkey: Pubkey
    rawRoute: RawRoute
  }): Promise<PaymentFlow<S, R> | ValidationError | DealerPriceServiceError> => {
    throw new Error("unimplemented")
  }

  return {
    withRoute,
    withoutRoute,
  }
}

const LPFBWithError = (
  error:
    | ValidationError
    | SelfPaymentError
    | DealerPriceServiceError
    | InvalidLightningPaymentFlowBuilderStateError,
) => {
  const withoutRecipientWallet = () => {
    return LPFBWithError(error)
  }
  const withRecipientWallet = () => {
    return LPFBWithError(error)
  }
  const withConversion = () => {
    return LPFBWithError(error)
  }
  const withRoute = async () => {
    return Promise.resolve(error)
  }
  const withoutRoute = async () => {
    return Promise.resolve(error)
  }

  return {
    withoutRecipientWallet,
    withRecipientWallet,
    withConversion,
    withRoute,
    withoutRoute,
  }
}
