import {
  InvalidLightningPaymentFlowBuilderStateError,
  IntraLedgerHashPresentInLnFlowError,
  LnHashPresentInIntraLedgerFlowError,
  InvalidOnChainPaymentFlowBuilderStateError,
} from "./errors"

import { RouteValidator } from "./route-validator"

import { InsufficientBalanceError, InvalidCurrencyForWalletError } from "@/domain/errors"
import { AmountCalculator, ErrorLevel, WalletCurrency } from "@/domain/shared"
import { recordExceptionInCurrentSpan } from "@/services/tracing"

export const PaymentFlowCommon = <S extends WalletCurrency, R extends WalletCurrency>(
  state: PaymentFlowCommonState<S, R>,
): PaymentFlowCommon<S, R> => {
  const protocolAndBankFeeInSenderWalletCurrency = (): PaymentAmount<S> => {
    return state.senderWalletCurrency === WalletCurrency.Btc
      ? (state.btcProtocolAndBankFee as PaymentAmount<S>)
      : (state.usdProtocolAndBankFee as PaymentAmount<S>)
  }

  const paymentAmounts = (): PaymentAmountInAllCurrencies => ({
    btc: state.btcPaymentAmount,
    usd: state.usdPaymentAmount,
  })

  const totalAmountsForPayment = (): {
    btc: BtcPaymentAmount
    usd: UsdPaymentAmount
  } => ({
    btc: AmountCalculator().add(state.btcPaymentAmount, state.btcProtocolAndBankFee),
    usd: AmountCalculator().add(state.usdPaymentAmount, state.usdProtocolAndBankFee),
  })

  const routeDetails = (): {
    rawRoute: RawRoute | undefined
    outgoingNodePubkey: Pubkey | undefined
  } => {
    const uncheckedRawRoute = state.cachedRoute

    let rawRoute: RawRoute | undefined = uncheckedRawRoute
    if (uncheckedRawRoute) {
      const validateRoute = RouteValidator(uncheckedRawRoute).validate(
        state.btcPaymentAmount,
      )
      if (validateRoute instanceof Error) {
        rawRoute = undefined
        recordExceptionInCurrentSpan({ error: validateRoute, level: ErrorLevel.Warn })
      }
    }

    return {
      rawRoute,
      outgoingNodePubkey: rawRoute ? state.outgoingNodePubkey : undefined,
    }
  }

  const recipientDetails = (): {
    walletDescriptor: WalletDescriptor<R> | undefined
    recipientPubkey: Pubkey | undefined
    recipientUsername: Username | undefined
    recipientUserId: UserId | undefined
  } => ({
    walletDescriptor:
      state.recipientWalletId && state.recipientWalletCurrency && state.recipientAccountId
        ? {
            id: state.recipientWalletId,
            currency: state.recipientWalletCurrency,
            accountId: state.recipientAccountId,
          }
        : undefined,
    recipientPubkey: state.recipientPubkey,
    recipientUsername: state.recipientUsername,
    recipientUserId: state.recipientUserId,
  })

  const senderWalletDescriptor = (): WalletDescriptor<S> => ({
    id: state.senderWalletId,
    currency: state.senderWalletCurrency,
    accountId: state.senderAccountId,
  })

  const recipientWalletDescriptor = (): WalletDescriptor<R> | undefined =>
    state.recipientWalletId && state.recipientWalletCurrency && state.recipientAccountId
      ? {
          id: state.recipientWalletId,
          currency: state.recipientWalletCurrency,
          accountId: state.recipientAccountId,
        }
      : undefined

  const checkBalanceForSend = (
    balanceAmount: BalanceAmount<S>,
  ): true | ValidationError => {
    if (state.senderWalletCurrency !== balanceAmount.currency)
      return new InvalidCurrencyForWalletError()

    const { amount, fee } =
      balanceAmount.currency === WalletCurrency.Btc
        ? { amount: state.btcPaymentAmount, fee: state.btcProtocolAndBankFee }
        : { amount: state.usdPaymentAmount, fee: state.usdProtocolAndBankFee }
    const totalSendAmount = AmountCalculator().add(amount, fee)

    if (balanceAmount.amount < totalSendAmount.amount) {
      const unitForMsg =
        state.senderWalletCurrency === WalletCurrency.Btc ? "sats" : "cents"
      return new InsufficientBalanceError(
        `Payment amount '${totalSendAmount.amount}' ${unitForMsg} exceeds balance '${balanceAmount.amount}'`,
      )
    }

    return true
  }

  return {
    protocolAndBankFeeInSenderWalletCurrency,
    paymentAmounts,
    totalAmountsForPayment,
    routeDetails,
    recipientDetails,
    senderWalletDescriptor,
    recipientWalletDescriptor,
    checkBalanceForSend,
  }
}

export const PaymentFlow = <S extends WalletCurrency, R extends WalletCurrency>(
  state: PaymentFlowState<S, R>,
): PaymentFlow<S, R> | ValidationError => {
  const { paymentHash, intraLedgerHash, ...commonState } = state

  const paymentHashForFlow = (): PaymentHash | ValidationError => {
    if (!!paymentHash === !!intraLedgerHash) {
      return new InvalidLightningPaymentFlowBuilderStateError()
    }

    if (!paymentHash) {
      return new IntraLedgerHashPresentInLnFlowError()
    }

    return paymentHash
  }

  const intraLedgerHashForFlow = (): IntraLedgerHash | ValidationError => {
    if (!!paymentHash === !!intraLedgerHash) {
      return new InvalidLightningPaymentFlowBuilderStateError()
    }

    if (!intraLedgerHash) {
      return new LnHashPresentInIntraLedgerFlowError()
    }

    return intraLedgerHash
  }

  return {
    ...state,
    ...PaymentFlowCommon(commonState),
    paymentHashForFlow,
    intraLedgerHashForFlow,
  }
}

export const OnChainPaymentFlow = <S extends WalletCurrency, R extends WalletCurrency>(
  state: OnChainPaymentFlowState<S, R>,
): OnChainPaymentFlow<S, R> => {
  const { address, ...commonState } = state

  const addressForFlow = (): OnChainAddress | ValidationError => {
    if (address === undefined) {
      return new InvalidOnChainPaymentFlowBuilderStateError()
    }

    return address
  }

  const bankFees = (): PaymentAmountInAllCurrencies | ValidationError => {
    return { btc: state.btcBankFee, usd: state.usdBankFee }
  }

  return {
    ...state,
    ...PaymentFlowCommon(commonState),
    addressForFlow,
    bankFees,
  }
}
