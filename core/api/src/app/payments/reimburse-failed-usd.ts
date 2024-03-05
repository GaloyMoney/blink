import { FAILED_USD_MEMO } from "@/domain/ledger/ln-payment-state"
import { CouldNotFindBtcWalletForAccountError } from "@/domain/errors"
import { ErrorLevel, WalletCurrency } from "@/domain/shared"

import { AccountsRepository, WalletsRepository } from "@/services/mongoose"
import * as LedgerFacade from "@/services/ledger/facade"
import { MissingExpectedDisplayAmountsForTransactionError } from "@/domain/ledger"
import { recordExceptionInCurrentSpan } from "@/services/tracing"

export const reimburseFailedUsdPayment = async <
  S extends WalletCurrency,
  R extends WalletCurrency,
>({
  walletId,
  paymentFlow,
  pendingPayment,
}: {
  walletId: WalletId
  paymentFlow: PaymentFlow<S, R>
  pendingPayment: LedgerTransaction<S>
}): Promise<true | ApplicationError> => {
  const {
    journalId,
    displayAmount,
    displayFee,
    displayCurrency: displayCurrencyRaw,
  } = pendingPayment
  if (
    displayAmount === undefined ||
    displayFee === undefined ||
    displayCurrencyRaw === undefined
  ) {
    recordExceptionInCurrentSpan({
      error: new MissingExpectedDisplayAmountsForTransactionError(
        `LedgerTransactionId: ${pendingPayment.id}`,
      ),
      level: ErrorLevel.Critical,
    })
  }

  let displayCurrency = displayCurrencyRaw
  if (displayCurrency === undefined) {
    const wallet = await WalletsRepository().findById(walletId)
    if (wallet instanceof Error) return wallet
    const account = await AccountsRepository().findById(wallet.accountId)
    if (account instanceof Error) return account
    displayCurrency = account.displayCurrency
  }

  const paymentHash = paymentFlow.paymentHashForFlow()
  if (paymentHash instanceof Error) return paymentHash

  const {
    metadata,
    creditAccountAdditionalMetadata,
    internalAccountsAdditionalMetadata,
  } = LedgerFacade.LnFailedPaymentReceiveLedgerMetadata({
    paymentAmounts: paymentFlow,
    paymentHash,
    journalId,
    feeDisplayCurrency: displayFee || (0 as DisplayCurrencyBaseAmount),
    amountDisplayCurrency: displayAmount || (0 as DisplayCurrencyBaseAmount),
    displayCurrency,
  })

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

  const result = await LedgerFacade.recordReceiveOffChain({
    description: FAILED_USD_MEMO,
    recipientWalletDescriptor: btcWalletDescriptor,
    amountToCreditReceiver: paymentFlow.totalAmountsForPayment(),
    metadata,
    txMetadata,
    additionalCreditMetadata: creditAccountAdditionalMetadata,
    additionalInternalMetadata: internalAccountsAdditionalMetadata,
  })
  if (result instanceof Error) return result

  return true
}
