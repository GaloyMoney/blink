import crypto from "crypto"

import { getDisplayCurrencyConfig } from "@config"

import { ZERO_CENTS, ZERO_SATS } from "@domain/shared"
import { DisplayCurrency } from "@domain/fiat"

import * as LedgerFacade from "@services/ledger/facade"

export const recordReceivePayment = async ({
  walletDescriptor,
  paymentAmount,
  bankFee,
}) => {
  const paymentHash = crypto.randomUUID() as PaymentHash

  const metadata = LedgerFacade.LnReceiveLedgerMetadata({
    paymentHash,
    fee: bankFee.btc,
    feeDisplayCurrency: Number(bankFee.usd.amount) as DisplayCurrencyBaseAmount,
    amountDisplayCurrency: Number(paymentAmount.usd.amount) as DisplayCurrencyBaseAmount,
    pubkey: crypto.randomUUID() as Pubkey,
  })

  await LedgerFacade.recordReceive({
    description: "receives bitcoin",
    amountToCreditReceiver: paymentAmount,
    recipientWalletDescriptor: walletDescriptor,
    bankFee,
    metadata,
    txMetadata: { hash: paymentHash },
  })
}

export const recordSendLnPayment = async ({
  walletDescriptor,
  paymentAmount,
  bankFee,
}) => {
  const metadata = LedgerFacade.LnSendLedgerMetadata({
    paymentHash: crypto.randomUUID() as PaymentHash,
    feeDisplayCurrency: Number(bankFee.usd.amount) as DisplayCurrencyBaseAmount,
    amountDisplayCurrency: Number(paymentAmount.usd.amount) as DisplayCurrencyBaseAmount,
    displayCurrency: getDisplayCurrencyConfig().code,
    pubkey: crypto.randomUUID() as Pubkey,
    feeKnownInAdvance: true,
    paymentFlow: {
      btcPaymentAmount: paymentAmount.btc,
      usdPaymentAmount: paymentAmount.usd,
      btcProtocolFee: bankFee.btc,
      usdProtocolFee: bankFee.usd,
    } as PaymentFlowState<WalletCurrency, WalletCurrency>,
  })

  await LedgerFacade.recordSend({
    description: "sends bitcoin",
    amountToDebitSender: paymentAmount,
    senderWalletDescriptor: walletDescriptor,
    bankFee,
    metadata,
  })
}

export const recordIntraLedgerPayment = async ({
  senderWalletDescriptor,
  recipientWalletDescriptor,
  paymentAmount,
}) => {
  const { metadata, debitAccountAdditionalMetadata } =
    LedgerFacade.LnIntraledgerLedgerMetadata({
      paymentHash: crypto.randomUUID() as PaymentHash,
      amountDisplayCurrency: Number(
        paymentAmount.usd.amount,
      ) as DisplayCurrencyBaseAmount,
      feeDisplayCurrency: 0 as DisplayCurrencyBaseAmount,
      displayCurrency: DisplayCurrency.Usd,
      pubkey: crypto.randomUUID() as Pubkey,
      paymentFlow: {
        btcPaymentAmount: paymentAmount.btc,
        usdPaymentAmount: paymentAmount.usd,
        btcProtocolFee: ZERO_SATS,
        usdProtocolFee: ZERO_CENTS,
      } as PaymentFlowState<WalletCurrency, WalletCurrency>,
    })

  await LedgerFacade.recordIntraledger({
    description: "sends bitcoin",
    amount: paymentAmount,
    senderWalletDescriptor,
    recipientWalletDescriptor,
    metadata,
    additionalDebitMetadata: debitAccountAdditionalMetadata,
  })
}
