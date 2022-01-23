import { getCurrentPrice } from "@app/prices"
import { checkedToSats, toSats } from "@domain/bitcoin"
import { invoiceExpirationForCurrency } from "@domain/bitcoin/lightning"
import { checkedToFiat, satsToFiatOptionPricing } from "@domain/fiat"
import { RateLimitConfig } from "@domain/rate-limit"
import { RateLimiterExceededError } from "@domain/rate-limit/errors"
import { WalletInvoiceFactory } from "@domain/wallet-invoices/wallet-invoice-factory"
import { checkedToWalletId, WalletCurrency } from "@domain/wallets"
import { LndService } from "@services/lnd"
import { WalletInvoicesRepository, WalletsRepository } from "@services/mongoose"
import { consumeLimiter } from "@services/rate-limit"

export const addInvoiceByWalletId = async ({
  walletId,
  amount,
  memo = "",
}: AddInvoiceByWalletIdArgs): Promise<LnInvoice | ApplicationError> => {
  const walletIdChecked = checkedToWalletId(walletId)
  if (walletIdChecked instanceof Error) return walletIdChecked

  const wallets = WalletsRepository()
  const wallet = await wallets.findById(walletIdChecked)
  if (wallet instanceof Error) return wallet

  const limitOk = await checkSelfWalletIdRateLimits(wallet.accountId)
  if (limitOk instanceof Error) return limitOk

  let addInvoice: (args: AddInvoiceArgs) => Promise<LnInvoice | ApplicationError>

  switch (wallet.currency) {
    case WalletCurrency.Btc:
      addInvoice = addInvoiceSatsDenomiation
      break
    case WalletCurrency.Usd:
      addInvoice = addInvoiceFiatDenomiation
      break
  }

  const walletInvoiceFactory = WalletInvoiceFactory({
    walletId: walletIdChecked,
    currency: wallet.currency,
  })

  return addInvoice({
    walletInvoiceCreateFn: walletInvoiceFactory.createForSelf,
    amount,
    memo,
  })
}

export const addInvoiceNoAmountByWalletId = async ({
  walletId,
  memo = "",
}: AddInvoiceNoAmountByWalletIdArgs): Promise<LnInvoice | ApplicationError> => {
  const walletIdChecked = checkedToWalletId(walletId)
  if (walletIdChecked instanceof Error) return walletIdChecked

  const wallets = WalletsRepository()
  const wallet = await wallets.findById(walletIdChecked)
  if (wallet instanceof Error) return wallet

  return addInvoiceNoAmount({
    wallet,
    memo,
    currency: wallet.currency,
  })
}

export const addInvoiceForRecipient = async ({
  recipientWalletId,
  amount,
  memo = "",
  descriptionHash,
}: AddInvoiceForRecipientArgs): Promise<LnInvoice | ApplicationError> => {
  const walletIdChecked = checkedToWalletId(recipientWalletId)
  if (walletIdChecked instanceof Error) return walletIdChecked

  const wallet = await WalletsRepository().findById(walletIdChecked)
  if (wallet instanceof Error) return wallet

  const limitOk = await checkRecipientWalletIdRateLimits(wallet.accountId)
  if (limitOk instanceof Error) return limitOk

  let addInvoice: (args: AddInvoiceArgs) => Promise<LnInvoice | ApplicationError>

  switch (wallet.currency) {
    case WalletCurrency.Btc:
      addInvoice = addInvoiceSatsDenomiation
      break
    case WalletCurrency.Usd:
      addInvoice = addInvoiceFiatDenomiation
      break
  }

  const walletInvoiceFactory = WalletInvoiceFactory({
    walletId: walletIdChecked,
    currency: wallet.currency,
  })

  return addInvoice({
    amount,
    memo,
    walletInvoiceCreateFn: walletInvoiceFactory.createForRecipient,
    descriptionHash,
  })
}

export const addInvoiceNoAmountForRecipient = async ({
  recipientWalletId,
  memo = "",
}: AddInvoiceNoAmountForRecipientArgs): Promise<LnInvoice | ApplicationError> => {
  const walletIdChecked = checkedToWalletId(recipientWalletId)
  if (walletIdChecked instanceof Error) return walletIdChecked

  const wallet = await WalletsRepository().findById(walletIdChecked)
  if (wallet instanceof Error) return wallet

  const limitOk = await checkRecipientWalletIdRateLimits(wallet.accountId)
  if (limitOk instanceof Error) return limitOk

  // when an invoice have a fiat deonimation but doesn't have an amount,
  // the exchange rate will be defined at settlement time, not at the invoice creation time
  // therefore this is safe to have an extended period of time for those invoices
  const expiresAt = invoiceExpirationForCurrency(WalletCurrency.Btc, new Date())

  const walletInvoiceFactory = WalletInvoiceFactory({
    walletId: walletIdChecked,
    currency: wallet.currency,
  })

  return registerAndPersistInvoice({
    sats: toSats(0),
    memo,
    walletInvoiceCreateFn: walletInvoiceFactory.createForRecipient,
    expiresAt,
    fiat: null,
  })
}

const addInvoiceSatsDenomiation = async ({
  walletInvoiceCreateFn,
  amount,
  memo = "",
  descriptionHash,
}: AddInvoiceArgs): Promise<LnInvoice | ApplicationError> => {
  const sats = checkedToSats(amount)
  if (sats instanceof Error) return sats

  const expiresAt = invoiceExpirationForCurrency(WalletCurrency.Btc, new Date())

  return registerAndPersistInvoice({
    sats,
    memo,
    walletInvoiceCreateFn,
    expiresAt,
    descriptionHash,
    fiat: null,
  })
}

const addInvoiceFiatDenomiation = async ({
  walletInvoiceCreateFn,
  amount,
  memo = "",
  descriptionHash,
}: AddInvoiceArgs): Promise<LnInvoice | ApplicationError> => {
  const fiat = checkedToFiat(amount)
  if (fiat instanceof Error) return fiat

  const expiresAt = invoiceExpirationForCurrency("USD", new Date())

  // TODO: ensure we don't get a stalled price // fail otherwise
  const price = await getCurrentPrice()
  if (price instanceof Error) return price

  const sats = satsToFiatOptionPricing({ fiat, price })

  return registerAndPersistInvoice({
    sats,
    memo,
    walletInvoiceCreateFn,
    expiresAt,
    descriptionHash,
    fiat,
  })
}

const addInvoiceNoAmount = async ({
  wallet,
  memo = "",
  currency,
}: AddInvoiceNoAmountArgs): Promise<LnInvoice | ApplicationError> => {
  const limitOk = await checkSelfWalletIdRateLimits(wallet.accountId)
  if (limitOk instanceof Error) return limitOk

  // when an invoice have a fiat deonimation but doesn't have an amount,
  // the exchange rate will be defined at settlement time, not at the invoice creation time
  // therefore this is safe to have an extended period of time for those invoices
  const expiresAt = invoiceExpirationForCurrency(WalletCurrency.Btc, new Date())

  const walletInvoiceFactory = WalletInvoiceFactory({ walletId: wallet.id, currency })
  return registerAndPersistInvoice({
    sats: toSats(0),
    memo,
    walletInvoiceCreateFn: walletInvoiceFactory.createForSelf,
    expiresAt,
    fiat: null,
  })
}

// TODO: remove export once core has been deleted.
export const registerAndPersistInvoice = async ({
  sats,
  memo,
  walletInvoiceCreateFn,
  expiresAt,
  descriptionHash,
  fiat,
}: {
  sats: Satoshis
  memo: string
  walletInvoiceCreateFn: WalletInvoiceFactoryCreateMethod
  expiresAt: InvoiceExpiration
  descriptionHash?: string
  fiat: FiatAmount | null
}): Promise<LnInvoice | ApplicationError> => {
  const walletInvoicesRepo = WalletInvoicesRepository()
  const lndService = LndService()
  if (lndService instanceof Error) return lndService

  const registeredInvoice = await lndService.registerInvoice({
    description: memo,
    descriptionHash,
    sats,
    expiresAt,
  })
  if (registeredInvoice instanceof Error) return registeredInvoice
  const { invoice } = registeredInvoice

  const walletInvoice = walletInvoiceCreateFn(registeredInvoice)(fiat)
  const persistedWalletInvoice = await walletInvoicesRepo.persistNew(walletInvoice)
  if (persistedWalletInvoice instanceof Error) return persistedWalletInvoice

  return invoice
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
