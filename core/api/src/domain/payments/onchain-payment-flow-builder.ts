import {
  InvalidLightningPaymentFlowBuilderStateError,
  InvalidOnChainPaymentFlowBuilderStateError,
  InvalidZeroAmountPriceRatioInputError,
  SubOneCentSatAmountForUsdSelfSendError,
} from "./errors"

import { WalletPriceRatio } from "./price-ratio"

import { OnChainPaymentFlow } from "./payment-flow"

import { getFeesConfig } from "@/config"
import {
  AmountCalculator,
  ONE_CENT,
  paymentAmountFromNumber,
  ValidationError,
  WalletCurrency,
  ZERO_BANK_FEE,
} from "@/domain/shared"
import { LessThanDustThresholdError, SelfPaymentError } from "@/domain/errors"
import { OnChainFees, PaymentInitiationMethod, SettlementMethod } from "@/domain/wallets"
import { ImbalanceCalculator } from "@/domain/ledger/imbalance-calculator"

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
  const withAddress = (address: OnChainAddress): OPFBWithAddress<S> | OPFBWithError => {
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
  const withoutRecipientWallet = <R extends WalletCurrency>():
    | OPFBWithRecipientWallet<S, R>
    | OPFBWithError => {
    return OPFBWithRecipientWallet({
      ...state,
      settlementMethod: SettlementMethod.OnChain,
    })
  }

  const withRecipientWallet = <R extends WalletCurrency>({
    defaultWalletCurrency: recipientWalletCurrency,
    recipientWalletDescriptors,
    username: recipientUsername,
    userId: recipientUserId,
  }: OPFBWithRecipientArgs<R>): OPFBWithRecipientWallet<S, R> | OPFBWithError => {
    const { id: recipientWalletId, accountId: recipientAccountId } =
      recipientWalletDescriptors[recipientWalletCurrency]
    if (recipientWalletId === state.senderWalletId) {
      return OPFBWithError(new SelfPaymentError())
    }
    return OPFBWithRecipientWallet({
      ...state,
      settlementMethod: SettlementMethod.IntraLedger,
      recipientWalletId,
      recipientWalletCurrency,
      recipientAccountId,
      recipientUserId,
      recipientUsername,
      recipientWalletDescriptors,
    })
  }

  const isIntraLedger = async () => !(await state.isExternalAddress(state))

  return {
    withoutRecipientWallet,
    withRecipientWallet,
    isIntraLedger,
  }
}

const OPFBWithRecipientWallet = <S extends WalletCurrency, R extends WalletCurrency>(
  state: OPFBWithRecipientWalletState<S, R>,
): OPFBWithRecipientWallet<S, R> | OPFBWithError => {
  const withAmount = (
    paymentAmount: PaymentAmount<WalletCurrency>,
  ): OPFBWithAmount<S, R> | OPFBWithError => {
    return paymentAmount.currency === WalletCurrency.Btc
      ? OPFBWithAmount({
          ...state,
          inputAmount: paymentAmount.amount,
          btcProposedAmount: paymentAmount as BtcPaymentAmount,
        })
      : OPFBWithAmount({
          ...state,
          inputAmount: paymentAmount.amount,
          usdProposedAmount: paymentAmount as UsdPaymentAmount,
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
    hedgeBuyUsd,
    hedgeSellUsd,
    mid,
  }: WithConversionArgs): OPFBWithConversion<S, R> | OPFBWithError => {
    const stateWithCreatedAt = {
      ...state,
      createdAt: new Date(),
      paymentSentAndPending: false,
    }
    const { btcProposedAmount, usdProposedAmount } = state

    const currentStateFromAllAmountsPresent = async ({
      btcProposedAmount,
      usdProposedAmount,
    }: {
      btcProposedAmount: BtcPaymentAmount
      usdProposedAmount: UsdPaymentAmount
    }): Promise<OPFBWithConversionState<S, R> | DealerPriceServiceError> => ({
      ...stateWithCreatedAt,
      btcProposedAmount,
      usdProposedAmount,
    })

    const updatedStateFromBtcProposedAmountMid = async ({
      btcProposedAmount,
      recipientWalletDescriptor,
    }: {
      btcProposedAmount: BtcPaymentAmount
      recipientWalletDescriptor?: WalletDescriptor<WalletCurrency>
    }): Promise<OPFBWithConversionState<S, R> | DealerPriceServiceError> => {
      const convertedAmountRaw = await mid.usdFromBtc(btcProposedAmount)
      if (convertedAmountRaw instanceof Error) return convertedAmountRaw

      // Round up USD if sats is non-zero in intraledger (mid-price) case and cents is zero
      const convertedAmount =
        btcProposedAmount.amount > 0n && convertedAmountRaw.amount === 0n
          ? ONE_CENT
          : convertedAmountRaw

      const priceRatio = WalletPriceRatio({
        usd: convertedAmount,
        btc: btcProposedAmount,
      })
      if (priceRatio instanceof Error) return priceRatio

      return {
        ...stateWithCreatedAt,
        ...(recipientWalletDescriptor !== undefined
          ? {
              recipientWalletId: recipientWalletDescriptor.id,
              recipientWalletCurrency: recipientWalletDescriptor.currency as R,
            }
          : {}),
        btcProposedAmount,
        usdProposedAmount: convertedAmount,
      }
    }

    const updatedStateFromUsdProposedAmountMid = async (
      usdProposedAmount: UsdPaymentAmount,
    ): Promise<OPFBWithConversionState<S, R> | DealerPriceServiceError> => {
      const convertedAmount = await mid.btcFromUsd(usdProposedAmount)
      if (convertedAmount instanceof Error) return convertedAmount

      const priceRatio = WalletPriceRatio({
        btc: convertedAmount,
        usd: usdProposedAmount,
      })
      if (priceRatio instanceof Error) return priceRatio

      return {
        ...stateWithCreatedAt,
        btcProposedAmount: convertedAmount,
        usdProposedAmount,
      }
    }

    const updatedStateFromBtcProposedAmountDealer = async (
      btcProposedAmount: BtcPaymentAmount,
    ): Promise<OPFBWithConversionState<S, R> | DealerPriceServiceError> => {
      const usdFromBtc =
        state.senderWalletCurrency === WalletCurrency.Btc
          ? hedgeBuyUsd.usdFromBtc
          : hedgeSellUsd.usdFromBtc

      const convertedAmount = await usdFromBtc(btcProposedAmount)
      if (convertedAmount instanceof Error) return convertedAmount

      const priceRatio = WalletPriceRatio({
        usd: convertedAmount,
        btc: btcProposedAmount,
      })
      if (priceRatio instanceof Error) return priceRatio

      return {
        ...stateWithCreatedAt,
        btcProposedAmount,
        usdProposedAmount: convertedAmount,
      }
    }

    const updatedStateFromUsdProposedAmountDealer = async (
      usdProposedAmount: UsdPaymentAmount,
    ): Promise<OPFBWithConversionState<S, R> | DealerPriceServiceError> => {
      const btcFromUsd =
        state.senderWalletCurrency === WalletCurrency.Btc
          ? hedgeBuyUsd.btcFromUsd
          : hedgeSellUsd.btcFromUsd

      const convertedAmount = await btcFromUsd(usdProposedAmount)
      if (convertedAmount instanceof Error) return convertedAmount

      const priceRatio = WalletPriceRatio({
        btc: convertedAmount,
        usd: usdProposedAmount,
      })
      if (priceRatio instanceof Error) return priceRatio

      return {
        ...stateWithCreatedAt,
        btcProposedAmount: convertedAmount,
        usdProposedAmount,
      }
    }

    // Use mid price when no buy / sell required
    const noConversionRequired =
      (state.senderWalletCurrency === WalletCurrency.Btc &&
        state.settlementMethod === SettlementMethod.OnChain) ||
      (state.senderWalletCurrency as WalletCurrency) ===
        (state.recipientWalletCurrency as WalletCurrency)

    if (noConversionRequired && btcProposedAmount && usdProposedAmount) {
      return OPFBWithConversion(
        currentStateFromAllAmountsPresent({
          btcProposedAmount,
          usdProposedAmount,
        }),
      )
    }

    if (noConversionRequired && btcProposedAmount) {
      return OPFBWithConversion(
        updatedStateFromBtcProposedAmountMid({ btcProposedAmount }),
      )
    }

    if (noConversionRequired && usdProposedAmount) {
      return OPFBWithConversion(updatedStateFromUsdProposedAmountMid(usdProposedAmount))
    }

    if (noConversionRequired) {
      return OPFBWithError(
        new InvalidOnChainPaymentFlowBuilderStateError(
          "withConversion - btcProposedAmount || btcProtocolAndBankFee not set",
        ),
      )
    }

    if (btcProposedAmount) {
      const updatedStateFromBtcProposedAmountDealerFallbackMid = async () => {
        const updatedState =
          await updatedStateFromBtcProposedAmountDealer(btcProposedAmount)
        if (!(updatedState instanceof InvalidZeroAmountPriceRatioInputError)) {
          return updatedState
        }

        const recipientBtcWalletDescriptor =
          state.recipientWalletDescriptors?.[WalletCurrency.Btc]

        if (recipientBtcWalletDescriptor === undefined) {
          return new InvalidLightningPaymentFlowBuilderStateError(
            "expected recipient BTC wallet missing",
          )
        }
        if (recipientBtcWalletDescriptor.id === state.senderWalletId) {
          return new SubOneCentSatAmountForUsdSelfSendError()
        }

        return updatedStateFromBtcProposedAmountMid({
          btcProposedAmount,
          recipientWalletDescriptor: recipientBtcWalletDescriptor,
        })
      }

      return OPFBWithConversion(updatedStateFromBtcProposedAmountDealerFallbackMid())
    }

    if (usdProposedAmount) {
      return OPFBWithConversion(
        updatedStateFromUsdProposedAmountDealer(usdProposedAmount),
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
  const validateBtcPaymentAmountForDust = ({
    state,
    btcPaymentAmount,
  }: {
    state: OPFBWithConversionState<S, R>
    btcPaymentAmount: BtcPaymentAmount
  }): BtcPaymentAmount | ValidationError => {
    if (
      !(state.settlementMethod === SettlementMethod.IntraLedger) &&
      btcPaymentAmount.amount < state.dustThreshold
    ) {
      return new LessThanDustThresholdError(
        `Use lightning to send amounts less than ${state.dustThreshold} sats`,
      )
    }

    return btcPaymentAmount
  }

  const stateFromPromise = async (
    statePromise: Promise<OPFBWithConversionState<S, R> | DealerPriceServiceError>,
  ) => {
    const state = await statePromise
    if (state instanceof Error) return state

    const isIntraLedger = async () => !(await state.isExternalAddress(state))
    const settlementMethodFromAddress = (await isIntraLedger())
      ? SettlementMethod.IntraLedger
      : SettlementMethod.OnChain

    if (
      state.settlementMethod !== settlementMethodFromAddress ||
      (state.settlementMethod === SettlementMethod.IntraLedger &&
        !state.recipientWalletId)
    ) {
      return new InvalidOnChainPaymentFlowBuilderStateError(
        "withoutRecipientWallet called but settlementMethod is IntraLedger",
      )
    }

    const btcProposedAmount = validateBtcPaymentAmountForDust({
      state,
      btcPaymentAmount: state.btcProposedAmount,
    })
    if (btcProposedAmount instanceof Error) return btcProposedAmount

    return state
  }

  const withoutMinerFee = async (): Promise<
    OnChainPaymentFlow<S, R> | ValidationError | DealerPriceServiceError
  > => {
    const state = await stateFromPromise(statePromise)
    if (state instanceof Error) return state

    const usdPaymentAmount = state.usdProposedAmount
    const btcPaymentAmount = state.btcProposedAmount

    return OnChainPaymentFlow({
      ...state,
      btcProtocolAndBankFee: onChainFees.intraLedgerFees().btc,
      usdProtocolAndBankFee: onChainFees.intraLedgerFees().usd,
      ...ZERO_BANK_FEE,
      btcPaymentAmount,
      usdPaymentAmount,
      paymentSentAndPending: false,
    })
  }

  const withMinerFee = async (
    minerFee: BtcPaymentAmount,
  ): Promise<OnChainPaymentFlow<S, R> | ValidationError | DealerPriceServiceError> => {
    const state = await stateFromPromise(statePromise)
    if (state instanceof Error) return state

    const priceRatio = WalletPriceRatio({
      usd: state.usdProposedAmount,
      btc: state.btcProposedAmount,
    })
    if (priceRatio instanceof Error) return priceRatio

    const minBankFee = paymentAmountFromNumber({
      amount: state.senderWithdrawFee || feeConfig.withdrawDefaultMin,
      currency: WalletCurrency.Btc,
    })
    if (minBankFee instanceof Error) return minBankFee

    const imbalanceCalculator = ImbalanceCalculator({
      method: feeConfig.withdrawMethod,
      volumeAmountLightningFn: state.volumeAmountLightningFn,
      volumeAmountOnChainFn: state.volumeAmountOnChainFn,
      sinceDaysAgo: feeConfig.withdrawDaysLookback,
    })
    const imbalanceForWallet = await imbalanceCalculator.getSwapOutImbalanceAmount<S>({
      id: state.senderWalletId,
      currency: state.senderWalletCurrency,
      accountId: state.senderAccountId,
    })
    if (imbalanceForWallet instanceof Error) return imbalanceForWallet

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

    // Calculate amounts & fees
    const btcProtocolAndBankFee = feeAmounts.totalFee
    const usdProtocolAndBankFee = priceRatio.convertFromBtcToCeil(feeAmounts.totalFee)

    let btcPaymentAmount = state.btcProposedAmount
    let usdPaymentAmount = state.usdProposedAmount
    if (state.sendAll) {
      switch (state.senderWalletCurrency) {
        case WalletCurrency.Btc:
          btcPaymentAmount = calc.sub(state.btcProposedAmount, btcProtocolAndBankFee)
          usdPaymentAmount = priceRatio.convertFromBtc(btcPaymentAmount)
          break
        case WalletCurrency.Usd:
          usdPaymentAmount = calc.sub(state.usdProposedAmount, usdProtocolAndBankFee)
          btcPaymentAmount = priceRatio.convertFromUsd(usdPaymentAmount)
          break
      }
    }

    const validatedBtcPaymentAmount = validateBtcPaymentAmountForDust({
      state,
      btcPaymentAmount,
    })
    if (validatedBtcPaymentAmount instanceof Error) return validatedBtcPaymentAmount

    return OnChainPaymentFlow({
      ...state,
      btcProtocolAndBankFee,
      usdProtocolAndBankFee,
      btcBankFee: feeAmounts.bankFee,
      usdBankFee: priceRatio.convertFromBtcToCeil(feeAmounts.bankFee),
      btcPaymentAmount: validatedBtcPaymentAmount,
      usdPaymentAmount,
      btcMinerFee: minerFee,
      paymentSentAndPending: false,
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
    addressForFlow,
    senderWalletDescriptor,
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
    return Promise.resolve(error)
  }
  const withoutMinerFee = () => {
    return Promise.resolve(error)
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
  }
}
