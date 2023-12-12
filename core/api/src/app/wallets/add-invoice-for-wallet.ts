import { validateIsBtcWallet, validateIsUsdWallet } from "./validate"

import { AccountValidator } from "@/domain/accounts"
import { toSats } from "@/domain/bitcoin"
import { checkedToWalletId } from "@/domain/wallets"
import { RateLimitConfig } from "@/domain/rate-limit"
import { checkedToMinutes } from "@/domain/primitives"
import { RateLimiterExceededError } from "@/domain/rate-limit/errors"
import { DEFAULT_EXPIRATIONS } from "@/domain/bitcoin/lightning/invoice-expiration"
import { WalletInvoiceBuilder } from "@/domain/wallet-invoices/wallet-invoice-builder"
import { checkedToBtcPaymentAmount, checkedToUsdPaymentAmount } from "@/domain/shared"

import { LndService } from "@/services/lnd"
import { consumeLimiter } from "@/services/rate-limit"
import { DealerPriceService } from "@/services/dealer-price"
import {
  AccountsRepository,
  WalletInvoicesRepository,
  WalletsRepository,
} from "@/services/mongoose"

const defaultBtcExpiration = DEFAULT_EXPIRATIONS["BTC"].delayMinutes
const defaultUsdExpiration = DEFAULT_EXPIRATIONS["USD"].delayMinutes

const addInvoiceForSelf = async ({
  walletId,
  walletAmount,
  memo = "",
  expiresIn,
}: AddInvoiceForSelfArgs): Promise<WalletInvoice | ApplicationError> =>
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
        .withAmount(walletAmount),
  })

export const addInvoiceForSelfForBtcWallet = async (
  args: AddInvoiceForSelfForBtcWalletArgs,
): Promise<WalletInvoice | ApplicationError> => {
  const walletId = checkedToWalletId(args.walletId)
  if (walletId instanceof Error) return walletId

  const expiresIn = checkedToMinutes(args.expiresIn || defaultBtcExpiration)
  if (expiresIn instanceof Error) return expiresIn

  const validated = await validateIsBtcWallet(walletId)
  if (validated instanceof Error) return validated

  const walletAmount = checkedToBtcPaymentAmount(args.amount)
  if (walletAmount instanceof Error) return walletAmount

  return addInvoiceForSelf({ walletId, walletAmount, expiresIn, memo: args.memo })
}

export const addInvoiceForSelfForUsdWallet = async (
  args: AddInvoiceForSelfForUsdWalletArgs,
): Promise<WalletInvoice | ApplicationError> => {
  const walletId = checkedToWalletId(args.walletId)
  if (walletId instanceof Error) return walletId

  const expiresIn = checkedToMinutes(args.expiresIn || defaultUsdExpiration)
  if (expiresIn instanceof Error) return expiresIn

  const validated = await validateIsUsdWallet(walletId)
  if (validated instanceof Error) return validated

  const walletAmount = checkedToUsdPaymentAmount(args.amount)
  if (walletAmount instanceof Error) return walletAmount

  return addInvoiceForSelf({ walletId, walletAmount, expiresIn, memo: args.memo })
}

export const addInvoiceNoAmountForSelf = async ({
  walletId,
  memo = "",
  expiresIn,
}: AddInvoiceNoAmountForSelfArgs): Promise<WalletInvoice | ApplicationError> => {
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
  walletAmount,
  memo = "",
  expiresIn,
}: AddInvoiceForRecipientArgs): Promise<WalletInvoice | ApplicationError> =>
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
        .withExpiration(expiresIn)
        .withAmount(walletAmount),
  })

export const addInvoiceForRecipientForBtcWallet = async (
  args: AddInvoiceForRecipientForBtcWalletArgs,
): Promise<WalletInvoice | ApplicationError> => {
  const recipientWalletId = checkedToWalletId(args.recipientWalletId)
  if (recipientWalletId instanceof Error) return recipientWalletId

  const expiresIn = checkedToMinutes(args.expiresIn || defaultBtcExpiration)
  if (expiresIn instanceof Error) return expiresIn

  const validated = await validateIsBtcWallet(recipientWalletId)
  if (validated instanceof Error) return validated

  const walletAmount = checkedToBtcPaymentAmount(args.amount)
  if (walletAmount instanceof Error) return walletAmount

  return addInvoiceForRecipient({
    recipientWalletId,
    walletAmount,
    expiresIn,
    memo: args.memo,
  })
}

export const addInvoiceForRecipientForUsdWallet = async (
  args: AddInvoiceForRecipientForUsdWalletArgs,
): Promise<WalletInvoice | ApplicationError> => {
  const recipientWalletId = checkedToWalletId(args.recipientWalletId)
  if (recipientWalletId instanceof Error) return recipientWalletId

  const expiresIn = checkedToMinutes(args.expiresIn || defaultUsdExpiration)
  if (expiresIn instanceof Error) return expiresIn

  const validated = await validateIsUsdWallet(recipientWalletId)
  if (validated instanceof Error) return validated

  const walletAmount = checkedToUsdPaymentAmount(args.amount)
  if (walletAmount instanceof Error) return walletAmount

  return addInvoiceForRecipient({
    recipientWalletId,
    walletAmount,
    expiresIn,
    memo: args.memo,
  })
}

export const addInvoiceForRecipientForUsdWalletAndBtcAmount = async (
  args: AddInvoiceForRecipientForUsdWalletArgs,
): Promise<WalletInvoice | ApplicationError> => {
  const recipientWalletId = checkedToWalletId(args.recipientWalletId)
  if (recipientWalletId instanceof Error) return recipientWalletId

  const expiresIn = checkedToMinutes(args.expiresIn || defaultUsdExpiration)
  if (expiresIn instanceof Error) return expiresIn

  const validated = await validateIsUsdWallet(recipientWalletId)
  if (validated instanceof Error) return validated

  const walletAmount = checkedToBtcPaymentAmount(args.amount)
  if (walletAmount instanceof Error) return walletAmount

  return addInvoiceForRecipient({
    recipientWalletId,
    walletAmount,
    expiresIn,
    memo: args.memo,
  })
}

export const addInvoiceNoAmountForRecipient = async ({
  recipientWalletId,
  memo = "",
  expiresIn,
}: AddInvoiceNoAmountForRecipientArgs): Promise<WalletInvoice | ApplicationError> => {
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
}: AddInvoiceArgs): Promise<WalletInvoice | ApplicationError> => {
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
    dealerUsdFromBtc: dealer.getCentsFromSatsForFutureBuy,
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

  const persistedInvoice = await WalletInvoicesRepository().persistNew(invoice)
  if (persistedInvoice instanceof Error) return persistedInvoice

  return invoice
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
