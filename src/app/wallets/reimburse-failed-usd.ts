import { toSats } from "@domain/bitcoin"
import {
  CouldNotFindWalletForWalletCurrencyError,
  InvalidAccountForWalletIdError,
} from "@domain/errors"
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
  accountId,
}: {
  paymentFlow: PaymentFlow<S, R>
  journalId: LedgerJournalId
  accountId: AccountId
}): Promise<true | ApplicationError> => {
  const paymentHash = paymentFlow.paymentHashForFlow()
  if (paymentHash instanceof Error) return paymentHash

  const metadata: ReimbursementLedgerMetadata = {
    hash: paymentHash,
    type: LedgerTransactionType.LnFeeReimbursement,
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

  const { id: senderWalletId } = paymentFlow.senderWalletDescriptor()
  const recipientWallets = await WalletsRepository().listByAccountId(accountId)
  if (recipientWallets instanceof Error) return recipientWallets
  if (!recipientWallets.map((wallet) => wallet.id).includes(senderWalletId)) {
    return new InvalidAccountForWalletIdError(
      JSON.stringify({ accountId, walletId: senderWalletId }),
    )
  }
  const btcWallet = recipientWallets.find(
    (wallet) => wallet.currency === WalletCurrency.Btc,
  )
  if (btcWallet === undefined) return new CouldNotFindWalletForWalletCurrencyError()
  const btcWalletDescriptor = { id: btcWallet.id, currency: btcWallet.currency }

  const result = await LedgerFacade.recordReceive({
    description: "usd failed payment reimburse",
    recipientWalletDescriptor: btcWalletDescriptor,
    amountToCreditReceiver: paymentFlow.totalAmountsForPayment(),
    metadata,
    txMetadata,
  })
  if (result instanceof Error) return result

  return true
}
