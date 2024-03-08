import { InvoiceAlreadyProcessedError } from "@/domain/wallet-invoices/errors"
import { AccountValidator } from "@/domain/accounts"
import { checkedToWalletId } from "@/domain/wallets"

import {
  AccountsRepository,
  WalletInvoicesRepository,
  WalletsRepository,
} from "@/services/mongoose"
import { LndService } from "@/services/lnd"
import { LockService } from "@/services/lock"
import { WalletInvoiceStatusChecker } from "@/domain/wallet-invoices/wallet-invoice-status-checker"
import { WalletInvoiceStatus } from "@/domain/wallet-invoices"

export const cancelInvoiceForWallet = async ({
  walletId,
  paymentHash,
}: CancelInvoiceForWalletArgs): Promise<true | ApplicationError> => {
  const checkedWalletId = checkedToWalletId(walletId)
  if (checkedWalletId instanceof Error) return checkedWalletId

  const wallet = await WalletsRepository().findById(checkedWalletId)
  if (wallet instanceof Error) return wallet

  const account = await AccountsRepository().findById(wallet.accountId)
  if (account instanceof Error) return account

  // validates account is active
  const accountValidator = AccountValidator(account)
  if (accountValidator instanceof Error) return accountValidator

  return LockService().lockPaymentHash(paymentHash, async () => {
    const walletInvoices = WalletInvoicesRepository()
    const walletInvoice = await walletInvoices.findForWalletByPaymentHash({
      walletId,
      paymentHash,
    })
    if (walletInvoice instanceof Error) return walletInvoice
    const statusChecker = WalletInvoiceStatusChecker(walletInvoice)
    const status = statusChecker.status(new Date())
    if (walletInvoice.processingCompleted || status !== WalletInvoiceStatus.Pending) {
      return new InvoiceAlreadyProcessedError()
    }

    const { pubkey } = walletInvoice
    const lndService = LndService()
    if (lndService instanceof Error) return lndService

    const lnInvoiceLookup = await lndService.lookupInvoice({ pubkey, paymentHash })
    if (lnInvoiceLookup instanceof Error) return lnInvoiceLookup

    const { isSettled, isHeld } = lnInvoiceLookup
    if (isSettled || isHeld) {
      return new InvoiceAlreadyProcessedError()
    }

    const result = await lndService.cancelInvoice({ pubkey, paymentHash })
    if (result instanceof Error) return result

    const updatedInvoice = await walletInvoices.markAsProcessingCompleted(paymentHash)
    if (updatedInvoice instanceof Error) return result

    return true
  })
}
