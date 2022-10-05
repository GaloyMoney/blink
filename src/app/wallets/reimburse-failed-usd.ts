import { toSats } from "@domain/bitcoin"
import { CouldNotFindBtcWalletForAccountError } from "@domain/errors"
import { DisplayCurrency, toCents } from "@domain/fiat"
import { LedgerTransactionType } from "@domain/ledger"
import { AmountCalculator, WalletCurrency } from "@domain/shared"

import { WalletsRepository } from "@services/mongoose"
import * as LedgerFacade from "@services/ledger/facade"

const calc = AmountCalculator()

export const reimburseFailedUsdPayment = async <
  S extends WalletCurrency,
  R extends WalletCurrency,
>({
  paymentFlow,
  journalId,
}: {
  paymentFlow: PaymentFlow<S, R>
  journalId: LedgerJournalId
}): Promise<true | ApplicationError> => {
  const paymentHash = paymentFlow.paymentHashForFlow()
  if (paymentHash instanceof Error) return paymentHash

  const metadata: FailedPaymentLedgerMetadata = {
    hash: paymentHash,
    type: LedgerTransactionType.Payment,
    pending: false,
    related_journal: journalId,

    usd: Number(
      calc.divFloor(paymentFlow.usdPaymentAmount, 100n).amount,
    ) as DisplayCurrencyBaseAmount,

    satsAmount: toSats(paymentFlow.btcPaymentAmount.amount),
    centsAmount: toCents(paymentFlow.usdPaymentAmount.amount),
    satsFee: toSats(paymentFlow.btcProtocolFee.amount),
    centsFee: toCents(paymentFlow.usdProtocolFee.amount),

    displayAmount: Number(
      paymentFlow.usdPaymentAmount.amount,
    ) as DisplayCurrencyBaseAmount,
    displayFee: Number(paymentFlow.usdProtocolFee.amount) as DisplayCurrencyBaseAmount,
    displayCurrency: DisplayCurrency.Usd,
  }

  const txMetadata: LnLedgerTransactionMetadataUpdate = {
    hash: paymentHash,
  }

  const walletsRepo = WalletsRepository()
  const { id: recipientWalletId } = paymentFlow.senderWalletDescriptor()
  const recipientWallet = await walletsRepo.findById(recipientWalletId)
  if (recipientWallet instanceof Error) return recipientWallet

  let recipientBtcWallet =
    recipientWallet.currency === WalletCurrency.Btc ? recipientWallet : undefined
  if (recipientBtcWallet === undefined) {
    const recipientWallets = await walletsRepo.listByAccountId(recipientWallet.accountId)
    if (recipientWallets instanceof Error) return recipientWallets

    recipientBtcWallet = recipientWallets.find(
      (wallet) => wallet.currency === WalletCurrency.Btc,
    )
    if (recipientBtcWallet === undefined) {
      return new CouldNotFindBtcWalletForAccountError(
        JSON.stringify({ accountId: recipientWallet.accountId }),
      )
    }
  }
  const btcWalletDescriptor = {
    id: recipientBtcWallet.id,
    currency: recipientBtcWallet.currency,
    accountId: recipientBtcWallet.accountId,
  }

  const result = await LedgerFacade.recordReceive({
    description: "Usd payment canceled",
    recipientWalletDescriptor: btcWalletDescriptor,
    amountToCreditReceiver: paymentFlow.totalAmountsForPayment(),
    metadata,
    txMetadata,
  })
  if (result instanceof Error) return result

  return true
}
