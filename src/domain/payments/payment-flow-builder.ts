import { ValidationError, WalletCurrency } from "@domain/shared"
import { SelfPaymentError } from "@domain/errors"
import { PaymentInitiationMethod, SettlementMethod } from "@domain/wallets"
import { checkedToBtcPaymentAmount, checkedToUsdPaymentAmount } from "@domain/payments"
import { generateIntraLedgerHash } from "@domain/payments/get-intraledger-hash"
import { parseFinalHopsFromInvoice } from "@domain/bitcoin/lightning"

import { ModifiedSet } from "@utils"

import {
  InvalidLightningPaymentFlowBuilderStateError,
  InvalidLightningPaymentFlowStateError,
} from "./errors"
import { LnFees } from "./ln-fees"
import { PriceRatio } from "./price-ratio"
import { PaymentFlow } from "./payment-flow"

export const LightningPaymentFlowBuilder = <S extends WalletCurrency>(
  config: LightningPaymentFlowBuilderConfig,
): LightningPaymentFlowBuilder<S> => {
  const settlementMethodFromDestination = (
    destination: Pubkey | undefined,
  ): {
    settlementMethod: SettlementMethod
    btcProtocolFee: BtcPaymentAmount | undefined
    usdProtocolFee: UsdPaymentAmount | undefined
  } => {
    const settlementMethod =
      destination === undefined
        ? SettlementMethod.IntraLedger
        : config.localNodeIds.includes(destination)
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

  const skipProbeFromInvoice = (invoice: LnInvoice): boolean => {
    const invoicePubkeySet = new ModifiedSet(parseFinalHopsFromInvoice(invoice))
    const flaggedPubkeySet = new ModifiedSet(config.flaggedPubkeys)

    return invoicePubkeySet.intersect(flaggedPubkeySet).size > 0
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
          btcProtocolFee: state.btcProtocolFee || LnFees().maxProtocolFee(paymentAmount),
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
          usdProtocolFee: state.usdProtocolFee || LnFees().maxProtocolFee(paymentAmount),
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
    id: recipientWalletId,
    currency: recipientWalletCurrency,
    pubkey: recipientPubkey,
    usdPaymentAmount,
    username: recipientUsername,
    accountId: recipientAccountId,
  }: WalletDescriptor<R> & {
    accountId: AccountId
    pubkey?: Pubkey
    usdPaymentAmount?: UsdPaymentAmount
    username?: Username
  }): LPFBWithRecipientWallet<S, R> | LPFBWithError => {
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
    const stateWithCreatedAt = { ...state, createdAt: new Date(Date.now()) }
    const { btcPaymentAmount, usdPaymentAmount, btcProtocolFee, usdProtocolFee } = state

    // Use mid price when no buy / sell required
    const noConversionRequired =
      (state.senderWalletCurrency === WalletCurrency.Btc &&
        state.settlementMethod === SettlementMethod.Lightning) ||
      (state.senderWalletCurrency as WalletCurrency) ===
        (state.recipientWalletCurrency as WalletCurrency)

    if (noConversionRequired) {
      if (btcPaymentAmount && btcProtocolFee) {
        if (usdPaymentAmount && usdProtocolFee) {
          return LPFBWithConversion(
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

        const updatedStateFromBtcPaymentAmount = async (
          btcPaymentAmount: BtcPaymentAmount,
        ): Promise<LPFBWithConversionState<S, R> | DealerPriceServiceError> => {
          const convertedAmount = await mid.usdFromBtc(btcPaymentAmount)
          if (convertedAmount instanceof Error) return convertedAmount

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
        }

        return LPFBWithConversion(updatedStateFromBtcPaymentAmount(btcPaymentAmount))
      } else if (usdPaymentAmount && usdProtocolFee) {
        const updatedStateFromUsdPaymentAmount = async (
          usdPaymentAmount: UsdPaymentAmount,
        ): Promise<LPFBWithConversionState<S, R> | DealerPriceServiceError> => {
          const convertedAmount = await mid.btcFromUsd(usdPaymentAmount)
          if (convertedAmount instanceof Error) return convertedAmount

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
        }

        return LPFBWithConversion(updatedStateFromUsdPaymentAmount(usdPaymentAmount))
      } else {
        return LPFBWithError(
          new InvalidLightningPaymentFlowBuilderStateError(
            "withConversion - btcPaymentAmount || btcProtocolFee not set",
          ),
        )
      }
    }

    // Convert to usd if necessary
    if (btcPaymentAmount && btcProtocolFee) {
      // We already know usd amount from the recipient invoice
      if (
        state.recipientWalletCurrency === WalletCurrency.Usd &&
        usdPaymentAmount &&
        usdProtocolFee
      ) {
        return LPFBWithConversion(
          Promise.resolve({
            ...stateWithCreatedAt,
            btcPaymentAmount,
            usdPaymentAmount,
            btcProtocolFee,
            usdProtocolFee,
          }),
        )
      }

      const updatedStateFromBtcPaymentAmount = async (
        btcPaymentAmount: BtcPaymentAmount,
      ): Promise<LPFBWithConversionState<S, R> | DealerPriceServiceError> => {
        const usdFromBtc =
          state.senderWalletCurrency === WalletCurrency.Btc
            ? hedgeBuyUsd.usdFromBtc
            : hedgeSellUsd.usdFromBtc

        const convertedAmount = await usdFromBtc(btcPaymentAmount)
        if (convertedAmount instanceof Error) return convertedAmount

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
      }

      return LPFBWithConversion(updatedStateFromBtcPaymentAmount(btcPaymentAmount))
    }

    if (usdPaymentAmount && usdProtocolFee) {
      const updatedStateFromUsdPaymentAmount = async (
        usdPaymentAmount: UsdPaymentAmount,
      ): Promise<LPFBWithConversionState<S, R> | DealerPriceServiceError> => {
        const btcFromUsd =
          state.senderWalletCurrency === WalletCurrency.Btc
            ? hedgeBuyUsd.btcFromUsd
            : hedgeSellUsd.btcFromUsd

        const convertedAmount = await btcFromUsd(usdPaymentAmount)
        if (convertedAmount instanceof Error) return convertedAmount

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
      }

      return LPFBWithConversion(updatedStateFromUsdPaymentAmount(usdPaymentAmount))
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

      descriptionFromInvoice: state.descriptionFromInvoice,
      skipProbeForDestination: state.skipProbeForDestination,
      btcPaymentAmount: state.btcPaymentAmount,
      usdPaymentAmount: state.usdPaymentAmount,
      inputAmount: state.inputAmount,
      createdAt: state.createdAt,
      paymentSentAndPending: false,

      settlementMethod: state.settlementMethod,
      paymentInitiationMethod: state.paymentInitiationMethod,

      btcProtocolFee: state.btcProtocolFee,
      usdProtocolFee: state.usdProtocolFee,

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

    const priceRatio = PriceRatio({
      usd: state.usdPaymentAmount,
      btc: state.btcPaymentAmount,
    })
    if (priceRatio instanceof Error) return priceRatio

    const btcProtocolFee = LnFees().feeFromRawRoute(rawRoute)
    if (btcProtocolFee instanceof Error) return btcProtocolFee
    const usdProtocolFee = priceRatio.convertFromBtcToCeil(btcProtocolFee)

    return paymentFromState({
      ...state,
      outgoingNodePubkey: pubkey,
      checkedRoute: rawRoute,
      btcProtocolFee,
      usdProtocolFee,
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
