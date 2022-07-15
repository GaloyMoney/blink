import { ValidationError, WalletCurrency } from "@domain/shared"
import { SelfPaymentError } from "@domain/errors"
import { PaymentInitiationMethod, SettlementMethod } from "@domain/wallets"
import { checkedToBtcPaymentAmount, checkedToUsdPaymentAmount } from "@domain/payments"

import { InvalidOnChainPaymentFlowBuilderStateError } from "./errors"
import { LnFees } from "./ln-fees"
import { PriceRatio } from "./price-ratio"
import { OnChainPaymentFlow } from "./payment-flow"

export const OnChainPaymentFlowBuilder = <S extends WalletCurrency>(
  config: OnChainPaymentFlowBuilderConfig,
): OnChainPaymentFlowBuilder<S> => {
  const withAddress = (address: OnChainAddress): OPFBWithAddress<S> | OPFBWithError => {
    // TODO: validate onchain address?
    if (address === null) {
      return OPFBWithError(
        new InvalidOnChainPaymentFlowBuilderStateError("invalid address"),
      )
    }
    return OPFBWithAddress({
      ...config,
      paymentInitiationMethod: PaymentInitiationMethod.OnChain,
      address,
    })
  }

  return {
    withAddress,
  }
}

const OPFBWithAddress = <S extends WalletCurrency>(
  state: OPFBWithAddressState,
): OPFBWithAddress<S> | OPFBWithError => {
  const withSenderWallet = (senderWallet: WalletDescriptor<S>) => {
    const { id: senderWalletId, currency: senderWalletCurrency } = senderWallet
    return OPFBWithSenderWallet({
      ...state,
      senderWalletId,
      senderWalletCurrency,
    })
  }

  return {
    withSenderWallet,
  }
}

const OPFBWithSenderWallet = <S extends WalletCurrency>(
  state: OPFBWithSenderWalletState<S>,
): OPFBWithSenderWallet<S> | OPFBWithError => {
  const withAmount = (uncheckedAmount: number): OPFBWithAmount<S> | OPFBWithError => {
    const paymentAmount =
      state.senderWalletCurrency === WalletCurrency.Btc
        ? checkedToBtcPaymentAmount(uncheckedAmount)
        : checkedToUsdPaymentAmount(uncheckedAmount)
    if (paymentAmount instanceof ValidationError) {
      return OPFBWithError(paymentAmount)
    }

    return paymentAmount.currency === WalletCurrency.Btc
      ? OPFBWithAmount({
          ...state,
          inputAmount: paymentAmount.amount,
          btcPaymentAmount: paymentAmount,
        })
      : OPFBWithAmount({
          ...state,
          inputAmount: paymentAmount.amount,
          usdPaymentAmount: paymentAmount,
        })
  }

  return {
    withAmount,
  }
}

const OPFBWithAmount = <S extends WalletCurrency>(
  state: OPFBWithAmountState<S>,
): OPFBWithAmount<S> | OPFBWithError => {
  const settlementMethodFromRecipientWallet = (
    walletId: WalletId | undefined,
  ): {
    settlementMethod: SettlementMethod
    btcProtocolFee: BtcPaymentAmount | undefined
    usdProtocolFee: UsdPaymentAmount | undefined
  } => {
    const settlementMethod =
      walletId === undefined ? SettlementMethod.OnChain : SettlementMethod.IntraLedger
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

  const withoutRecipientWallet = <R extends WalletCurrency>():
    | OPFBWithRecipientWallet<S, R>
    | OPFBWithError => {
    return OPFBWithRecipientWallet({
      ...state,
      ...settlementMethodFromRecipientWallet(undefined),
    })
  }

  const withRecipientWallet = <R extends WalletCurrency>({
    id: recipientWalletId,
    currency: recipientWalletCurrency,
    pubkey: recipientPubkey,
    username: recipientUsername,
  }: WalletDescriptor<R> & {
    pubkey?: Pubkey
    usdPaymentAmount?: UsdPaymentAmount
    username?: Username
  }): OPFBWithRecipientWallet<S, R> | OPFBWithError => {
    if (recipientWalletId === state.senderWalletId) {
      return OPFBWithError(new SelfPaymentError())
    }
    return OPFBWithRecipientWallet({
      ...state,
      ...settlementMethodFromRecipientWallet(recipientWalletId),
      recipientWalletId,
      recipientWalletCurrency,
      recipientPubkey,
      recipientUsername,
    })
  }

  return {
    withoutRecipientWallet,
    withRecipientWallet,
  }
}

const OPFBWithRecipientWallet = <S extends WalletCurrency, R extends WalletCurrency>(
  state: OPFBWithRecipientWalletState<S, R>,
): OPFBWithRecipientWallet<S, R> | OPFBWithError => {
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
  }): OPFBWithConversion<S, R> | OPFBWithError => {
    const stateWithCreatedAt = {
      ...state,
      createdAt: new Date(Date.now()),
      paymentSentAndPending: false,
    }
    const { btcPaymentAmount, usdPaymentAmount, btcProtocolFee, usdProtocolFee } = state

    // Use mid price when no buy / sell required
    const noConversionRequired =
      (state.senderWalletCurrency === WalletCurrency.Btc &&
        state.settlementMethod === SettlementMethod.OnChain) ||
      (state.senderWalletCurrency as WalletCurrency) ===
        (state.recipientWalletCurrency as WalletCurrency)

    if (noConversionRequired) {
      if (btcPaymentAmount && btcProtocolFee) {
        if (usdPaymentAmount && usdProtocolFee) {
          return OPFBWithConversion(
            new Promise((res) =>
              res({
                ...stateWithCreatedAt,
                btcPaymentAmount,
                usdPaymentAmount,
                btcProtocolFee,
                usdProtocolFee,
              }),
            ),
          )
        }
        return OPFBWithConversion(
          state.usdFromBtcMidPriceFn(btcPaymentAmount).then((convertedAmount) => {
            if (convertedAmount instanceof Error) {
              return convertedAmount
            }
            const priceRatio = PriceRatio({
              usd: convertedAmount,
              btc: btcPaymentAmount,
            })
            if (priceRatio instanceof Error) return priceRatio

            const usdProtocolFee = priceRatio.convertFromBtcToCeil(btcProtocolFee)
            return {
              ...stateWithCreatedAt,
              btcPaymentAmount,
              usdPaymentAmount: convertedAmount,
              btcProtocolFee,
              usdProtocolFee,
            }
          }),
        )
      } else if (usdPaymentAmount && usdProtocolFee) {
        return OPFBWithConversion(
          state.btcFromUsdMidPriceFn(usdPaymentAmount).then((convertedAmount) => {
            if (convertedAmount instanceof Error) {
              return convertedAmount
            }
            const priceRatio = PriceRatio({
              btc: convertedAmount,
              usd: usdPaymentAmount,
            })
            if (priceRatio instanceof Error) return priceRatio

            const btcProtocolFee = priceRatio.convertFromUsd(usdProtocolFee)
            return {
              ...stateWithCreatedAt,
              btcPaymentAmount: convertedAmount,
              usdPaymentAmount,
              btcProtocolFee,
              usdProtocolFee,
            }
          }),
        )
      } else {
        return OPFBWithError(
          new InvalidOnChainPaymentFlowBuilderStateError(
            "withConversion - btcPaymentAmount || btcProtocolFee not set",
          ),
        )
      }
    }

    // Convert to usd if necessary
    if (btcPaymentAmount && btcProtocolFee) {
      return OPFBWithConversion(
        usdFromBtc(btcPaymentAmount).then((convertedAmount) => {
          if (convertedAmount instanceof Error) {
            return convertedAmount
          }
          const priceRatio = PriceRatio({
            usd: convertedAmount,
            btc: btcPaymentAmount,
          })
          if (priceRatio instanceof Error) return priceRatio

          const usdProtocolFee = priceRatio.convertFromBtcToCeil(btcProtocolFee)
          return {
            ...stateWithCreatedAt,
            btcPaymentAmount,
            usdPaymentAmount: convertedAmount,
            btcProtocolFee,
            usdProtocolFee,
          }
        }),
      )
    }

    if (usdPaymentAmount && usdProtocolFee) {
      return OPFBWithConversion(
        btcFromUsd(usdPaymentAmount).then((convertedAmount) => {
          if (convertedAmount instanceof Error) {
            return convertedAmount
          }
          const priceRatio = PriceRatio({
            btc: convertedAmount,
            usd: usdPaymentAmount,
          })
          if (priceRatio instanceof Error) return priceRatio

          const btcProtocolFee = priceRatio.convertFromUsd(usdProtocolFee)
          return {
            ...stateWithCreatedAt,
            btcPaymentAmount: convertedAmount,
            usdPaymentAmount,
            btcProtocolFee,
            usdProtocolFee,
          }
        }),
      )
    }

    return OPFBWithError(
      new InvalidOnChainPaymentFlowBuilderStateError(
        "withConversion - impossible withConversion state",
      ),
    )
  }

  return {
    withConversion,
  }
}

const OPFBWithConversion = <S extends WalletCurrency, R extends WalletCurrency>(
  statePromise: Promise<OPFBWithConversionState<S, R> | DealerPriceServiceError>,
): OPFBWithConversion<S, R> | OPFBWithError => {
  const withoutMinerFee = async (): Promise<
    OnChainPaymentFlow<S, R> | ValidationError | DealerPriceServiceError
  > => {
    const state = await statePromise
    if (state instanceof Error) return state

    state
    return OnChainPaymentFlow({
      ...state,
      outgoingNodePubkey: undefined,
      paymentSentAndPending: false,
    })
  }

  const withMinerFee = async (
    minerFee: BtcPaymentAmount,
  ): Promise<OnChainPaymentFlow<S, R> | ValidationError | DealerPriceServiceError> => {
    const state = await statePromise
    if (state instanceof Error) return state

    const priceRatio = PriceRatio({
      usd: state.usdPaymentAmount,
      btc: state.btcPaymentAmount,
    })
    if (priceRatio instanceof Error) return priceRatio

    return OnChainPaymentFlow({
      ...state,
      btcProtocolFee: minerFee,
      usdProtocolFee: priceRatio.convertFromBtcToCeil(minerFee),
      paymentSentAndPending: false,
    })
  }

  const btcPaymentAmount = async () => {
    const state = await Promise.resolve(statePromise)
    if (state instanceof Error) return state

    return state.btcPaymentAmount
  }

  const usdPaymentAmount = async () => {
    const state = await Promise.resolve(statePromise)
    if (state instanceof Error) return state

    return state.usdPaymentAmount
  }

  const isIntraLedger = async () => {
    const state = await Promise.resolve(statePromise)
    if (state instanceof Error) return state

    return state.settlementMethod === SettlementMethod.IntraLedger
  }

  return {
    withoutMinerFee,
    withMinerFee,
    btcPaymentAmount,
    usdPaymentAmount,
    isIntraLedger,
  }
}

const OPFBWithError = (
  error:
    | ValidationError
    | SelfPaymentError
    | DealerPriceServiceError
    | InvalidOnChainPaymentFlowBuilderStateError,
): OPFBWithError => {
  const withSenderWallet = () => {
    return OPFBWithError(error)
  }
  const withAmount = () => {
    return OPFBWithError(error)
  }
  const withoutRecipientWallet = () => {
    return OPFBWithError(error)
  }
  const withRecipientWallet = () => {
    return OPFBWithError(error)
  }
  const withConversion = () => {
    return OPFBWithError(error)
  }
  const isIntraLedger = async () => {
    return Promise.resolve(error)
  }
  const btcPaymentAmount = async () => {
    return Promise.resolve(error)
  }

  const usdPaymentAmount = async () => {
    return Promise.resolve(error)
  }

  return {
    withSenderWallet,
    withAmount,
    withoutRecipientWallet,
    withRecipientWallet,
    withConversion,
    isIntraLedger,
    btcPaymentAmount,
    usdPaymentAmount,
  }
}
