import { AccountValidator } from "@domain/accounts"
import { toSats } from "@domain/bitcoin"
import { checkedToWalletId } from "@domain/wallets"
import { RateLimitConfig } from "@domain/rate-limit"
import { checkedToMinutes } from "@domain/primitives"
import { RateLimiterExceededError } from "@domain/rate-limit/errors"
import { DEFAULT_EXPIRATIONS } from "@domain/bitcoin/lightning/invoice-expiration"
import { WalletInvoiceBuilder } from "@domain/wallet-invoices/wallet-invoice-builder"

import { LndService } from "@services/lnd"
import { consumeLimiter } from "@services/rate-limit"
import { DealerPriceService } from "@services/dealer-price"
import {
  AccountsRepository,
  WalletInvoicesRepository,
  WalletsRepository,
} from "@services/mongoose"

import { validateIsBtcWallet, validateIsUsdWallet } from "./validate"

const defaultBtcExpiration = DEFAULT_EXPIRATIONS["BTC"].delayMinutes
const defaultUsdExpiration = DEFAULT_EXPIRATIONS["USD"].delayMinutes

const addInvoiceForSelf = async ({
  walletId,
  amount,
  memo = "",
  expiresIn,
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
        .withExpiration(expiresIn)
        .withAmount(amount),
  })

export const addInvoiceForSelfForBtcWallet = async (
  args: AddInvoiceForSelfForBtcWalletArgs,
): Promise<LnInvoice | ApplicationError> => {
  const walletId = checkedToWalletId(args.walletId)
  if (walletId instanceof Error) return walletId

  const expiresIn = checkedToMinutes(args.expiresIn || defaultBtcExpiration)
  if (expiresIn instanceof Error) return expiresIn

  const validated = await validateIsBtcWallet(walletId)
  if (validated instanceof Error) return validated
  return addInvoiceForSelf({ ...args, walletId, expiresIn })
}

export const addInvoiceForSelfForUsdWallet = async (
  args: AddInvoiceForSelfForUsdWalletArgs,
): Promise<LnInvoice | ApplicationError> => {
  const walletId = checkedToWalletId(args.walletId)
  if (walletId instanceof Error) return walletId

  const expiresIn = checkedToMinutes(args.expiresIn || defaultUsdExpiration)
  if (expiresIn instanceof Error) return expiresIn

  const validated = await validateIsUsdWallet(walletId)
  if (validated instanceof Error) return validated
  return addInvoiceForSelf({ ...args, walletId, expiresIn })
}

export const addInvoiceNoAmountForSelf = async ({
  walletId,
  memo = "",
  expiresIn,
}: AddInvoiceNoAmountForSelfArgs): Promise<LnInvoice | ApplicationError> => {
  const walletIdChecked = checkedToWalletId(walletId)
  if (walletIdChecked instanceof Error) return walletIdChecked

  let defaultExpiresIn = defaultBtcExpiration
  const validated = await validateIsBtcWallet(walletIdChecked)
  if (validated instanceof Error) {
    defaultExpiresIn = defaultUsdExpiration
  }

  const expiresInChecked = checkedToMinutes(expiresIn || defaultExpiresIn)
  if (expiresInChecked instanceof Error) return expiresInChecked

  return addInvoice({
    walletId: walletIdChecked,
    limitCheckFn: checkSelfWalletIdRateLimits,
    buildWIBWithAmountFn: ({
      walletInvoiceBuilder,
      recipientWalletDescriptor,
    }: BuildWIBWithAmountFnArgs) =>
      walletInvoiceBuilder
        .withDescription({ description: memo })
        .generatedForSelf()
        .withRecipientWallet(recipientWalletDescriptor)
        .withExpiration(expiresInChecked)
        .withoutAmount(),
  })
}

const addInvoiceForRecipient = async ({
  recipientWalletId,
  amount,
  memo = "",
  descriptionHash,
  expiresIn,
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
        .withExpiration(expiresIn)
        .withAmount(amount),
  })

export const addInvoiceForRecipientForBtcWallet = async (
  args: AddInvoiceForRecipientForBtcWalletArgs,
): Promise<LnInvoice | ApplicationError> => {
  const recipientWalletId = checkedToWalletId(args.recipientWalletId)
  if (recipientWalletId instanceof Error) return recipientWalletId

  const expiresIn = checkedToMinutes(args.expiresIn || defaultBtcExpiration)
  if (expiresIn instanceof Error) return expiresIn

  const validated = await validateIsBtcWallet(recipientWalletId)
  if (validated instanceof Error) return validated
  return addInvoiceForRecipient({ ...args, recipientWalletId, expiresIn })
}

export const addInvoiceForRecipientForUsdWallet = async (
  args: AddInvoiceForRecipientForUsdWalletArgs,
): Promise<LnInvoice | ApplicationError> => {
  const recipientWalletId = checkedToWalletId(args.recipientWalletId)
  if (recipientWalletId instanceof Error) return recipientWalletId

  const expiresIn = checkedToMinutes(args.expiresIn || defaultUsdExpiration)
  if (expiresIn instanceof Error) return expiresIn

  const validated = await validateIsUsdWallet(recipientWalletId)
  if (validated instanceof Error) return validated
  return addInvoiceForRecipient({ ...args, recipientWalletId, expiresIn })
}

export const addInvoiceNoAmountForRecipient = async ({
  recipientWalletId,
  memo = "",
  expiresIn,
}: AddInvoiceNoAmountForRecipientArgs): Promise<LnInvoice | ApplicationError> => {
  const walletId = checkedToWalletId(recipientWalletId)
  if (walletId instanceof Error) return walletId

  let defaultExpiresIn = defaultBtcExpiration
  const validated = await validateIsBtcWallet(walletId)
  if (validated instanceof Error) {
    defaultExpiresIn = defaultUsdExpiration
  }

  const expiresInChecked = checkedToMinutes(expiresIn || defaultExpiresIn)
  if (expiresInChecked instanceof Error) return expiresInChecked

  return addInvoice({
    walletId,
    limitCheckFn: checkRecipientWalletIdRateLimits,
    buildWIBWithAmountFn: ({
      walletInvoiceBuilder,
      recipientWalletDescriptor,
    }: BuildWIBWithAmountFnArgs) =>
      walletInvoiceBuilder
        .withDescription({ description: memo })
        .generatedForRecipient()
        .withRecipientWallet(recipientWalletDescriptor)
        .withExpiration(expiresInChecked)
        .withoutAmount(),
  })
}

const addInvoice = async ({
  walletId,
  limitCheckFn,
  buildWIBWithAmountFn,
}: AddInvoiceArgs): Promise<LnInvoice | ApplicationError> => {
  const wallet = await WalletsRepository().findById(walletId)
  if (wallet instanceof Error) return wallet
  const account = await AccountsRepository().findById(wallet.accountId)
  if (account instanceof Error) return account

  const accountValidator = AccountValidator(account)
  if (accountValidator instanceof Error) return accountValidator

  const limitOk = await limitCheckFn(wallet.accountId)
  if (limitOk instanceof Error) return limitOk

  const lndService = LndService()
  if (lndService instanceof Error) return lndService

  const dealer = DealerPriceService()
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

const checkRecipientWalletIdRateLimits = async (
  accountId: AccountId,
): Promise<true | RateLimiterExceededError> =>
  consumeLimiter({
    rateLimitConfig: RateLimitConfig.invoiceCreateForRecipient,
    keyToConsume: accountId,
  })
