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
}: AddInvoiceForSelfArgs): Promise<LnInvoice | ApplicationError> =>
  addInvoice({
    walletId,
    limitCheckFn: checkSelfWalletIdRateLimits,
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
}: AddInvoiceNoAmountForSelfArgs): Promise<LnInvoice | ApplicationError> =>
  addInvoice({
    walletId,
    limitCheckFn: checkSelfWalletIdRateLimits,
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
}: AddInvoiceForRecipientArgs): Promise<LnInvoice | ApplicationError> =>
  addInvoice({
    walletId: recipientWalletId,
    limitCheckFn: checkRecipientWalletIdRateLimits,
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
}: AddInvoiceNoAmountForRecipientArgs): Promise<LnInvoice | ApplicationError> =>
  addInvoice({
    walletId: recipientWalletId,
    limitCheckFn: checkRecipientWalletIdRateLimits,
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

  const invoice = await walletIBWithAmount.registerInvoice()
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
