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
}: AddInvoiceForSelfArgs): Promise<LnInvoice | ApplicationError> => {
  const limitCheckFn = checkSelfWalletIdRateLimits
  const buildWIBWithAmountFn = ({
    walletInvoiceBuilder,
    recipientWalletDescriptor,
  }: BuildWIBWithAmountFnArgs) => {
    return Promise.resolve(
      walletInvoiceBuilder
        .withDescription({ description: memo })
        .generatedForSelf()
        .withRecipientWallet(recipientWalletDescriptor)
        .withAmount(amount),
    )
  }

  const lnInvoice = await addInvoice({ walletId, limitCheckFn, buildWIBWithAmountFn })

  if (lnInvoice instanceof Error) return lnInvoice

  return lnInvoice
}

export const addInvoiceNoAmountForSelf = async ({
  walletId,
  memo = "",
}: AddInvoiceNoAmountForSelfArgs): Promise<LnInvoice | ApplicationError> => {
  const limitCheckFn = checkSelfWalletIdRateLimits
  const buildWIBWithAmountFn = ({
    walletInvoiceBuilder,
    recipientWalletDescriptor,
  }: BuildWIBWithAmountFnArgs) => {
    return Promise.resolve(
      walletInvoiceBuilder
        .withDescription({ description: memo })
        .generatedForSelf()
        .withRecipientWallet(recipientWalletDescriptor)
        .withoutAmount(),
    )
  }

  const lnInvoice = await addInvoice({ walletId, limitCheckFn, buildWIBWithAmountFn })

  if (lnInvoice instanceof Error) return lnInvoice

  return lnInvoice
}

export const addInvoiceForRecipient = async ({
  recipientWalletId,
  amount,
  memo = "",
  descriptionHash,
}: AddInvoiceForRecipientArgs): Promise<LnInvoice | ApplicationError> => {
  const limitCheckFn = checkRecipientWalletIdRateLimits
  const buildWIBWithAmountFn = ({
    walletInvoiceBuilder,
    recipientWalletDescriptor,
  }: BuildWIBWithAmountFnArgs) => {
    return walletInvoiceBuilder
      .withDescription({ description: memo, descriptionHash })
      .generatedForRecipient()
      .withRecipientWallet(recipientWalletDescriptor)
      .withAmount(amount)
  }

  const lnInvoice = await addInvoice({
    walletId: recipientWalletId,
    limitCheckFn,
    buildWIBWithAmountFn,
  })

  if (lnInvoice instanceof Error) return lnInvoice

  return lnInvoice
}

export const addInvoiceNoAmountForRecipient = async ({
  recipientWalletId,
  memo = "",
}: AddInvoiceNoAmountForRecipientArgs): Promise<LnInvoice | ApplicationError> => {
  const limitCheckFn = checkRecipientWalletIdRateLimits
  const buildWIBWithAmountFn = ({
    walletInvoiceBuilder,
    recipientWalletDescriptor,
  }: BuildWIBWithAmountFnArgs) => {
    return Promise.resolve(
      walletInvoiceBuilder
        .withDescription({ description: memo })
        .generatedForRecipient()
        .withRecipientWallet(recipientWalletDescriptor)
        .withoutAmount(),
    )
  }

  const lnInvoice = await addInvoice({
    walletId: recipientWalletId,
    limitCheckFn,
    buildWIBWithAmountFn,
  })

  if (lnInvoice instanceof Error) return lnInvoice

  return lnInvoice
}

const addInvoice = async ({
  walletId,
  limitCheckFn,
  buildWIBWithAmountFn,
}: AddInvoiceArgs): Promise<LnInvoice | ApplicationError> => {
  const walletIdChecked = checkedToWalletId(walletId)
  if (walletIdChecked instanceof Error) return walletIdChecked

  const wallets = WalletsRepository()
  const wallet = await wallets.findById(walletIdChecked)
  if (wallet instanceof Error) return wallet
  const limitOk = await limitCheckFn(wallet.accountId)
  if (limitOk instanceof Error) return limitOk

  const walletInvoiceBuilder = createWalletInvoiceBuilder()

  if (walletInvoiceBuilder instanceof Error) return walletInvoiceBuilder

  const walletInvoiceBuilderWithAmount = await buildWIBWithAmountFn({
    walletInvoiceBuilder,
    recipientWalletDescriptor: wallet,
  })

  if (walletInvoiceBuilderWithAmount instanceof Error)
    return walletInvoiceBuilderWithAmount

  const invoiceObjects = await walletInvoiceBuilderWithAmount.registerInvoice()

  if (invoiceObjects instanceof Error) return invoiceObjects

  const walletInvoicesRepo = WalletInvoicesRepository()

  const persistedInvoice = await walletInvoicesRepo.persistNew(
    invoiceObjects.walletInvoice,
  )

  if (persistedInvoice instanceof Error) return persistedInvoice

  return invoiceObjects.lnInvoice
}

const createWalletInvoiceBuilder = () => {
  const dealer = NewDealerPriceService()
  const lndService = LndService()
  if (lndService instanceof Error) return lndService

  return WalletInvoiceBuilder({
    dealerBtcFromUsd: dealer.getSatsFromCentsForFutureBuy,
    lnRegisterInvoice: lndService.registerInvoice,
  })
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
