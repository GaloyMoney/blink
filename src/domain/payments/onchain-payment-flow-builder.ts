import { getFeesConfig } from "@config"
import {
  AmountCalculator,
  paymentAmountFromNumber,
  ValidationError,
  WalletCurrency,
  ZERO_BANK_FEE,
} from "@domain/shared"
import { SelfPaymentError } from "@domain/errors"
import { OnChainFees, PaymentInitiationMethod, SettlementMethod } from "@domain/wallets"
import { checkedToBtcPaymentAmount, checkedToUsdPaymentAmount } from "@domain/payments"
import { ImbalanceCalculator } from "@domain/ledger/imbalance-calculator"

import { addAttributesToCurrentSpan } from "@services/tracing"

import { InvalidOnChainPaymentFlowBuilderStateError } from "./errors"
import { PriceRatio } from "./price-ratio"
import { OnChainPaymentFlow } from "./payment-flow"

const calc = AmountCalculator()
const feeConfig = getFeesConfig()
const onChainFees = OnChainFees({
  feeRatioAsBasisPoints: feeConfig.withdrawRatioAsBasisPoints,
  thresholdImbalance: {
    amount: BigInt(feeConfig.withdrawThreshold),
    currency: WalletCurrency.Btc,
  },
})

export const OnChainPaymentFlowBuilder = <S extends WalletCurrency>(
  config: OnChainPaymentFlowBuilderConfig,
): OnChainPaymentFlowBuilder<S> => {
  const settlementMethodFromAddress = async (
    address: OnChainAddress,
  ): Promise<SettlementMethod> => {
    const isExternal = await config.isExternalAddress(address)
    return isExternal ? SettlementMethod.OnChain : SettlementMethod.IntraLedger
  }

  const withAddress = (address: OnChainAddress): OPFBWithAddress<S> | OPFBWithError => {
    // TODO: validate onchain address?
    if (!address) {
      return OPFBWithError(
        new InvalidOnChainPaymentFlowBuilderStateError("invalid address"),
      )
    }

    return OPFBWithAddress({
      ...config,

      paymentInitiationMethod: PaymentInitiationMethod.OnChain,
      settlementMethodPromise: settlementMethodFromAddress(address),
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
  const withSenderWalletAndAccount = ({
    wallet,
    account,
  }: {
    wallet: WalletDescriptor<S>
    account: Account
  }) => {
    const {
      id: senderWalletId,
      currency: senderWalletCurrency,
      accountId: senderAccountId,
    } = wallet
    const { withdrawFee: senderWithdrawFee } = account
    return OPFBWithSenderWalletAndAccount({
      ...state,
      senderWalletId,
      senderWalletCurrency,
      senderAccountId,
      senderWithdrawFee,
    })
  }

  return {
    withSenderWalletAndAccount,
  }
}

const OPFBWithSenderWalletAndAccount = <S extends WalletCurrency>(
  state: OPFBWithSenderWalletAndAccountState<S>,
): OPFBWithSenderWalletAndAccount<S> | OPFBWithError => {
  const settlementMethodFromRecipientWallet = (
    walletId: WalletId | undefined,
  ): {
    settlementMethod: SettlementMethod
  } => ({
    settlementMethod:
      walletId === undefined ? SettlementMethod.OnChain : SettlementMethod.IntraLedger,
  })

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
    usdProposedAmount?: UsdPaymentAmount
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
  const withAmount = (uncheckedAmount: number): OPFBWithAmount<S, R> | OPFBWithError => {
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
          btcProposedAmount: paymentAmount,
        })
      : OPFBWithAmount({
          ...state,
          inputAmount: paymentAmount.amount,
          usdProposedAmount: paymentAmount,
        })
  }

  return {
    withAmount,
  }
}

const OPFBWithAmount = <S extends WalletCurrency, R extends WalletCurrency>(
  state: OPFBWithAmountState<S, R>,
): OPFBWithAmount<S, R> | OPFBWithError => {
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
    const { btcProposedAmount, usdProposedAmount } = state

    // Use mid price when no buy / sell required
    const noConversionRequired =
      (state.senderWalletCurrency === WalletCurrency.Btc &&
        state.settlementMethod === SettlementMethod.OnChain) ||
      (state.senderWalletCurrency as WalletCurrency) ===
        (state.recipientWalletCurrency as WalletCurrency)

    if (noConversionRequired) {
      if (btcProposedAmount) {
        if (usdProposedAmount) {
          return OPFBWithConversion(
            new Promise((res) =>
              res({
                ...stateWithCreatedAt,
                btcProposedAmount,
                usdProposedAmount,
              }),
            ),
          )
        }
        return OPFBWithConversion(
          state.usdFromBtcMidPriceFn(btcProposedAmount).then((convertedAmount) => {
            if (convertedAmount instanceof Error) {
              return convertedAmount
            }
            const priceRatio = PriceRatio({
              usd: convertedAmount,
              btc: btcProposedAmount,
            })
            if (priceRatio instanceof Error) return priceRatio

            return {
              ...stateWithCreatedAt,
              btcProposedAmount,
              usdProposedAmount: convertedAmount,
            }
          }),
        )
      } else if (usdProposedAmount) {
        return OPFBWithConversion(
          state.btcFromUsdMidPriceFn(usdProposedAmount).then((convertedAmount) => {
            if (convertedAmount instanceof Error) {
              return convertedAmount
            }
            const priceRatio = PriceRatio({
              btc: convertedAmount,
              usd: usdProposedAmount,
            })
            if (priceRatio instanceof Error) return priceRatio

            return {
              ...stateWithCreatedAt,
              btcProposedAmount: convertedAmount,
              usdProposedAmount,
            }
          }),
        )
      } else {
        return OPFBWithError(
          new InvalidOnChainPaymentFlowBuilderStateError(
            "withConversion - btcProposedAmount || btcProtocolFee not set",
          ),
        )
      }
    }

    // Convert to usd if necessary
    if (btcProposedAmount) {
      return OPFBWithConversion(
        usdFromBtc(btcProposedAmount).then((convertedAmount) => {
          if (convertedAmount instanceof Error) {
            return convertedAmount
          }
          const priceRatio = PriceRatio({
            usd: convertedAmount,
            btc: btcProposedAmount,
          })
          if (priceRatio instanceof Error) return priceRatio

          return {
            ...stateWithCreatedAt,
            btcProposedAmount,
            usdProposedAmount: convertedAmount,
          }
        }),
      )
    }

    if (usdProposedAmount) {
      return OPFBWithConversion(
        btcFromUsd(usdProposedAmount).then((convertedAmount) => {
          if (convertedAmount instanceof Error) {
            return convertedAmount
          }
          const priceRatio = PriceRatio({
            btc: convertedAmount,
            usd: usdProposedAmount,
          })
          if (priceRatio instanceof Error) return priceRatio

          return {
            ...stateWithCreatedAt,
            btcProposedAmount: convertedAmount,
            usdProposedAmount,
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
  const stateFromPromise = async (
    statePromise: Promise<OPFBWithConversionState<S, R> | DealerPriceServiceError>,
  ) => {
    const state = await statePromise
    if (state instanceof Error) return state

    const settlementMethod = await state.settlementMethodPromise
    if (settlementMethod === SettlementMethod.IntraLedger && !state.recipientWalletId) {
      return new InvalidOnChainPaymentFlowBuilderStateError(
        "withoutRecipientWallet called but settlementMethod is IntraLedger",
      )
    }
    return state
  }

  const withoutMinerFee = async (): Promise<OPFBWithMinerFee<S, R> | OPFBWithError> => {
    const state = await stateFromPromise(statePromise)
    if (state instanceof Error) return OPFBWithError(state)

    return OPFBWithMinerFee({
      ...state,
      btcProtocolFee: onChainFees.intraLedgerFees().btc,
      usdProtocolFee: onChainFees.intraLedgerFees().usd,
      ...ZERO_BANK_FEE,
    })
  }

  const withMinerFee = async (
    minerFee: BtcPaymentAmount,
  ): Promise<OPFBWithMinerFee<S, R> | OPFBWithError> => {
    const state = await stateFromPromise(statePromise)
    if (state instanceof Error) return OPFBWithError(state)

    const priceRatio = PriceRatio({
      usd: state.usdProposedAmount,
      btc: state.btcProposedAmount,
    })
    if (priceRatio instanceof Error) return OPFBWithError(priceRatio)

    const minBankFee = paymentAmountFromNumber({
      amount: state.senderWithdrawFee || feeConfig.withdrawDefaultMin,
      currency: WalletCurrency.Btc,
    })
    if (minBankFee instanceof Error) return OPFBWithError(minBankFee)

    const imbalanceCalculator = ImbalanceCalculator({
      method: feeConfig.withdrawMethod,
      volumeLightningFn: state.volumeLightningFn,
      volumeOnChainFn: state.volumeOnChainFn,
      sinceDaysAgo: feeConfig.withdrawDaysLookback,
    })
    const imbalanceForWallet = await imbalanceCalculator.getSwapOutImbalanceAmount<S>({
      id: state.senderWalletId,
      currency: state.senderWalletCurrency,
      accountId: state.senderAccountId,
    })
    if (imbalanceForWallet instanceof Error) return OPFBWithError(imbalanceForWallet)

    const imbalance =
      imbalanceForWallet.currency === WalletCurrency.Btc
        ? (imbalanceForWallet as BtcPaymentAmount)
        : priceRatio.convertFromUsd(imbalanceForWallet as UsdPaymentAmount)

    const feeAmounts = onChainFees.withdrawalFee({
      minerFee,
      amount: state.btcProposedAmount,
      minBankFee,
      imbalance,
    })

    addAttributesToCurrentSpan({
      "onChainPaymentFlow.actualMinerFee": `${minerFee}`,
      "onChainPaymentFlow.totalFee": `${feeAmounts.totalFee.amount}`,
      "onChainPaymentFlow.bankFee": `${feeAmounts.bankFee.amount}`,
    })

    return OPFBWithMinerFee({
      ...state,
      btcProtocolFee: feeAmounts.totalFee,
      usdProtocolFee: priceRatio.convertFromBtcToCeil(feeAmounts.totalFee),
      btcBankFee: feeAmounts.bankFee,
      usdBankFee: priceRatio.convertFromBtcToCeil(feeAmounts.bankFee),
    })
  }

  const btcProposedAmount = async () => {
    const state = await stateFromPromise(statePromise)
    if (state instanceof Error) return state

    return state.btcProposedAmount
  }

  const usdProposedAmount = async () => {
    const state = await stateFromPromise(statePromise)
    if (state instanceof Error) return state

    return state.usdProposedAmount
  }

  const isIntraLedger = async () => {
    const state = await stateFromPromise(statePromise)
    if (state instanceof Error) return state

    return state.settlementMethod === SettlementMethod.IntraLedger
  }

  const proposedAmounts = async () => {
    const btc = await btcProposedAmount()
    if (btc instanceof Error) return btc
    const usd = await usdProposedAmount()
    if (usd instanceof Error) return usd

    return { btc, usd }
  }

  const addressForFlow = async () => {
    const state = await stateFromPromise(statePromise)
    if (state instanceof Error) return state

    return state.address
  }

  const senderWalletDescriptor = async () => {
    const state = await stateFromPromise(statePromise)
    if (state instanceof Error) return state

    return {
      id: state.senderWalletId,
      currency: state.senderWalletCurrency,
      accountId: state.senderAccountId,
    }
  }

  return {
    withoutMinerFee,
    withMinerFee,
    btcProposedAmount,
    usdProposedAmount,
    proposedAmounts,
    isIntraLedger,
    addressForFlow,
    senderWalletDescriptor,
  }
}

const OPFBWithMinerFee = <S extends WalletCurrency, R extends WalletCurrency>(
  state: OPFBWithMinerFeeState<S, R>,
): OPFBWithMinerFee<S, R> | OPFBWithError => {
  const withoutSendAll = (): OnChainPaymentFlow<S, R> => {
    return OnChainPaymentFlow({
      ...state,
      btcPaymentAmount: state.btcProposedAmount,
      usdPaymentAmount: state.usdProposedAmount,
      paymentSentAndPending: false,
    })
  }

  const withSendAll = (): OnChainPaymentFlow<S, R> | ValidationError => {
    const priceRatio = PriceRatio({
      usd: state.usdProposedAmount,
      btc: state.btcProposedAmount,
    })
    if (priceRatio instanceof Error) return priceRatio

    let btcPaymentAmount: BtcPaymentAmount, usdPaymentAmount: UsdPaymentAmount
    if (state.senderWalletCurrency === WalletCurrency.Btc) {
      btcPaymentAmount = calc.sub(state.btcProposedAmount, state.btcProtocolFee)
      usdPaymentAmount = priceRatio.convertFromBtc(btcPaymentAmount)
    } else {
      usdPaymentAmount = calc.sub(state.usdProposedAmount, state.usdProtocolFee)
      btcPaymentAmount = priceRatio.convertFromUsd(usdPaymentAmount)
    }

    return OnChainPaymentFlow({
      ...state,
      btcPaymentAmount,
      usdPaymentAmount,
      paymentSentAndPending: false,
    })
  }

  return {
    withoutSendAll,
    withSendAll,
  }
}

const OPFBWithError = (
  error:
    | ValidationError
    | SelfPaymentError
    | DealerPriceServiceError
    | InvalidOnChainPaymentFlowBuilderStateError,
): OPFBWithError => {
  const withSenderWalletAndAccount = () => {
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
  const withMinerFee = () => {
    return Promise.resolve(OPFBWithError(error))
  }
  const withoutMinerFee = () => {
    return Promise.resolve(OPFBWithError(error))
  }
  const isIntraLedger = async () => {
    return Promise.resolve(error)
  }
  const btcProposedAmount = async () => {
    return Promise.resolve(error)
  }

  const usdProposedAmount = async () => {
    return Promise.resolve(error)
  }

  const proposedAmounts = async () => {
    return Promise.resolve(error)
  }

  const addressForFlow = async () => {
    return Promise.resolve(error)
  }

  const senderWalletDescriptor = async () => {
    return Promise.resolve(error)
  }

  const withoutSendAll = () => error

  const withSendAll = () => error

  return {
    withSenderWalletAndAccount,
    withAmount,
    withoutRecipientWallet,
    withRecipientWallet,
    withConversion,
    withMinerFee,
    withoutMinerFee,
    isIntraLedger,
    btcProposedAmount,
    usdProposedAmount,
    proposedAmounts,
    addressForFlow,
    senderWalletDescriptor,
    withoutSendAll,
    withSendAll,
  }
}
