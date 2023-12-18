import {
  InvalidLightningPaymentFlowBuilderStateError,
  InvalidLightningPaymentFlowStateError,
  InvalidZeroAmountPriceRatioInputError,
  SubOneCentSatAmountForUsdSelfSendError,
} from "./errors"

import { LnFees } from "./ln-fees"

import { WalletPriceRatio } from "./price-ratio"

import { PaymentFlow } from "./payment-flow"

import {
  ValidationError,
  WalletCurrency,
  checkedToUsdPaymentAmount,
  checkedToBtcPaymentAmount,
} from "@/domain/shared"
import { SelfPaymentError } from "@/domain/errors"
import { PaymentInitiationMethod, SettlementMethod } from "@/domain/wallets"

import { generateIntraLedgerHash } from "@/domain/payments/get-intraledger-hash"
import {
  parseFinalChanIdFromInvoice,
  parseFinalHopsFromInvoice,
} from "@/domain/bitcoin/lightning"

import { addAttributesToCurrentSpan } from "@/services/tracing"

import { ModifiedSet } from "@/utils"

export const LightningPaymentFlowBuilder = <S extends WalletCurrency>(
  config: LightningPaymentFlowBuilderConfig,
): LightningPaymentFlowBuilder<S> => {
  const settlementMethodFromDestination = (
    destination: Pubkey | undefined,
  ): {
    settlementMethod: SettlementMethod
    btcProtocolAndBankFee: BtcPaymentAmount | undefined
    usdProtocolAndBankFee: UsdPaymentAmount | undefined
  } => {
    const settlementMethod =
      destination === undefined
        ? SettlementMethod.IntraLedger
        : config.localNodeIds.includes(destination)
          ? SettlementMethod.IntraLedger
          : SettlementMethod.Lightning
    return {
      settlementMethod,
      btcProtocolAndBankFee:
        settlementMethod === SettlementMethod.IntraLedger
          ? LnFees().intraLedgerFees().btc
          : undefined,
      usdProtocolAndBankFee:
        settlementMethod === SettlementMethod.IntraLedger
          ? LnFees().intraLedgerFees().usd
          : undefined,
    }
  }

  const skipProbeFromInvoice = (invoice: LnInvoice): boolean => {
    const invoicePubkeySet = new ModifiedSet(parseFinalHopsFromInvoice(invoice))
    const flaggedPubkeySet = new ModifiedSet(config.skipProbe.pubkey)
    const pubkeyIsFlagged = invoicePubkeySet.intersect(flaggedPubkeySet).size > 0

    const invoiceChanIdSet = new ModifiedSet(parseFinalChanIdFromInvoice(invoice))
    const flaggedChanIdSet = new ModifiedSet(config.skipProbe.chanId)
    const chanIdIsFlagged = invoiceChanIdSet.intersect(flaggedChanIdSet).size > 0

    addAttributesToCurrentSpan({
      pubkeyIsFlagged: `${pubkeyIsFlagged}`,
      pubkeysFromInvoice: `${Array.from(invoicePubkeySet)}`,

      chanIdIsFlagged: `${chanIdIsFlagged}`,
      chanIdsFromInvoice: `${Array.from(invoiceChanIdSet)}`,
    })

    return pubkeyIsFlagged || chanIdIsFlagged
  }

  const withInvoice = (invoice: LnInvoice): LPFBWithInvoice<S> | LPFBWithError => {
    if (invoice.paymentAmount === null) {
      return LPFBWithError(
        new InvalidLightningPaymentFlowBuilderStateError(
          "withInvoice - paymentAmount missing",
        ),
      )
    }
    return LPFBWithInvoice({
      ...config,
      ...settlementMethodFromDestination(invoice.destination),
      paymentInitiationMethod: PaymentInitiationMethod.Lightning,
      paymentHash: invoice.paymentHash,
      btcPaymentAmount: invoice.paymentAmount,
      inputAmount: invoice.paymentAmount.amount,
      descriptionFromInvoice: invoice.description,
      skipProbeForDestination: skipProbeFromInvoice(invoice),
    })
  }

  const withNoAmountInvoice = ({
    invoice,
    uncheckedAmount,
  }: {
    invoice: LnInvoice
    uncheckedAmount: number
  }): LPFBWithInvoice<S> | LPFBWithError => {
    return LPFBWithInvoice({
      ...config,
      ...settlementMethodFromDestination(invoice.destination),
      paymentInitiationMethod: PaymentInitiationMethod.Lightning,
      paymentHash: invoice.paymentHash,
      uncheckedAmount,
      descriptionFromInvoice: invoice.description,
      skipProbeForDestination: skipProbeFromInvoice(invoice),
    })
  }

  const withoutInvoice = ({
    uncheckedAmount,
    description,
  }: {
    uncheckedAmount: number
    description: string
  }): LPFBWithInvoice<S> | LPFBWithError => {
    return LPFBWithInvoice({
      ...config,
      ...settlementMethodFromDestination(undefined),
      paymentInitiationMethod: PaymentInitiationMethod.IntraLedger,
      intraLedgerHash: generateIntraLedgerHash(),
      uncheckedAmount,
      descriptionFromInvoice: description,
      skipProbeForDestination: false,
    })
  }

  return {
    withInvoice,
    withNoAmountInvoice,
    withoutInvoice,
  }
}

const LPFBWithInvoice = <S extends WalletCurrency>(
  state: LPFBWithInvoiceState,
): LPFBWithInvoice<S> | LPFBWithError => {
  const withSenderWallet = (senderWallet: WalletDescriptor<S>) => {
    const {
      id: senderWalletId,
      accountId: senderAccountId,
    }: { id: WalletId; accountId: AccountId } = senderWallet
    const senderWalletCurrency = senderWallet.currency as S

    if (state.uncheckedAmount !== undefined) {
      if (senderWalletCurrency === WalletCurrency.Btc) {
        const paymentAmount = checkedToBtcPaymentAmount(state.uncheckedAmount)
        if (paymentAmount instanceof ValidationError) {
          return LPFBWithError(paymentAmount)
        }
        return LPFBWithSenderWallet({
          ...state,
          senderWalletId,
          senderWalletCurrency,
          senderAccountId,
          btcPaymentAmount: paymentAmount,
          inputAmount: paymentAmount.amount,
          btcProtocolAndBankFee:
            state.btcProtocolAndBankFee || LnFees().maxProtocolAndBankFee(paymentAmount),
        })
      } else {
        const paymentAmount = checkedToUsdPaymentAmount(state.uncheckedAmount)
        if (paymentAmount instanceof ValidationError) {
          return LPFBWithError(paymentAmount)
        }
        return LPFBWithSenderWallet({
          ...state,
          senderWalletId,
          senderWalletCurrency,
          senderAccountId,
          usdPaymentAmount: paymentAmount,
          inputAmount: paymentAmount.amount,
          usdProtocolAndBankFee:
            state.usdProtocolAndBankFee || LnFees().maxProtocolAndBankFee(paymentAmount),
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
        senderAccountId,
        btcPaymentAmount,
        btcProtocolAndBankFee:
          state.btcProtocolAndBankFee || LnFees().maxProtocolAndBankFee(btcPaymentAmount),
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
): LPFBWithSenderWallet<S> | LPFBWithError => {
  const withoutRecipientWallet = <R extends WalletCurrency>():
    | LPFBWithRecipientWallet<S, R>
    | LPFBWithError => {
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
    defaultWalletCurrency: recipientWalletCurrency,
    recipientWalletDescriptors,
    pubkey: recipientPubkey,
    usdPaymentAmount,
    username: recipientUsername,
    userId: recipientUserId,
  }: LPFBWithRecipientArgs<R>): LPFBWithRecipientWallet<S, R> | LPFBWithError => {
    const { id: recipientWalletId, accountId: recipientAccountId } =
      recipientWalletDescriptors[recipientWalletCurrency]
    if (recipientWalletId === state.senderWalletId) {
      return LPFBWithError(new SelfPaymentError())
    }
    if (
      recipientWalletCurrency === WalletCurrency.Usd &&
      // This means (usdPaymentAmount === undefined XNOR state.uncheckedAmount === undefined)
      // XNOR => if both or neither are set we get here - else we're fine
      !!usdPaymentAmount === !!state.uncheckedAmount
    ) {
      return LPFBWithError(
        new InvalidLightningPaymentFlowBuilderStateError(
          "withRecipientWallet incorrect combination of usdPaymentAmount and uncheckedAmount",
        ),
      )
    }

    return LPFBWithRecipientWallet({
      ...state,
      recipientWalletId,
      recipientWalletCurrency,
      recipientPubkey,
      recipientAccountId,
      recipientUsername,
      recipientUserId,
      recipientWalletDescriptors,
      usdPaymentAmount: usdPaymentAmount || state.usdPaymentAmount,
    })
  }

  const isIntraLedger = () => state.settlementMethod === SettlementMethod.IntraLedger

  return {
    withoutRecipientWallet,
    withRecipientWallet,
    isIntraLedger,
  }
}

const LPFBWithRecipientWallet = <S extends WalletCurrency, R extends WalletCurrency>(
  state: LPFBWithRecipientWalletState<S, R>,
): LPFBWithRecipientWallet<S, R> | LPFBWithError => {
  const withConversion = ({
    hedgeBuyUsd,
    hedgeSellUsd,
    mid,
  }: WithConversionArgs): LPFBWithConversion<S, R> | LPFBWithError => {
    const stateWithCreatedAt = { ...state, createdAt: new Date() }
    const {
      btcPaymentAmount,
      usdPaymentAmount,
      btcProtocolAndBankFee,
      usdProtocolAndBankFee,
    } = state

    // Setup conditions
    const noConversionRequired =
      (state.senderWalletCurrency === WalletCurrency.Btc &&
        state.settlementMethod === SettlementMethod.Lightning) ||
      (state.senderWalletCurrency as WalletCurrency) ===
        (state.recipientWalletCurrency as WalletCurrency)

    const hasBtcAmounts = !!(btcPaymentAmount && btcProtocolAndBankFee)
    const hasUsdAmounts = !!(usdPaymentAmount && usdProtocolAndBankFee)
    const isUsdRecipient = !!(state.recipientWalletCurrency === WalletCurrency.Usd)

    // Define conversion methods
    const currentStateFromAllAmountsPresent = async (amounts: AmountsAndFees) => ({
      ...stateWithCreatedAt,
      ...amounts,
    })

    const updatedStateFromBtcPaymentAmountMid = async ({
      btcPaymentAmount,
      btcProtocolAndBankFee,
      recipientWalletDescriptor,
    }: BtcAmountsAndFees & {
      recipientWalletDescriptor?: WalletDescriptor<WalletCurrency>
    }): Promise<LPFBWithConversionState<S, R> | DealerPriceServiceError> => {
      const convertedAmount = await mid.usdFromBtc(btcPaymentAmount)
      if (convertedAmount instanceof Error) return convertedAmount

      const priceRatio = WalletPriceRatio({
        usd: convertedAmount,
        btc: btcPaymentAmount,
      })
      if (priceRatio instanceof Error) return priceRatio

      const usdProtocolAndBankFee = priceRatio.convertFromBtcToCeil(btcProtocolAndBankFee)
      return {
        ...stateWithCreatedAt,
        ...(recipientWalletDescriptor !== undefined
          ? {
              recipientWalletId: recipientWalletDescriptor.id,
              recipientWalletCurrency: recipientWalletDescriptor.currency as R,
            }
          : {}),
        btcPaymentAmount,
        usdPaymentAmount: convertedAmount,
        btcProtocolAndBankFee,
        usdProtocolAndBankFee,
      }
    }

    const updatedStateFromBtcPaymentAmountDealer = async ({
      btcPaymentAmount,
      btcProtocolAndBankFee,
    }: BtcAmountsAndFees): Promise<
      LPFBWithConversionState<S, R> | DealerPriceServiceError
    > => {
      const usdFromBtc =
        state.senderWalletCurrency === WalletCurrency.Btc
          ? hedgeBuyUsd.usdFromBtc
          : hedgeSellUsd.usdFromBtc

      const convertedAmount = await usdFromBtc(btcPaymentAmount)
      if (convertedAmount instanceof Error) return convertedAmount

      const priceRatio = WalletPriceRatio({
        usd: convertedAmount,
        btc: btcPaymentAmount,
      })
      if (priceRatio instanceof Error) return priceRatio

      const usdProtocolAndBankFee = priceRatio.convertFromBtcToCeil(btcProtocolAndBankFee)
      return {
        ...stateWithCreatedAt,
        btcPaymentAmount,
        usdPaymentAmount: convertedAmount,
        btcProtocolAndBankFee,
        usdProtocolAndBankFee,
      }
    }

    const updatedStateFromUsdPaymentAmountMid = async ({
      usdPaymentAmount,
      usdProtocolAndBankFee,
    }: UsdAmountsAndFees): Promise<
      LPFBWithConversionState<S, R> | DealerPriceServiceError
    > => {
      const convertedAmount = await mid.btcFromUsd(usdPaymentAmount)
      if (convertedAmount instanceof Error) return convertedAmount

      const priceRatio = WalletPriceRatio({
        btc: convertedAmount,
        usd: usdPaymentAmount,
      })
      if (priceRatio instanceof Error) return priceRatio

      const btcProtocolAndBankFee = priceRatio.convertFromUsd(usdProtocolAndBankFee)
      return {
        ...stateWithCreatedAt,
        btcPaymentAmount: convertedAmount,
        usdPaymentAmount,
        btcProtocolAndBankFee,
        usdProtocolAndBankFee,
      }
    }

    const updatedStateFromUsdPaymentAmountDealer = async ({
      usdPaymentAmount,
      usdProtocolAndBankFee,
    }: UsdAmountsAndFees): Promise<
      LPFBWithConversionState<S, R> | DealerPriceServiceError
    > => {
      const btcFromUsd =
        state.senderWalletCurrency === WalletCurrency.Btc
          ? hedgeBuyUsd.btcFromUsd
          : hedgeSellUsd.btcFromUsd

      const convertedAmount = await btcFromUsd(usdPaymentAmount)
      if (convertedAmount instanceof Error) return convertedAmount

      const priceRatio = WalletPriceRatio({
        btc: convertedAmount,
        usd: usdPaymentAmount,
      })
      if (priceRatio instanceof Error) return priceRatio

      const btcProtocolAndBankFee = priceRatio.convertFromUsd(usdProtocolAndBankFee)
      return {
        ...stateWithCreatedAt,
        btcPaymentAmount: convertedAmount,
        usdPaymentAmount,
        btcProtocolAndBankFee,
        usdProtocolAndBankFee,
      }
    }

    // Apply conversion methods based on conditional checks
    if (noConversionRequired && hasBtcAmounts && hasUsdAmounts) {
      return LPFBWithConversion(
        currentStateFromAllAmountsPresent({
          btcPaymentAmount,
          usdPaymentAmount,
          btcProtocolAndBankFee,
          usdProtocolAndBankFee,
        }),
      )
    }

    if (noConversionRequired && hasBtcAmounts) {
      return LPFBWithConversion(
        updatedStateFromBtcPaymentAmountMid({
          btcPaymentAmount,
          btcProtocolAndBankFee,
        }),
      )
    }

    if (noConversionRequired && hasUsdAmounts) {
      return LPFBWithConversion(
        updatedStateFromUsdPaymentAmountMid({
          usdPaymentAmount,
          usdProtocolAndBankFee,
        }),
      )
    }

    if (noConversionRequired) {
      return LPFBWithError(
        new InvalidLightningPaymentFlowBuilderStateError(
          "withConversion - btcPaymentAmount || btcProtocolAndBankFee not set",
        ),
      )
    }

    if (hasBtcAmounts && hasUsdAmounts && isUsdRecipient) {
      return LPFBWithConversion(
        currentStateFromAllAmountsPresent({
          btcPaymentAmount,
          usdPaymentAmount,
          btcProtocolAndBankFee,
          usdProtocolAndBankFee,
        }),
      )
    }

    if (hasBtcAmounts) {
      const updatedStateFromBtcPaymentAmountDealerFallbackMid = async () => {
        const updatedState = await updatedStateFromBtcPaymentAmountDealer({
          btcPaymentAmount,
          btcProtocolAndBankFee,
        })
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

        return updatedStateFromBtcPaymentAmountMid({
          btcPaymentAmount,
          btcProtocolAndBankFee,
          recipientWalletDescriptor: recipientBtcWalletDescriptor,
        })
      }

      return LPFBWithConversion(updatedStateFromBtcPaymentAmountDealerFallbackMid())
    }

    if (hasUsdAmounts) {
      return LPFBWithConversion(
        updatedStateFromUsdPaymentAmountDealer({
          usdPaymentAmount,
          usdProtocolAndBankFee,
        }),
      )
    }

    return LPFBWithError(
      new InvalidLightningPaymentFlowBuilderStateError(
        "withConversion - impossible withConversion state",
      ),
    )
  }

  return {
    withConversion,
  }
}

const LPFBWithConversion = <S extends WalletCurrency, R extends WalletCurrency>(
  statePromise: Promise<LPFBWithConversionState<S, R> | DealerPriceServiceError>,
): LPFBWithConversion<S, R> | LPFBWithError => {
  const paymentFromState = (
    state: LPFBWithRouteState<S, R>,
  ): PaymentFlow<S, R> | ValidationError => {
    const hash = state.paymentHash
      ? { paymentHash: state.paymentHash }
      : state.intraLedgerHash
        ? { intraLedgerHash: state.intraLedgerHash }
        : new InvalidLightningPaymentFlowStateError()
    if (hash instanceof Error) return hash

    return PaymentFlow({
      ...hash,

      senderWalletId: state.senderWalletId,
      senderWalletCurrency: state.senderWalletCurrency,
      senderAccountId: state.senderAccountId,
      recipientWalletId: state.recipientWalletId,
      recipientWalletCurrency: state.recipientWalletCurrency,
      recipientAccountId: state.recipientAccountId,
      recipientPubkey: state.recipientPubkey,
      recipientUsername: state.recipientUsername,
      recipientUserId: state.recipientUserId,

      descriptionFromInvoice: state.descriptionFromInvoice,
      skipProbeForDestination: state.skipProbeForDestination,
      btcPaymentAmount: state.btcPaymentAmount,
      usdPaymentAmount: state.usdPaymentAmount,
      inputAmount: state.inputAmount,
      createdAt: state.createdAt,
      paymentSentAndPending: false,

      settlementMethod: state.settlementMethod,
      paymentInitiationMethod: state.paymentInitiationMethod,

      btcProtocolAndBankFee: state.btcProtocolAndBankFee,
      usdProtocolAndBankFee: state.usdProtocolAndBankFee,

      outgoingNodePubkey: state.outgoingNodePubkey,
      cachedRoute: state.checkedRoute,
    })
  }

  const withoutRoute = async () => {
    const state = await statePromise
    if (state instanceof Error) return state

    return paymentFromState({
      ...state,
      outgoingNodePubkey: undefined,
      checkedRoute: undefined,
    })
  }

  const withRoute = async ({
    pubkey,
    rawRoute,
  }: {
    pubkey: Pubkey
    rawRoute: RawRoute
  }): Promise<PaymentFlow<S, R> | ValidationError | DealerPriceServiceError> => {
    const state = await statePromise
    if (state instanceof Error) return state

    const priceRatio = WalletPriceRatio({
      usd: state.usdPaymentAmount,
      btc: state.btcPaymentAmount,
    })
    if (priceRatio instanceof Error) return priceRatio

    const btcProtocolAndBankFee = LnFees().feeFromRawRoute(rawRoute)
    if (btcProtocolAndBankFee instanceof Error) return btcProtocolAndBankFee
    const usdProtocolAndBankFee = priceRatio.convertFromBtcToCeil(btcProtocolAndBankFee)

    return paymentFromState({
      ...state,
      outgoingNodePubkey: pubkey,
      checkedRoute: rawRoute,
      btcProtocolAndBankFee,
      usdProtocolAndBankFee,
    })
  }

  const btcPaymentAmount = async () => {
    const state = await statePromise
    if (state instanceof Error) return state

    return state.btcPaymentAmount
  }

  const usdPaymentAmount = async () => {
    const state = await statePromise
    if (state instanceof Error) return state

    return state.usdPaymentAmount
  }

  const skipProbeForDestination = async () => {
    const state = await statePromise
    if (state instanceof Error) return state

    return state.skipProbeForDestination
  }

  const isIntraLedger = async () => {
    const state = await statePromise
    if (state instanceof Error) return state

    return state.settlementMethod === SettlementMethod.IntraLedger
  }

  const isTradeIntraAccount = async () => {
    const state = await statePromise
    if (state instanceof Error) return state

    return (
      state.senderAccountId === state.recipientAccountId &&
      state.senderWalletCurrency !==
        (state.recipientWalletCurrency as unknown as S | undefined)
    )
  }

  return {
    withRoute,
    withoutRoute,
    btcPaymentAmount,
    usdPaymentAmount,
    skipProbeForDestination,
    isIntraLedger,
    isTradeIntraAccount,
  }
}

const LPFBWithError = (
  error:
    | ValidationError
    | SelfPaymentError
    | DealerPriceServiceError
    | InvalidLightningPaymentFlowBuilderStateError,
): LPFBWithError => {
  const withSenderWallet = () => {
    return LPFBWithError(error)
  }
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
  const skipProbeForDestination = async () => {
    return Promise.resolve(error)
  }
  const isIntraLedger = async () => {
    return Promise.resolve(error)
  }
  const isTradeIntraAccount = async () => {
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
    withoutRecipientWallet,
    withRecipientWallet,
    withConversion,
    skipProbeForDestination,
    isIntraLedger,
    isTradeIntraAccount,
    withRoute,
    withoutRoute,
    btcPaymentAmount,
    usdPaymentAmount,
  }
}
