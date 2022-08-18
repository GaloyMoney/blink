import { toSats } from "@domain/bitcoin"
import { RateLimitConfig } from "@domain/rate-limit"
import { RateLimiterExceededError } from "@domain/rate-limit/errors"
import { checkedToWalletId } from "@domain/wallets"
import { NewDealerPriceService } from "@services/dealer-price"
import { LndService } from "@services/lnd"
import { WalletInvoicesRepository, WalletsRepository } from "@services/mongoose"
import { consumeLimiter } from "@services/rate-limit"
import { WalletInvoiceBuilder } from "@domain/wallet-invoices/wallet-invoice-builder"

export const addInvoiceForSelf = async ({
  walletId,
  amount,
  memo = "",
  callback,
}: AddInvoiceForSelfArgs): Promise<LnInvoice | ApplicationError> =>
  addInvoice({
    walletId,
    limitCheckFn: checkSelfWalletIdRateLimits,
    callback,
    buildWIBWithAmountFn: ({
      walletInvoiceBuilder,
      recipientWalletDescriptor,
    }: BuildWIBWithAmountFnArgs) =>
      walletInvoiceBuilder
        .withDescription({ description: memo })
        .generatedForSelf()
        .withRecipientWallet(recipientWalletDescriptor)
        .withAmount(amount),
  })

export const addInvoiceNoAmountForSelf = async ({
  walletId,
  memo = "",
  callback,
}: AddInvoiceNoAmountForSelfArgs): Promise<LnInvoice | ApplicationError> =>
  addInvoice({
    walletId,
    limitCheckFn: checkSelfWalletIdRateLimits,
    callback,
    buildWIBWithAmountFn: ({
      walletInvoiceBuilder,
      recipientWalletDescriptor,
    }: BuildWIBWithAmountFnArgs) =>
      walletInvoiceBuilder
        .withDescription({ description: memo })
        .generatedForSelf()
        .withRecipientWallet(recipientWalletDescriptor)
        .withoutAmount(),
  })

export const addInvoiceForRecipient = async ({
  recipientWalletId,
  amount,
  memo = "",
  descriptionHash,
  callback,
}: AddInvoiceForRecipientArgs): Promise<LnInvoice | ApplicationError> =>
  addInvoice({
    walletId: recipientWalletId,
    limitCheckFn: checkRecipientWalletIdRateLimits,
    callback,
    buildWIBWithAmountFn: ({
      walletInvoiceBuilder,
      recipientWalletDescriptor,
    }: BuildWIBWithAmountFnArgs) =>
      walletInvoiceBuilder
        .withDescription({ description: memo, descriptionHash })
        .generatedForRecipient()
        .withRecipientWallet(recipientWalletDescriptor)
        .withAmount(amount),
  })

export const addInvoiceNoAmountForRecipient = async ({
  recipientWalletId,
  memo = "",
  callback,
}: AddInvoiceNoAmountForRecipientArgs): Promise<LnInvoice | ApplicationError> =>
  addInvoice({
    walletId: recipientWalletId,
    limitCheckFn: checkRecipientWalletIdRateLimits,
    callback,
    buildWIBWithAmountFn: ({
      walletInvoiceBuilder,
      recipientWalletDescriptor,
    }: BuildWIBWithAmountFnArgs) =>
      walletInvoiceBuilder
        .withDescription({ description: memo })
        .generatedForRecipient()
        .withRecipientWallet(recipientWalletDescriptor)
        .withoutAmount(),
  })

const addInvoice = async ({
  walletId,
  limitCheckFn,
  buildWIBWithAmountFn,
  callback,
}: AddInvoiceArgs): Promise<LnInvoice | ApplicationError> => {
  const walletIdChecked = checkedToWalletId(walletId)
  if (walletIdChecked instanceof Error) return walletIdChecked

  const wallet = await WalletsRepository().findById(walletIdChecked)
  if (wallet instanceof Error) return wallet
  const limitOk = await limitCheckFn(wallet.accountId)
  if (limitOk instanceof Error) return limitOk

  const lndService = LndService()
  if (lndService instanceof Error) return lndService

  const dealer = NewDealerPriceService()
  const walletInvoiceBuilder = WalletInvoiceBuilder({
    dealerBtcFromUsd: dealer.getSatsFromCentsForFutureBuy,
    lnRegisterInvoice: (args) =>
      lndService.registerInvoice({ ...args, sats: toSats(args.btcPaymentAmount.amount) }),
  })
  if (walletInvoiceBuilder instanceof Error) return walletInvoiceBuilder

  const walletIBWithAmount = await buildWIBWithAmountFn({
    walletInvoiceBuilder,
    recipientWalletDescriptor: wallet,
  })
  if (walletIBWithAmount instanceof Error) return walletIBWithAmount

  let walletIBWithCallback = walletIBWithAmount.withoutCallback()
  if (callback) {
    const wibCallback = walletIBWithAmount.withCallback(callback)
    if (wibCallback instanceof Error) return wibCallback
    walletIBWithCallback = wibCallback
  }

  const invoice = await walletIBWithCallback.registerInvoice()
  if (invoice instanceof Error) return invoice
  const { walletInvoice, lnInvoice } = invoice

  const persistedInvoice = await WalletInvoicesRepository().persistNew(walletInvoice)
  if (persistedInvoice instanceof Error) return persistedInvoice

  return lnInvoice
}

const checkSelfWalletIdRateLimits = async (
  accountId: AccountId,
): Promise<true | RateLimiterExceededError> =>
  consumeLimiter({
    rateLimitConfig: RateLimitConfig.invoiceCreate,
    keyToConsume: accountId,
  })

// TODO: remove export once core has been deleted.
export const checkRecipientWalletIdRateLimits = async (
  accountId: AccountId,
): Promise<true | RateLimiterExceededError> =>
  consumeLimiter({
    rateLimitConfig: RateLimitConfig.invoiceCreateForRecipient,
    keyToConsume: accountId,
  })
