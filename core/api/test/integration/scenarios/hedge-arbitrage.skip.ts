import { Accounts, Payments, Wallets } from "@/app"
import { getMidPriceRatio } from "@/app/prices"
import { getDealerConfig } from "@/config"

import { AccountLevel, AccountStatus } from "@/domain/accounts"
import { toSats } from "@/domain/bitcoin"
import { toCents } from "@/domain/fiat"
import { SubOneCentSatAmountForUsdSelfSendError } from "@/domain/payments"
import {
  AmountCalculator,
  paymentAmountFromNumber,
  WalletCurrency,
} from "@/domain/shared"
import { getFunderWalletId } from "@/services/ledger/caching"
import { baseLogger } from "@/services/logger"
import { AccountsRepository, WalletsRepository } from "@/services/mongoose"

import {
  bitcoindClient,
  bitcoindOutside,
  createMandatoryUsers,
  fundLnd,
  fundWallet,
  fundWalletIdFromOnchain,
  getBalanceHelper,
  lnd1,
  lndOutside1,
  loadBitcoindWallet,
  mineAndConfirm,
  openChannelTesting,
  randomPhone,
  randomUserId,
  resetLegacyIntegrationLnds,
} from "test/helpers"

class ZeroAmountForUsdRecipientError extends Error {}

jest.mock("@/config", () => {
  const config = jest.requireActual("@/config")
  return {
    ...config,
    getInvoiceCreateAttemptLimits: jest.fn().mockReturnValue({
      ...config.getInvoiceCreateAttemptLimits(),
      points: 1000,
    }),
  }
})

const calc = AmountCalculator()
const usdHedgeEnabled = getDealerConfig().usd.hedgingEnabled

const USD_STARTING_BALANCE = 100 as UsdCents

const ONE_CENT = { amount: 1n, currency: WalletCurrency.Usd } as UsdPaymentAmount
const ONE_SAT = { amount: 1n, currency: WalletCurrency.Btc } as BtcPaymentAmount

type AccountAndWallets = {
  newBtcWallet: Wallet
  newUsdWallet: Wallet
  newAccount: Account
}

beforeAll(async () => {
  await createMandatoryUsers()
  await loadBitcoindWallet("outside")
  await resetLegacyIntegrationLnds()
  await bootstrapLndNodes()
})

afterAll(async () => {
  await bitcoindClient.unloadWallet({ walletName: "outside" })
})

const bootstrapLndNodes = async () => {
  // Fund outside wallet to fund lnd nodes
  const numOfBlocks = 10
  const bitcoindAddress = await bitcoindOutside.getNewAddress()
  await mineAndConfirm({
    walletClient: bitcoindOutside,
    numOfBlocks,
    address: bitcoindAddress,
  })

  // Fund lndOutside1 node, open lndOutside1 -> lnd1 channel
  const amountInBitcoin = 1
  await fundLnd(lndOutside1, amountInBitcoin)

  const lnd1Socket = `lnd1:9735`
  await openChannelTesting({
    lnd: lndOutside1,
    lndPartner: lnd1,
    socket: lnd1Socket,
  })

  // Fund lnd1 node, open lnd1 -> lndOutside1 channel
  const funderWalletId = await getFunderWalletId()
  await fundWalletIdFromOnchain({
    walletId: funderWalletId,
    amountInBitcoin,
    lnd: lnd1,
  })

  const lndOutside1socket = `lnd-outside-1:9735`
  await openChannelTesting({
    lnd: lnd1,
    lndPartner: lndOutside1,
    socket: lndOutside1socket,
  })
}

const btcAmountFromUsdNumber = async (
  centsAmount: number | bigint,
): Promise<BtcPaymentAmount> => {
  const usdPaymentAmount = paymentAmountFromNumber({
    amount: Number(centsAmount),
    currency: WalletCurrency.Usd,
  })
  if (usdPaymentAmount instanceof Error) throw usdPaymentAmount

  const midPriceRatio = await getMidPriceRatio(usdHedgeEnabled)
  if (midPriceRatio instanceof Error) throw midPriceRatio
  return midPriceRatio.convertFromUsd(usdPaymentAmount)
}

const usdFundingAmount = paymentAmountFromNumber({
  amount: USD_STARTING_BALANCE,
  currency: WalletCurrency.Usd,
})
if (usdFundingAmount instanceof Error) throw usdFundingAmount

const newAccountAndWallets = async () => {
  const initialWallets = [WalletCurrency.Btc, WalletCurrency.Usd]
  const account = await Accounts.createAccountWithPhoneIdentifier({
    newAccountInfo: { phone: randomPhone(), kratosUserId: randomUserId() },
    config: {
      initialStatus: AccountStatus.Active,
      initialWallets,
      initialLevel: AccountLevel.One,
    },
    referralCode: undefined,
    referralAppId: undefined,
  })
  if (account instanceof Error) throw account

  const accountId = account.id
  const accountWallets =
    await WalletsRepository().findAccountWalletsByAccountId(accountId)
  if (accountWallets instanceof Error) throw accountWallets

  const newBtcWallet = await fundWallet({
    walletId: accountWallets[WalletCurrency.Btc].id,
    balanceAmount: await btcAmountFromUsdNumber(usdFundingAmount.amount),
  })

  const newUsdWallet = await fundWallet({
    walletId: accountWallets[WalletCurrency.Usd].id,
    balanceAmount: usdFundingAmount,
  })

  const newAccount = await AccountsRepository().findById(newBtcWallet.accountId)
  if (newAccount instanceof Error) throw newAccount

  return { newBtcWallet, newUsdWallet, newAccount }
}

const getBtcEquivalentForIntraledgerSendToUsd = async ({
  btcPaymentAmount,
  accountAndWallets,
}: {
  btcPaymentAmount: BtcPaymentAmount
  accountAndWallets: AccountAndWallets
}): Promise<CurrencyBaseAmount | ZeroAmountForUsdRecipientError> => {
  const { newBtcWallet, newUsdWallet, newAccount } = accountAndWallets
  const sendArgs = {
    recipientWalletId: newUsdWallet.id,
    memo: null,
    senderWalletId: newBtcWallet.id,
    senderAccount: newAccount,
  }

  const beforeBtc = await getBalanceHelper(newBtcWallet.id)
  const beforeRecipientUsd = await getBalanceHelper(newUsdWallet.id)

  const result = await Payments.intraledgerPaymentSendWalletIdForBtcWallet({
    amount: Number(btcPaymentAmount.amount),
    ...sendArgs,
  })
  if (result instanceof SubOneCentSatAmountForUsdSelfSendError) {
    return new ZeroAmountForUsdRecipientError()
  }
  if (result instanceof Error) throw result

  const afterRecipientUsd = await getBalanceHelper(newUsdWallet.id)
  if (beforeRecipientUsd === afterRecipientUsd) {
    return new ZeroAmountForUsdRecipientError()
  }

  const afterBtc = await getBalanceHelper(newBtcWallet.id)
  return (beforeBtc - afterBtc) as CurrencyBaseAmount
}

const getUsdEquivalentForWithAmountInvoiceSendToBtc = async ({
  btcPaymentAmount,
  accountAndWallets,
}: {
  btcPaymentAmount: BtcPaymentAmount
  accountAndWallets: AccountAndWallets
}): Promise<CurrencyBaseAmount> => {
  const { newBtcWallet, newUsdWallet, newAccount } = accountAndWallets
  const invoice = await Wallets.addInvoiceForSelfForBtcWallet({
    walletId: newBtcWallet.id,
    amount: toSats(btcPaymentAmount.amount),
  })
  if (invoice instanceof Error) throw invoice

  const beforeUsd = await getBalanceHelper(newUsdWallet.id)
  const result = await Payments.payInvoiceByWalletId({
    uncheckedPaymentRequest: invoice.lnInvoice.paymentRequest,
    memo: null,
    senderWalletId: newUsdWallet.id,
    senderAccount: newAccount,
  })
  if (result instanceof Error) throw result
  const afterUsd = await getBalanceHelper(newUsdWallet.id)
  return (beforeUsd - afterUsd) as CurrencyBaseAmount
}

const getUsdEquivalentForWithAmountInvoiceProbeAndSendToBtc = async ({
  btcPaymentAmount,
  accountAndWallets,
}: {
  btcPaymentAmount: BtcPaymentAmount
  accountAndWallets: AccountAndWallets
}): Promise<CurrencyBaseAmount> => {
  const { newBtcWallet, newUsdWallet, newAccount } = accountAndWallets

  const invoice = await Wallets.addInvoiceForSelfForBtcWallet({
    walletId: newBtcWallet.id,
    amount: toSats(btcPaymentAmount.amount),
  })
  if (invoice instanceof Error) throw invoice

  const beforeUsd = await getBalanceHelper(newUsdWallet.id)
  const probeResult = await Payments.getLightningFeeEstimationForUsdWallet({
    uncheckedPaymentRequest: invoice.lnInvoice.paymentRequest,
    walletId: newUsdWallet.id,
  })
  if (probeResult instanceof Error) throw probeResult
  const payResult = await Payments.payInvoiceByWalletId({
    uncheckedPaymentRequest: invoice.lnInvoice.paymentRequest,
    memo: null,
    senderWalletId: newUsdWallet.id,
    senderAccount: newAccount,
  })
  if (payResult instanceof Error) throw payResult
  const afterUsd = await getBalanceHelper(newUsdWallet.id)
  return (beforeUsd - afterUsd) as CurrencyBaseAmount
}

const getBtcEquivalentForNoAmountInvoiceSendToUsd = async ({
  btcPaymentAmount,
  accountAndWallets,
}: {
  btcPaymentAmount: BtcPaymentAmount
  accountAndWallets: AccountAndWallets
}): Promise<CurrencyBaseAmount | ZeroAmountForUsdRecipientError> => {
  const { newBtcWallet, newUsdWallet, newAccount } = accountAndWallets

  const beforeRecipientUsd = await getBalanceHelper(newUsdWallet.id)
  const invoice = await Wallets.addInvoiceNoAmountForSelf({
    walletId: newUsdWallet.id,
  })
  if (invoice instanceof Error) throw invoice

  const beforeBtc = await getBalanceHelper(newBtcWallet.id)
  const result = await Payments.payNoAmountInvoiceByWalletIdForBtcWallet({
    amount: Number(btcPaymentAmount.amount),
    uncheckedPaymentRequest: invoice.lnInvoice.paymentRequest,
    memo: null,
    senderWalletId: newBtcWallet.id,
    senderAccount: newAccount,
  })
  if (result instanceof SubOneCentSatAmountForUsdSelfSendError) {
    return new ZeroAmountForUsdRecipientError()
  }
  if (result instanceof Error) throw result

  const afterRecipientUsd = await getBalanceHelper(newUsdWallet.id)
  if (beforeRecipientUsd === afterRecipientUsd) {
    return new ZeroAmountForUsdRecipientError()
  }

  const afterBtc = await getBalanceHelper(newBtcWallet.id)
  return (beforeBtc - afterBtc) as CurrencyBaseAmount
}

const getBtcEquivalentForNoAmountInvoiceProbeAndSendToUsd = async ({
  btcPaymentAmount,
  accountAndWallets,
}: {
  btcPaymentAmount: BtcPaymentAmount
  accountAndWallets: AccountAndWallets
}): Promise<CurrencyBaseAmount | ZeroAmountForUsdRecipientError> => {
  const { newBtcWallet, newUsdWallet, newAccount } = accountAndWallets

  const beforeRecipientUsd = await getBalanceHelper(newUsdWallet.id)
  const invoice = await Wallets.addInvoiceNoAmountForSelf({
    walletId: newUsdWallet.id,
  })
  if (invoice instanceof Error) throw invoice

  const beforeBtc = await getBalanceHelper(newBtcWallet.id)

  const probe = await Payments.getNoAmountLightningFeeEstimationForBtcWallet({
    amount: Number(btcPaymentAmount.amount),
    uncheckedPaymentRequest: invoice.lnInvoice.paymentRequest,
    walletId: newBtcWallet.id,
  })
  if (probe instanceof SubOneCentSatAmountForUsdSelfSendError) {
    return new ZeroAmountForUsdRecipientError()
  }
  if (probe instanceof Error) throw probe

  const result = await Payments.payNoAmountInvoiceByWalletIdForBtcWallet({
    amount: Number(btcPaymentAmount.amount),
    uncheckedPaymentRequest: invoice.lnInvoice.paymentRequest,
    memo: null,
    senderWalletId: newBtcWallet.id,
    senderAccount: newAccount,
  })
  if (result instanceof SubOneCentSatAmountForUsdSelfSendError) {
    return new ZeroAmountForUsdRecipientError()
  }
  if (result instanceof Error) throw result

  const afterRecipientUsd = await getBalanceHelper(newUsdWallet.id)
  if (beforeRecipientUsd === afterRecipientUsd) {
    return new ZeroAmountForUsdRecipientError()
  }

  const afterBtc = await getBalanceHelper(newBtcWallet.id)
  return (beforeBtc - afterBtc) as CurrencyBaseAmount
}

const getMaxBtcAmountToEarn = async ({
  startingBtcAmount,
  accountAndWallets,
  sentAmountFn,
}: {
  startingBtcAmount: BtcPaymentAmount
  accountAndWallets: AccountAndWallets
  // @ts-ignore-next-line no-implicit-any error
  sentAmountFn
}): Promise<BtcPaymentAmount> => {
  // 3 steps here to:
  // - check sentAmount is greater than 1 to start (push up if not)
  // - bring the sentAmount down, in case starting sentAmount is already past max
  // - push up to find max, from place where we are sure sentAmount is 1

  let maxBtcAmountToEarn = startingBtcAmount

  // Ensure sentAmount is '> 1' for starting amount
  let sentAmount = await sentAmountFn({
    btcPaymentAmount: maxBtcAmountToEarn,
    accountAndWallets,
  })
  while (sentAmount <= 1) {
    maxBtcAmountToEarn = calc.add(maxBtcAmountToEarn, ONE_SAT)
    sentAmount = await sentAmountFn({
      btcPaymentAmount: maxBtcAmountToEarn,
      accountAndWallets,
    })
  }
  // Decrement until sentAmount is 1
  while (sentAmount > 1) {
    maxBtcAmountToEarn = calc.sub(maxBtcAmountToEarn, ONE_SAT)
    sentAmount = await sentAmountFn({
      btcPaymentAmount: maxBtcAmountToEarn,
      accountAndWallets,
    })
  }
  expect(sentAmount).toEqual(1)
  // Increment to discover max BTC amount to buy for $0.01
  while (sentAmount === 1) {
    maxBtcAmountToEarn = calc.add(maxBtcAmountToEarn, ONE_SAT)
    sentAmount = await sentAmountFn({
      btcPaymentAmount: maxBtcAmountToEarn,
      accountAndWallets,
    })
  }
  maxBtcAmountToEarn = calc.sub(maxBtcAmountToEarn, ONE_SAT)

  return maxBtcAmountToEarn
}

const getMinBtcAmountToSpend = async ({
  startingBtcAmount,
  accountAndWallets,
  sentAmountFn,
}: {
  startingBtcAmount: BtcPaymentAmount
  accountAndWallets: AccountAndWallets
  /* eslint @typescript-eslint/ban-ts-comment: "off" */
  // @ts-ignore-next-line no-implicit-any error
  sentAmountFn
}): Promise<BtcPaymentAmount> => {
  let minBtcAmountToSpend = startingBtcAmount
  let sentAmount = await sentAmountFn({
    btcPaymentAmount: minBtcAmountToSpend,
    accountAndWallets,
  })
  // Ensure sentAmount is 'Success' for starting amount
  while (sentAmount instanceof ZeroAmountForUsdRecipientError) {
    minBtcAmountToSpend = calc.add(minBtcAmountToSpend, ONE_SAT)
    sentAmount = await sentAmountFn({
      btcPaymentAmount: minBtcAmountToSpend,
      accountAndWallets,
    })
    if (
      sentAmount instanceof Error &&
      !(sentAmount instanceof ZeroAmountForUsdRecipientError)
    ) {
      throw sentAmount
    }
  }
  // Decrement until sentAmount fails
  while (
    !(sentAmount instanceof ZeroAmountForUsdRecipientError) &&
    minBtcAmountToSpend.amount > 1n
  ) {
    minBtcAmountToSpend = calc.sub(minBtcAmountToSpend, ONE_SAT)
    sentAmount = await sentAmountFn({
      btcPaymentAmount: minBtcAmountToSpend,
      accountAndWallets,
    })
    if (
      sentAmount instanceof Error &&
      !(sentAmount instanceof ZeroAmountForUsdRecipientError)
    ) {
      throw sentAmount
    }
  }
  // Increment to discover min BTC amount to sell for $0.01
  while (sentAmount instanceof ZeroAmountForUsdRecipientError) {
    minBtcAmountToSpend = calc.add(minBtcAmountToSpend, ONE_SAT)
    sentAmount = await sentAmountFn({
      btcPaymentAmount: minBtcAmountToSpend,
      accountAndWallets,
    })
    if (
      sentAmount instanceof Error &&
      !(sentAmount instanceof ZeroAmountForUsdRecipientError)
    ) {
      throw sentAmount
    }
  }

  return minBtcAmountToSpend
}

describe("arbitrage strategies", () => {
  describe("can pay high sats invoice with $0.01", () => {
    // This strategy is to see if we can generate an invoice for an amount of
    // BTC that when paid from our USD wallet:
    // - rounds to $0.01
    // - is more than the amount of sats to send to USD wallet to get $0.01
    //
    // In the original discovery, the opportunity was possible because we could pay
    // an invoice up to 78 sats for $0.01 from a USD wallet and then convert back
    // to $0.01 for 53 sats.

    describe("pay max btc-amount invoice pull from usd wallet", () => {
      describe("replenish with $0.01 pull back to usd wallet", () => {
        it("via usd-denominated invoice", async () => {
          const accountAndWallets = await newAccountAndWallets()
          const { newBtcWallet, newUsdWallet, newAccount } = accountAndWallets

          // DISCOVER ARBITRAGE AMOUNTS FOR STRATEGY
          // =====
          const midPriceRatio = await getMidPriceRatio(usdHedgeEnabled)
          if (midPriceRatio instanceof Error) throw midPriceRatio
          const startingBtcAmount = midPriceRatio.convertFromUsd(ONE_CENT)

          // Validate btc starting amount for max btc discovery
          const maxBtcAmountToEarn = await getMaxBtcAmountToEarn({
            startingBtcAmount,
            accountAndWallets,
            sentAmountFn: getUsdEquivalentForWithAmountInvoiceSendToBtc,
          })
          baseLogger.info("Discovered:", { maxBtcAmountToEarn })

          // EXECUTE ARBITRAGE
          // =====
          const btcBalanceBefore = await getBalanceHelper(newBtcWallet.id)
          const usdBalanceBefore = await getBalanceHelper(newUsdWallet.id)

          // Step 1: Create invoice from BTC Wallet using discovered 'maxBtcAmountToEarn' from $0.01
          const invoice = await Wallets.addInvoiceForSelfForBtcWallet({
            walletId: newBtcWallet.id,
            amount: toSats(maxBtcAmountToEarn.amount),
          })
          if (invoice instanceof Error) throw invoice

          // Step 2: Pay invoice from USD wallet at favourable rate
          const result = await Payments.payInvoiceByWalletId({
            uncheckedPaymentRequest: invoice.lnInvoice.paymentRequest,
            memo: null,
            senderWalletId: newUsdWallet.id,
            senderAccount: newAccount,
          })
          if (result instanceof Error) throw result

          // Step 3: Replenish USD from BTC wallet with $0.01 invoice
          const invoiceUsd = await Wallets.addInvoiceForSelfForUsdWallet({
            walletId: newUsdWallet.id,
            amount: toCents(1),
          })
          if (invoiceUsd instanceof Error) throw invoiceUsd

          const resultUsd = await Payments.payInvoiceByWalletId({
            uncheckedPaymentRequest: invoiceUsd.lnInvoice.paymentRequest,
            memo: null,
            senderWalletId: newBtcWallet.id,
            senderAccount: newAccount,
          })
          if (resultUsd instanceof Error) throw resultUsd

          // Step 4: Check that no profit was made in the process
          const btcBalanceAfter = await getBalanceHelper(newBtcWallet.id)
          const sentAmountBtc = btcBalanceAfter - btcBalanceBefore
          expect(sentAmountBtc).toBeLessThanOrEqual(0)

          const usdBalanceAfter = await getBalanceHelper(newUsdWallet.id)
          const sentAmountUsd = usdBalanceAfter - usdBalanceBefore
          expect(sentAmountUsd).toBeLessThanOrEqual(0)
        })

        it("via usd-denominated fee probe", async () => {
          const accountAndWallets = await newAccountAndWallets()
          const { newBtcWallet, newUsdWallet, newAccount } = accountAndWallets

          // DISCOVER ARBITRAGE AMOUNTS FOR STRATEGY
          // =====
          const midPriceRatio = await getMidPriceRatio(usdHedgeEnabled)
          if (midPriceRatio instanceof Error) throw midPriceRatio
          const startingBtcAmount = midPriceRatio.convertFromUsd(ONE_CENT)

          // Validate btc starting amount for max btc discovery
          const maxBtcAmountToEarn = await getMaxBtcAmountToEarn({
            startingBtcAmount,
            accountAndWallets,
            sentAmountFn: getUsdEquivalentForWithAmountInvoiceSendToBtc,
          })
          baseLogger.info("Discovered:", { maxBtcAmountToEarn })

          // EXECUTE ARBITRAGE
          // =====
          const btcBalanceBefore = await getBalanceHelper(newBtcWallet.id)
          const usdBalanceBefore = await getBalanceHelper(newUsdWallet.id)

          // Step 1: Create invoice from BTC Wallet using discovered 'maxBtcAmountToEarn' from $0.01
          const invoice = await Wallets.addInvoiceForSelfForBtcWallet({
            walletId: newBtcWallet.id,
            amount: toSats(maxBtcAmountToEarn.amount),
          })
          if (invoice instanceof Error) throw invoice

          // Step 2: Pay invoice from USD wallet at favourable rate
          const result = await Payments.payInvoiceByWalletId({
            uncheckedPaymentRequest: invoice.lnInvoice.paymentRequest,
            memo: null,
            senderWalletId: newUsdWallet.id,
            senderAccount: newAccount,
          })
          if (result instanceof Error) throw result

          // Step 3: Replenish USD from BTC wallet with $0.01 invoice
          const invoiceUsd = await Wallets.addInvoiceForSelfForUsdWallet({
            walletId: newUsdWallet.id,
            amount: toCents(1),
          })
          if (invoiceUsd instanceof Error) throw invoiceUsd

          const probe = await Payments.getLightningFeeEstimationForBtcWallet({
            uncheckedPaymentRequest: invoiceUsd.lnInvoice.paymentRequest,
            walletId: newBtcWallet.id,
          })
          if (probe instanceof Error) throw probe

          const resultUsd = await Payments.payInvoiceByWalletId({
            uncheckedPaymentRequest: invoiceUsd.lnInvoice.paymentRequest,
            memo: null,
            senderWalletId: newBtcWallet.id,
            senderAccount: newAccount,
          })
          if (resultUsd instanceof Error) throw resultUsd

          // Step 4: Check that no profit was made in the process
          const btcBalanceAfter = await getBalanceHelper(newBtcWallet.id)
          const sentAmountBtc = btcBalanceAfter - btcBalanceBefore
          expect(sentAmountBtc).toBeLessThanOrEqual(0)

          const usdBalanceAfter = await getBalanceHelper(newUsdWallet.id)
          const sentAmountUsd = usdBalanceAfter - usdBalanceBefore
          expect(sentAmountUsd).toBeLessThanOrEqual(0)
        })
      })

      describe("replenish with min-btc-for-1-cent push from btc wallet", () => {
        it("via intraledger payment", async () => {
          const accountAndWallets = await newAccountAndWallets()
          const { newBtcWallet, newUsdWallet, newAccount } = accountAndWallets

          // DISCOVER ARBITRAGE AMOUNTS FOR STRATEGY
          // =====
          const midPriceRatio = await getMidPriceRatio(usdHedgeEnabled)
          if (midPriceRatio instanceof Error) throw midPriceRatio
          const startingBtcAmount = midPriceRatio.convertFromUsd(ONE_CENT)

          // Validate btc starting amount for max btc discovery
          const maxBtcAmountToEarn = await getMaxBtcAmountToEarn({
            startingBtcAmount,
            accountAndWallets,
            sentAmountFn: getUsdEquivalentForWithAmountInvoiceSendToBtc,
          })
          baseLogger.info("Discovered:", { maxBtcAmountToEarn })

          // Validate btc starting amount for min btc discovery
          const minBtcAmountToSpend = await getMinBtcAmountToSpend({
            startingBtcAmount,
            accountAndWallets,
            sentAmountFn: getBtcEquivalentForIntraledgerSendToUsd,
          })

          baseLogger.info("Discovered:", { minBtcAmountToSpend })

          // EXECUTE ARBITRAGE
          // =====
          const btcBalanceBefore = await getBalanceHelper(newBtcWallet.id)
          const usdBalanceBefore = await getBalanceHelper(newUsdWallet.id)

          // Step 1: Create invoice from BTC Wallet using discovered 'maxBtcAmountToEarn' from $0.01
          const invoice = await Wallets.addInvoiceForSelfForBtcWallet({
            walletId: newBtcWallet.id,
            amount: toSats(maxBtcAmountToEarn.amount),
          })
          if (invoice instanceof Error) throw invoice

          // Step 2: Pay invoice from USD wallet at favourable rate
          const result = await Payments.payInvoiceByWalletId({
            uncheckedPaymentRequest: invoice.lnInvoice.paymentRequest,
            memo: null,
            senderWalletId: newUsdWallet.id,
            senderAccount: newAccount,
          })
          if (result instanceof Error) throw result

          // Step 3: Replenish USD from BTC wallet with discovered 'minBtcAmountToSpend' for $0.01
          const paid = await Payments.intraledgerPaymentSendWalletIdForBtcWallet({
            recipientWalletId: newUsdWallet.id,
            memo: null,
            amount: toSats(minBtcAmountToSpend.amount),
            senderWalletId: newBtcWallet.id,
            senderAccount: newAccount,
          })
          if (
            paid instanceof Error &&
            !(paid instanceof ZeroAmountForUsdRecipientError)
          ) {
            throw paid
          }

          // Step 4: Check that no profit was made in the process
          const btcBalanceAfter = await getBalanceHelper(newBtcWallet.id)
          const sentAmountBtc = btcBalanceAfter - btcBalanceBefore
          expect(sentAmountBtc).toBeLessThanOrEqual(0)

          const usdBalanceAfter = await getBalanceHelper(newUsdWallet.id)
          const sentAmountUsd = usdBalanceAfter - usdBalanceBefore
          expect(sentAmountUsd).toBeLessThanOrEqual(0)
        })

        it("via no-amount invoice", async () => {
          const accountAndWallets = await newAccountAndWallets()
          const { newBtcWallet, newUsdWallet, newAccount } = accountAndWallets

          // DISCOVER ARBITRAGE AMOUNTS FOR STRATEGY
          // =====
          const midPriceRatio = await getMidPriceRatio(usdHedgeEnabled)
          if (midPriceRatio instanceof Error) throw midPriceRatio
          const startingBtcAmount = midPriceRatio.convertFromUsd(ONE_CENT)

          // Validate btc starting amount for max btc discovery
          const maxBtcAmountToEarn = await getMaxBtcAmountToEarn({
            startingBtcAmount,
            accountAndWallets,
            sentAmountFn: getUsdEquivalentForWithAmountInvoiceSendToBtc,
          })
          baseLogger.info("Discovered:", { maxBtcAmountToEarn })

          // Validate btc starting amount for min btc discovery
          const minBtcAmountToSpend = await getMinBtcAmountToSpend({
            startingBtcAmount,
            accountAndWallets,
            sentAmountFn: getBtcEquivalentForNoAmountInvoiceSendToUsd,
          })
          baseLogger.info("Discovered:", { minBtcAmountToSpend })

          // EXECUTE ARBITRAGE
          // =====
          const btcBalanceBefore = await getBalanceHelper(newBtcWallet.id)
          const usdBalanceBefore = await getBalanceHelper(newUsdWallet.id)

          // Step 1: Create invoice from BTC Wallet using discovered 'maxBtcAmountToEarn' from $0.01
          const invoice = await Wallets.addInvoiceForSelfForBtcWallet({
            walletId: newBtcWallet.id,
            amount: toSats(maxBtcAmountToEarn.amount),
          })
          if (invoice instanceof Error) throw invoice

          // Step 2: Pay invoice from USD wallet at favourable rate
          const result = await Payments.payInvoiceByWalletId({
            uncheckedPaymentRequest: invoice.lnInvoice.paymentRequest,
            memo: null,
            senderWalletId: newUsdWallet.id,
            senderAccount: newAccount,
          })
          if (result instanceof Error) throw result

          // Step 3: Replenish USD from BTC wallet with discovered 'minBtcAmountToSpend' for $0.01
          const invoiceNoAmountUsd = await Wallets.addInvoiceNoAmountForSelf({
            walletId: newUsdWallet.id,
          })
          if (invoiceNoAmountUsd instanceof Error) throw invoiceNoAmountUsd

          const repaid = await Payments.payNoAmountInvoiceByWalletIdForBtcWallet({
            amount: toSats(minBtcAmountToSpend.amount),
            uncheckedPaymentRequest: invoiceNoAmountUsd.lnInvoice.paymentRequest,
            memo: null,
            senderWalletId: newBtcWallet.id,
            senderAccount: newAccount,
          })
          if (repaid instanceof Error) throw repaid

          // Step 4: Check that no profit was made in the process
          const btcBalanceAfter = await getBalanceHelper(newBtcWallet.id)
          const sentAmountBtc = btcBalanceAfter - btcBalanceBefore
          expect(sentAmountBtc).toBeLessThanOrEqual(0)

          const usdBalanceAfter = await getBalanceHelper(newUsdWallet.id)
          const sentAmountUsd = usdBalanceAfter - usdBalanceBefore
          expect(sentAmountUsd).toBeLessThanOrEqual(0)
        })

        it("via no-amount fee probe", async () => {
          const accountAndWallets = await newAccountAndWallets()
          const { newBtcWallet, newUsdWallet, newAccount } = accountAndWallets

          // DISCOVER ARBITRAGE AMOUNTS FOR STRATEGY
          // =====
          const midPriceRatio = await getMidPriceRatio(usdHedgeEnabled)
          if (midPriceRatio instanceof Error) throw midPriceRatio
          const startingBtcAmount = midPriceRatio.convertFromUsd(ONE_CENT)

          // Validate btc starting amount for max btc discovery
          const maxBtcAmountToEarn = await getMaxBtcAmountToEarn({
            startingBtcAmount,
            accountAndWallets,
            sentAmountFn: getUsdEquivalentForWithAmountInvoiceSendToBtc,
          })
          baseLogger.info("Discovered:", { maxBtcAmountToEarn })

          // Validate btc starting amount for min btc discovery
          const minBtcAmountToSpend = await getMinBtcAmountToSpend({
            startingBtcAmount,
            accountAndWallets,
            sentAmountFn: getBtcEquivalentForNoAmountInvoiceProbeAndSendToUsd,
          })
          baseLogger.info("Discovered:", { minBtcAmountToSpend })

          // EXECUTE ARBITRAGE
          // =====
          const btcBalanceBefore = await getBalanceHelper(newBtcWallet.id)
          const usdBalanceBefore = await getBalanceHelper(newUsdWallet.id)

          // Step 1: Create invoice from BTC Wallet using discovered 'maxBtcAmountToEarn' from $0.01
          const invoice = await Wallets.addInvoiceForSelfForBtcWallet({
            walletId: newBtcWallet.id,
            amount: toSats(maxBtcAmountToEarn.amount),
          })
          if (invoice instanceof Error) throw invoice

          // Step 2: Pay invoice from USD wallet at favourable rate
          const result = await Payments.payInvoiceByWalletId({
            uncheckedPaymentRequest: invoice.lnInvoice.paymentRequest,
            memo: null,
            senderWalletId: newUsdWallet.id,
            senderAccount: newAccount,
          })
          if (result instanceof Error) throw result

          // Step 3: Replenish USD from BTC wallet with discovered 'minBtcAmountToSpend' for $0.01
          const invoiceNoAmountUsd = await Wallets.addInvoiceNoAmountForSelf({
            walletId: newUsdWallet.id,
          })
          if (invoiceNoAmountUsd instanceof Error) throw invoiceNoAmountUsd

          const probe = await Payments.getNoAmountLightningFeeEstimationForBtcWallet({
            amount: toSats(minBtcAmountToSpend.amount),
            uncheckedPaymentRequest: invoiceNoAmountUsd.lnInvoice.paymentRequest,
            walletId: newBtcWallet.id,
          })
          if (probe instanceof Error) throw probe

          const repaid = await Payments.payNoAmountInvoiceByWalletIdForBtcWallet({
            amount: toSats(minBtcAmountToSpend.amount),
            uncheckedPaymentRequest: invoiceNoAmountUsd.lnInvoice.paymentRequest,
            memo: null,
            senderWalletId: newBtcWallet.id,
            senderAccount: newAccount,
          })
          if (repaid instanceof Error) throw repaid

          // Step 4: Check that no profit was made in the process
          const btcBalanceAfter = await getBalanceHelper(newBtcWallet.id)
          const sentAmountBtc = btcBalanceAfter - btcBalanceBefore
          expect(sentAmountBtc).toBeLessThanOrEqual(0)

          const usdBalanceAfter = await getBalanceHelper(newUsdWallet.id)
          const sentAmountUsd = usdBalanceAfter - usdBalanceBefore
          expect(sentAmountUsd).toBeLessThanOrEqual(0)
        })
      })
    })

    describe("pay max btc-amount fee probe pull from usd wallet", () => {
      describe("replenish with $0.01 pull back to usd wallet", () => {
        it("via usd-denominated invoice", async () => {
          const accountAndWallets = await newAccountAndWallets()
          const { newBtcWallet, newUsdWallet, newAccount } = accountAndWallets

          // DISCOVER ARBITRAGE AMOUNTS FOR STRATEGY
          // =====
          const midPriceRatio = await getMidPriceRatio(usdHedgeEnabled)
          if (midPriceRatio instanceof Error) throw midPriceRatio
          const startingBtcAmount = midPriceRatio.convertFromUsd(ONE_CENT)

          // Validate btc starting amount for max btc discovery
          const maxBtcAmountToEarn = await getMaxBtcAmountToEarn({
            startingBtcAmount,
            accountAndWallets,
            sentAmountFn: getUsdEquivalentForWithAmountInvoiceProbeAndSendToBtc,
          })
          baseLogger.info("Discovered:", { maxBtcAmountToEarn })

          // EXECUTE ARBITRAGE
          // =====
          const btcBalanceBefore = await getBalanceHelper(newBtcWallet.id)
          const usdBalanceBefore = await getBalanceHelper(newUsdWallet.id)

          // Step 1: Create invoice from BTC Wallet using discovered 'maxBtcAmountToEarn' from $0.01
          const invoice = await Wallets.addInvoiceForSelfForBtcWallet({
            walletId: newBtcWallet.id,
            amount: toSats(maxBtcAmountToEarn.amount),
          })
          if (invoice instanceof Error) throw invoice

          // Step 2: Pay invoice from USD wallet at favourable rate
          const probe = await Payments.getLightningFeeEstimationForUsdWallet({
            uncheckedPaymentRequest: invoice.lnInvoice.paymentRequest,
            walletId: newUsdWallet.id,
          })
          if (probe instanceof Error) throw probe

          const result = await Payments.payInvoiceByWalletId({
            uncheckedPaymentRequest: invoice.lnInvoice.paymentRequest,
            memo: null,
            senderWalletId: newUsdWallet.id,
            senderAccount: newAccount,
          })
          if (result instanceof Error) throw result

          // Step 3: Replenish USD from BTC wallet with $0.01 invoice
          const invoiceUsd = await Wallets.addInvoiceForSelfForUsdWallet({
            walletId: newUsdWallet.id,
            amount: toCents(1),
          })
          if (invoiceUsd instanceof Error) throw invoiceUsd

          const resultUsd = await Payments.payInvoiceByWalletId({
            uncheckedPaymentRequest: invoiceUsd.lnInvoice.paymentRequest,
            memo: null,
            senderWalletId: newBtcWallet.id,
            senderAccount: newAccount,
          })
          if (resultUsd instanceof Error) throw resultUsd

          // Step 4: Check that no profit was made in the process
          const btcBalanceAfter = await getBalanceHelper(newBtcWallet.id)
          const sentAmountBtc = btcBalanceAfter - btcBalanceBefore
          expect(sentAmountBtc).toBeLessThanOrEqual(0)

          const usdBalanceAfter = await getBalanceHelper(newUsdWallet.id)
          const sentAmountUsd = usdBalanceAfter - usdBalanceBefore
          expect(sentAmountUsd).toBeLessThanOrEqual(0)
        })

        it("via usd-denominated fee probe", async () => {
          const accountAndWallets = await newAccountAndWallets()
          const { newBtcWallet, newUsdWallet, newAccount } = accountAndWallets

          // DISCOVER ARBITRAGE AMOUNTS FOR STRATEGY
          // =====
          const midPriceRatio = await getMidPriceRatio(usdHedgeEnabled)
          if (midPriceRatio instanceof Error) throw midPriceRatio
          const startingBtcAmount = midPriceRatio.convertFromUsd(ONE_CENT)

          // Validate btc starting amount for max btc discovery
          const maxBtcAmountToEarn = await getMaxBtcAmountToEarn({
            startingBtcAmount,
            accountAndWallets,
            sentAmountFn: getUsdEquivalentForWithAmountInvoiceProbeAndSendToBtc,
          })
          baseLogger.info("Discovered:", { maxBtcAmountToEarn })

          // EXECUTE ARBITRAGE
          // =====
          const btcBalanceBefore = await getBalanceHelper(newBtcWallet.id)
          const usdBalanceBefore = await getBalanceHelper(newUsdWallet.id)

          // Step 1: Create invoice from BTC Wallet using discovered 'maxBtcAmountToEarn' from $0.01
          const invoice = await Wallets.addInvoiceForSelfForBtcWallet({
            walletId: newBtcWallet.id,
            amount: toSats(maxBtcAmountToEarn.amount),
          })
          if (invoice instanceof Error) throw invoice

          // Step 2: Pay invoice from USD wallet at favourable rate
          const probe = await Payments.getLightningFeeEstimationForUsdWallet({
            uncheckedPaymentRequest: invoice.lnInvoice.paymentRequest,
            walletId: newUsdWallet.id,
          })
          if (probe instanceof Error) throw probe

          const result = await Payments.payInvoiceByWalletId({
            uncheckedPaymentRequest: invoice.lnInvoice.paymentRequest,
            memo: null,
            senderWalletId: newUsdWallet.id,
            senderAccount: newAccount,
          })
          if (result instanceof Error) throw result

          // Step 3: Replenish USD from BTC wallet with $0.01 invoice
          const invoiceUsd = await Wallets.addInvoiceForSelfForUsdWallet({
            walletId: newUsdWallet.id,
            amount: toCents(1),
          })
          if (invoiceUsd instanceof Error) throw invoiceUsd

          const probeUsd = await Payments.getLightningFeeEstimationForBtcWallet({
            uncheckedPaymentRequest: invoiceUsd.lnInvoice.paymentRequest,
            walletId: newBtcWallet.id,
          })
          if (probeUsd instanceof Error) throw probeUsd

          const resultUsd = await Payments.payInvoiceByWalletId({
            uncheckedPaymentRequest: invoiceUsd.lnInvoice.paymentRequest,
            memo: null,
            senderWalletId: newBtcWallet.id,
            senderAccount: newAccount,
          })
          if (resultUsd instanceof Error) throw resultUsd

          // Step 4: Check that no profit was made in the process
          const btcBalanceAfter = await getBalanceHelper(newBtcWallet.id)
          const sentAmountBtc = btcBalanceAfter - btcBalanceBefore
          expect(sentAmountBtc).toBeLessThanOrEqual(0)

          const usdBalanceAfter = await getBalanceHelper(newUsdWallet.id)
          const sentAmountUsd = usdBalanceAfter - usdBalanceBefore
          expect(sentAmountUsd).toBeLessThanOrEqual(0)
        })
      })

      describe("replenish with min-btc-for-1-cent push from btc wallet", () => {
        it("via intraledger payment", async () => {
          const accountAndWallets = await newAccountAndWallets()
          const { newBtcWallet, newUsdWallet, newAccount } = accountAndWallets

          // DISCOVER ARBITRAGE AMOUNTS FOR STRATEGY
          // =====
          const midPriceRatio = await getMidPriceRatio(usdHedgeEnabled)
          if (midPriceRatio instanceof Error) throw midPriceRatio
          const startingBtcAmount = midPriceRatio.convertFromUsd(ONE_CENT)

          // Validate btc starting amount for max btc discovery
          const maxBtcAmountToEarn = await getMaxBtcAmountToEarn({
            startingBtcAmount,
            accountAndWallets,
            sentAmountFn: getUsdEquivalentForWithAmountInvoiceProbeAndSendToBtc,
          })
          baseLogger.info("Discovered:", { maxBtcAmountToEarn })

          // Validate btc starting amount for min btc discovery
          const minBtcAmountToSpend = await getMinBtcAmountToSpend({
            startingBtcAmount,
            accountAndWallets,
            sentAmountFn: getBtcEquivalentForIntraledgerSendToUsd,
          })

          baseLogger.info("Discovered:", { minBtcAmountToSpend })

          // EXECUTE ARBITRAGE
          // =====
          const btcBalanceBefore = await getBalanceHelper(newBtcWallet.id)
          const usdBalanceBefore = await getBalanceHelper(newUsdWallet.id)

          // Step 1: Create invoice from BTC Wallet using discovered 'maxBtcAmountToEarn' from $0.01
          const invoice = await Wallets.addInvoiceForSelfForBtcWallet({
            walletId: newBtcWallet.id,
            amount: toSats(maxBtcAmountToEarn.amount),
          })
          if (invoice instanceof Error) throw invoice

          // Step 2: Pay invoice from USD wallet at favourable rate
          const probeResult = await Payments.getLightningFeeEstimationForUsdWallet({
            uncheckedPaymentRequest: invoice.lnInvoice.paymentRequest,
            walletId: newUsdWallet.id,
          })
          if (probeResult instanceof Error) throw probeResult

          const result = await Payments.payInvoiceByWalletId({
            uncheckedPaymentRequest: invoice.lnInvoice.paymentRequest,
            memo: null,
            senderWalletId: newUsdWallet.id,
            senderAccount: newAccount,
          })
          if (result instanceof Error) throw result

          // Step 3: Replenish USD from BTC wallet with discovered 'minBtcAmountToSpend' for $0.01
          const paid = await Payments.intraledgerPaymentSendWalletIdForBtcWallet({
            recipientWalletId: newUsdWallet.id,
            memo: null,
            amount: toSats(minBtcAmountToSpend.amount),
            senderWalletId: newBtcWallet.id,
            senderAccount: newAccount,
          })
          if (
            paid instanceof Error &&
            !(paid instanceof ZeroAmountForUsdRecipientError)
          ) {
            throw paid
          }

          // Step 4: Check that no profit was made in the process
          const btcBalanceAfter = await getBalanceHelper(newBtcWallet.id)
          const sentAmountBtc = btcBalanceAfter - btcBalanceBefore
          expect(sentAmountBtc).toBeLessThanOrEqual(0)

          const usdBalanceAfter = await getBalanceHelper(newUsdWallet.id)
          const sentAmountUsd = usdBalanceAfter - usdBalanceBefore
          expect(sentAmountUsd).toBeLessThanOrEqual(0)
        })

        it("via no-amount min btc invoice", async () => {
          const accountAndWallets = await newAccountAndWallets()
          const { newBtcWallet, newUsdWallet, newAccount } = accountAndWallets

          // DISCOVER ARBITRAGE AMOUNTS FOR STRATEGY
          // =====
          const midPriceRatio = await getMidPriceRatio(usdHedgeEnabled)
          if (midPriceRatio instanceof Error) throw midPriceRatio
          const startingBtcAmount = midPriceRatio.convertFromUsd(ONE_CENT)

          // Validate btc starting amount for max btc discovery
          const maxBtcAmountToEarn = await getMaxBtcAmountToEarn({
            startingBtcAmount,
            accountAndWallets,
            sentAmountFn: getUsdEquivalentForWithAmountInvoiceProbeAndSendToBtc,
          })
          baseLogger.info("Discovered:", { maxBtcAmountToEarn })

          // Validate btc starting amount for min btc discovery
          const minBtcAmountToSpend = await getMinBtcAmountToSpend({
            startingBtcAmount,
            accountAndWallets,
            sentAmountFn: getBtcEquivalentForNoAmountInvoiceSendToUsd,
          })
          baseLogger.info("Discovered:", { minBtcAmountToSpend })

          // EXECUTE ARBITRAGE
          // =====
          const btcBalanceBefore = await getBalanceHelper(newBtcWallet.id)
          const usdBalanceBefore = await getBalanceHelper(newUsdWallet.id)

          // Step 1: Create invoice from BTC Wallet using discovered 'maxBtcAmountToEarn' from $0.01
          const invoice = await Wallets.addInvoiceForSelfForBtcWallet({
            walletId: newBtcWallet.id,
            amount: toSats(maxBtcAmountToEarn.amount),
          })
          if (invoice instanceof Error) throw invoice

          // Step 2: Pay invoice from USD wallet at favourable rate
          const probe = await Payments.getLightningFeeEstimationForUsdWallet({
            uncheckedPaymentRequest: invoice.lnInvoice.paymentRequest,
            walletId: newUsdWallet.id,
          })
          if (probe instanceof Error) throw probe

          const result = await Payments.payInvoiceByWalletId({
            uncheckedPaymentRequest: invoice.lnInvoice.paymentRequest,
            memo: null,
            senderWalletId: newUsdWallet.id,
            senderAccount: newAccount,
          })
          if (result instanceof Error) throw result

          // Step 3: Replenish USD from BTC wallet with discovered 'minBtcAmountToSpend' for $0.01
          const invoiceNoAmountUsd = await Wallets.addInvoiceNoAmountForSelf({
            walletId: newUsdWallet.id,
          })
          if (invoiceNoAmountUsd instanceof Error) throw invoiceNoAmountUsd

          const repaid = await Payments.payNoAmountInvoiceByWalletIdForBtcWallet({
            amount: toSats(minBtcAmountToSpend.amount),
            uncheckedPaymentRequest: invoiceNoAmountUsd.lnInvoice.paymentRequest,
            memo: null,
            senderWalletId: newBtcWallet.id,
            senderAccount: newAccount,
          })
          if (repaid instanceof Error) throw repaid

          // Step 4: Check that no profit was made in the process
          const btcBalanceAfter = await getBalanceHelper(newBtcWallet.id)
          const sentAmountBtc = btcBalanceAfter - btcBalanceBefore
          expect(sentAmountBtc).toBeLessThanOrEqual(0)

          const usdBalanceAfter = await getBalanceHelper(newUsdWallet.id)
          const sentAmountUsd = usdBalanceAfter - usdBalanceBefore
          expect(sentAmountUsd).toBeLessThanOrEqual(0)
        })

        it("via no-amount min btc fee probe", async () => {
          const accountAndWallets = await newAccountAndWallets()
          const { newBtcWallet, newUsdWallet, newAccount } = accountAndWallets

          // DISCOVER ARBITRAGE AMOUNTS FOR STRATEGY
          // =====
          const midPriceRatio = await getMidPriceRatio(usdHedgeEnabled)
          if (midPriceRatio instanceof Error) throw midPriceRatio
          const startingBtcAmount = midPriceRatio.convertFromUsd(ONE_CENT)

          // Validate btc starting amount for max btc discovery
          const maxBtcAmountToEarn = await getMaxBtcAmountToEarn({
            startingBtcAmount,
            accountAndWallets,
            sentAmountFn: getUsdEquivalentForWithAmountInvoiceProbeAndSendToBtc,
          })
          baseLogger.info("Discovered:", { maxBtcAmountToEarn })

          // Validate btc starting amount for min btc discovery
          const minBtcAmountToSpend = await getMinBtcAmountToSpend({
            startingBtcAmount,
            accountAndWallets,
            sentAmountFn: getBtcEquivalentForNoAmountInvoiceProbeAndSendToUsd,
          })
          baseLogger.info("Discovered:", { minBtcAmountToSpend })

          // EXECUTE ARBITRAGE
          // =====
          const btcBalanceBefore = await getBalanceHelper(newBtcWallet.id)
          const usdBalanceBefore = await getBalanceHelper(newUsdWallet.id)

          // Step 1: Create invoice from BTC Wallet using discovered 'maxBtcAmountToEarn' from $0.01
          const invoice = await Wallets.addInvoiceForSelfForBtcWallet({
            walletId: newBtcWallet.id,
            amount: toSats(maxBtcAmountToEarn.amount),
          })
          if (invoice instanceof Error) throw invoice

          // Step 2: Pay invoice from USD wallet at favourable rate
          const probe = await Payments.getLightningFeeEstimationForUsdWallet({
            uncheckedPaymentRequest: invoice.lnInvoice.paymentRequest,
            walletId: newUsdWallet.id,
          })
          if (probe instanceof Error) throw probe

          const result = await Payments.payInvoiceByWalletId({
            uncheckedPaymentRequest: invoice.lnInvoice.paymentRequest,
            memo: null,
            senderWalletId: newUsdWallet.id,
            senderAccount: newAccount,
          })
          if (result instanceof Error) throw result

          // Step 3: Replenish USD from BTC wallet with discovered 'minBtcAmountToSpend' for $0.01
          const invoiceNoAmountUsd = await Wallets.addInvoiceNoAmountForSelf({
            walletId: newUsdWallet.id,
          })
          if (invoiceNoAmountUsd instanceof Error) throw invoiceNoAmountUsd

          const probeUsd = await Payments.getNoAmountLightningFeeEstimationForBtcWallet({
            amount: toSats(minBtcAmountToSpend.amount),
            uncheckedPaymentRequest: invoiceNoAmountUsd.lnInvoice.paymentRequest,
            walletId: newBtcWallet.id,
          })
          if (probeUsd instanceof Error) throw probeUsd

          const repaid = await Payments.payNoAmountInvoiceByWalletIdForBtcWallet({
            amount: toSats(minBtcAmountToSpend.amount),
            uncheckedPaymentRequest: invoiceNoAmountUsd.lnInvoice.paymentRequest,
            memo: null,
            senderWalletId: newBtcWallet.id,
            senderAccount: newAccount,
          })
          if (repaid instanceof Error) throw repaid

          // Step 4: Check that no profit was made in the process
          const btcBalanceAfter = await getBalanceHelper(newBtcWallet.id)
          const sentAmountBtc = btcBalanceAfter - btcBalanceBefore
          expect(sentAmountBtc).toBeLessThanOrEqual(0)

          const usdBalanceAfter = await getBalanceHelper(newUsdWallet.id)
          const sentAmountUsd = usdBalanceAfter - usdBalanceBefore
          expect(sentAmountUsd).toBeLessThanOrEqual(0)
        })
      })
    })
  })

  describe("can pay 1 sat and receive $0.01", () => {
    // This strategy is to see if we can send 1 sat from a BTC wallet in such
    // a way that in a USD wallet it:
    // - rounds up to $0.01
    // - can be converted back to BTC to get back more than 1 sat

    describe("pay 1-sat to intraledger usd wallet push from btc wallet", () => {
      describe("replenish with $0.01 push from usd wallet", () => {
        it("via intraledger payment", async () => {
          const accountAndWallets = await newAccountAndWallets()
          const { newBtcWallet, newUsdWallet, newAccount } = accountAndWallets

          const sendArgs = {
            recipientWalletId: newUsdWallet.id,
            memo: null,
            senderWalletId: newBtcWallet.id,
            senderAccount: newAccount,
          }

          // DISCOVER ARBITRAGE AMOUNTS FOR STRATEGY
          // =====
          // Validate btc starting amount for min btc discovery
          const minBtcAmountToSpend = await getMinBtcAmountToSpend({
            startingBtcAmount: ONE_SAT,
            accountAndWallets,
            sentAmountFn: getBtcEquivalentForIntraledgerSendToUsd,
          })
          baseLogger.info("Discovered:", { minBtcAmountToSpend })

          // EXECUTE ARBITRAGE
          // =====
          const btcBalanceBefore = await getBalanceHelper(newBtcWallet.id)
          const usdBalanceBefore = await getBalanceHelper(newUsdWallet.id)

          // Step 1: Pay min sats intraledger to USD wallet
          const paid = await Payments.intraledgerPaymentSendWalletIdForBtcWallet({
            amount: toSats(minBtcAmountToSpend.amount),
            ...sendArgs,
          })
          if (paid instanceof Error) throw paid

          // Step 2: Pay back $0.01 from USD to BTC wallet
          const repaid = await Payments.intraledgerPaymentSendWalletIdForUsdWallet({
            amount: toCents(1),
            recipientWalletId: newBtcWallet.id,
            memo: null,
            senderWalletId: newUsdWallet.id,
            senderAccount: newAccount,
          })
          if (repaid instanceof Error) throw repaid

          // Step 3: Check that no profit was made in the process
          const btcBalanceAfter = await getBalanceHelper(newBtcWallet.id)
          const sentAmountBtc = btcBalanceAfter - btcBalanceBefore
          expect(sentAmountBtc).toBeLessThanOrEqual(0)

          const usdBalanceAfter = await getBalanceHelper(newUsdWallet.id)
          const sentAmountUsd = usdBalanceAfter - usdBalanceBefore
          expect(sentAmountUsd).toBeLessThanOrEqual(0)
        })
      })
    })

    describe("pay 1-sat to no-amount usd invoice push from btc wallet", () => {
      describe("replenish with $0.01 push from usd wallet", () => {
        it("via intraledger payment", async () => {
          const accountAndWallets = await newAccountAndWallets()
          const { newBtcWallet, newUsdWallet, newAccount } = accountAndWallets

          // DISCOVER ARBITRAGE AMOUNTS FOR STRATEGY
          // =====
          // Validate btc starting amount for min btc discovery
          const minBtcAmountToSpend = await getMinBtcAmountToSpend({
            startingBtcAmount: ONE_SAT,
            accountAndWallets,
            sentAmountFn: getBtcEquivalentForNoAmountInvoiceSendToUsd,
          })
          baseLogger.info("Discovered:", { minBtcAmountToSpend })

          // EXECUTE ARBITRAGE
          // =====
          const btcBalanceBefore = await getBalanceHelper(newBtcWallet.id)
          const usdBalanceBefore = await getBalanceHelper(newUsdWallet.id)

          // Step 1: Pay min sats via no-amount invoice to USD wallet
          const invoice = await Wallets.addInvoiceNoAmountForSelf({
            walletId: newUsdWallet.id,
          })
          if (invoice instanceof Error) throw invoice

          const paid = await Payments.payNoAmountInvoiceByWalletIdForBtcWallet({
            amount: Number(minBtcAmountToSpend.amount),
            uncheckedPaymentRequest: invoice.lnInvoice.paymentRequest,
            memo: null,
            senderWalletId: newBtcWallet.id,
            senderAccount: newAccount,
          })
          if (paid instanceof Error) throw paid

          // Step 2: Pay back $0.01 from USD to BTC wallet
          const repaid = await Payments.intraledgerPaymentSendWalletIdForUsdWallet({
            amount: toCents(1),
            recipientWalletId: newBtcWallet.id,
            memo: null,
            senderWalletId: newUsdWallet.id,
            senderAccount: newAccount,
          })
          if (repaid instanceof Error) throw repaid

          // Step 3: Check that no profit was made in the process
          const btcBalanceAfter = await getBalanceHelper(newBtcWallet.id)
          const sentAmountBtc = btcBalanceAfter - btcBalanceBefore
          expect(sentAmountBtc).toBeLessThanOrEqual(0)

          const usdBalanceAfter = await getBalanceHelper(newUsdWallet.id)
          const sentAmountUsd = usdBalanceAfter - usdBalanceBefore
          expect(sentAmountUsd).toBeLessThanOrEqual(0)
        })

        it("via no-amount invoice", async () => {
          const accountAndWallets = await newAccountAndWallets()
          const { newBtcWallet, newUsdWallet, newAccount } = accountAndWallets

          // DISCOVER ARBITRAGE AMOUNTS FOR STRATEGY
          // =====
          // Validate btc starting amount for min btc discovery
          const minBtcAmountToSpend = await getMinBtcAmountToSpend({
            startingBtcAmount: ONE_SAT,
            accountAndWallets,
            sentAmountFn: getBtcEquivalentForNoAmountInvoiceSendToUsd,
          })
          baseLogger.info("Discovered:", { minBtcAmountToSpend })

          // EXECUTE ARBITRAGE
          // =====
          const btcBalanceBefore = await getBalanceHelper(newBtcWallet.id)
          const usdBalanceBefore = await getBalanceHelper(newUsdWallet.id)

          // Step 1: Pay min sats via no-amount invoice to USD wallet
          const invoice = await Wallets.addInvoiceNoAmountForSelf({
            walletId: newUsdWallet.id,
          })
          if (invoice instanceof Error) throw invoice

          const paid = await Payments.payNoAmountInvoiceByWalletIdForBtcWallet({
            amount: Number(minBtcAmountToSpend.amount),
            uncheckedPaymentRequest: invoice.lnInvoice.paymentRequest,
            memo: null,
            senderWalletId: newBtcWallet.id,
            senderAccount: newAccount,
          })
          if (paid instanceof Error) throw paid

          // Step 2: Replenish BTC from USD wallet with $0.01
          const invoiceNoAmountBtc = await Wallets.addInvoiceNoAmountForSelf({
            walletId: newBtcWallet.id,
          })
          if (invoiceNoAmountBtc instanceof Error) throw invoiceNoAmountBtc

          const repaid = await Payments.payNoAmountInvoiceByWalletIdForUsdWallet({
            amount: toCents(1),
            uncheckedPaymentRequest: invoiceNoAmountBtc.lnInvoice.paymentRequest,
            memo: null,
            senderWalletId: newUsdWallet.id,
            senderAccount: newAccount,
          })
          if (repaid instanceof Error) throw repaid

          // Step 3: Check that no profit was made in the process
          const btcBalanceAfter = await getBalanceHelper(newBtcWallet.id)
          const sentAmountBtc = btcBalanceAfter - btcBalanceBefore
          expect(sentAmountBtc).toBeLessThanOrEqual(0)

          const usdBalanceAfter = await getBalanceHelper(newUsdWallet.id)
          const sentAmountUsd = usdBalanceAfter - usdBalanceBefore
          expect(sentAmountUsd).toBeLessThanOrEqual(0)
        })

        it("via no-amount fee probe", async () => {
          const accountAndWallets = await newAccountAndWallets()
          const { newBtcWallet, newUsdWallet, newAccount } = accountAndWallets

          // DISCOVER ARBITRAGE AMOUNTS FOR STRATEGY
          // =====
          // Validate btc starting amount for min btc discovery
          const minBtcAmountToSpend = await getMinBtcAmountToSpend({
            startingBtcAmount: ONE_SAT,
            accountAndWallets,
            sentAmountFn: getBtcEquivalentForNoAmountInvoiceSendToUsd,
          })
          baseLogger.info("Discovered:", { minBtcAmountToSpend })

          // EXECUTE ARBITRAGE
          // =====
          const btcBalanceBefore = await getBalanceHelper(newBtcWallet.id)
          const usdBalanceBefore = await getBalanceHelper(newUsdWallet.id)

          // Step 1: Pay min sats via no-amount invoice to USD wallet
          const invoice = await Wallets.addInvoiceNoAmountForSelf({
            walletId: newUsdWallet.id,
          })
          if (invoice instanceof Error) throw invoice

          const paid = await Payments.payNoAmountInvoiceByWalletIdForBtcWallet({
            amount: Number(minBtcAmountToSpend.amount),
            uncheckedPaymentRequest: invoice.lnInvoice.paymentRequest,
            memo: null,
            senderWalletId: newBtcWallet.id,
            senderAccount: newAccount,
          })
          if (paid instanceof Error) throw paid

          // Step 2: Replenish BTC from USD wallet with $0.01
          const invoiceNoAmountBtc = await Wallets.addInvoiceNoAmountForSelf({
            walletId: newBtcWallet.id,
          })
          if (invoiceNoAmountBtc instanceof Error) throw invoiceNoAmountBtc

          const probeBtc = await Payments.getNoAmountLightningFeeEstimationForUsdWallet({
            amount: toCents(1),
            uncheckedPaymentRequest: invoiceNoAmountBtc.lnInvoice.paymentRequest,
            walletId: newUsdWallet.id,
          })
          if (probeBtc instanceof Error) throw probeBtc

          const repaid = await Payments.payNoAmountInvoiceByWalletIdForUsdWallet({
            amount: toCents(1),
            uncheckedPaymentRequest: invoiceNoAmountBtc.lnInvoice.paymentRequest,
            memo: null,
            senderWalletId: newUsdWallet.id,
            senderAccount: newAccount,
          })
          if (repaid instanceof Error) throw repaid

          // Step 3: Check that no profit was made in the process
          const btcBalanceAfter = await getBalanceHelper(newBtcWallet.id)
          const sentAmountBtc = btcBalanceAfter - btcBalanceBefore
          expect(sentAmountBtc).toBeLessThanOrEqual(0)

          const usdBalanceAfter = await getBalanceHelper(newUsdWallet.id)
          const sentAmountUsd = usdBalanceAfter - usdBalanceBefore
          expect(sentAmountUsd).toBeLessThanOrEqual(0)
        })
      })

      describe("replenish with min-btc-for-1-cent pull back to btc wallet", () => {
        it("via invoice", async () => {
          const accountAndWallets = await newAccountAndWallets()
          const { newBtcWallet, newUsdWallet, newAccount } = accountAndWallets

          // DISCOVER ARBITRAGE AMOUNTS FOR STRATEGY
          // =====
          const midPriceRatio = await getMidPriceRatio(usdHedgeEnabled)
          if (midPriceRatio instanceof Error) throw midPriceRatio
          const startingBtcAmount = midPriceRatio.convertFromUsd(ONE_CENT)

          // Validate btc starting amount for min btc discovery
          const minBtcAmountToSpend = await getMinBtcAmountToSpend({
            startingBtcAmount: ONE_SAT,
            accountAndWallets,
            sentAmountFn: getBtcEquivalentForNoAmountInvoiceSendToUsd,
          })
          baseLogger.info("Discovered:", { minBtcAmountToSpend })

          // Validate btc starting amount for max btc discovery
          const maxBtcAmountToEarn = await getMaxBtcAmountToEarn({
            startingBtcAmount,
            accountAndWallets,
            sentAmountFn: getUsdEquivalentForWithAmountInvoiceSendToBtc,
          })
          baseLogger.info("Discovered:", { maxBtcAmountToEarn })

          // EXECUTE ARBITRAGE
          // =====
          const btcBalanceBefore = await getBalanceHelper(newBtcWallet.id)
          const usdBalanceBefore = await getBalanceHelper(newUsdWallet.id)

          // Step 1: Pay min sats via no-amount invoice to USD wallet
          const invoice = await Wallets.addInvoiceNoAmountForSelf({
            walletId: newUsdWallet.id,
          })
          if (invoice instanceof Error) throw invoice

          const paid = await Payments.payNoAmountInvoiceByWalletIdForBtcWallet({
            amount: Number(minBtcAmountToSpend.amount),
            uncheckedPaymentRequest: invoice.lnInvoice.paymentRequest,
            memo: null,
            senderWalletId: newBtcWallet.id,
            senderAccount: newAccount,
          })
          if (paid instanceof Error) throw paid

          // Step 2: Pay back $0.01 from USD to BTC wallet
          const invoiceBtc = await Wallets.addInvoiceForSelfForBtcWallet({
            walletId: newBtcWallet.id,
            amount: toSats(maxBtcAmountToEarn.amount),
          })
          if (invoiceBtc instanceof Error) throw invoiceBtc

          const repaid = await Payments.payInvoiceByWalletId({
            uncheckedPaymentRequest: invoiceBtc.lnInvoice.paymentRequest,
            memo: null,
            senderWalletId: newUsdWallet.id,
            senderAccount: newAccount,
          })
          if (repaid instanceof Error) throw repaid

          // Step 3: Check that no profit was made in the process
          const btcBalanceAfter = await getBalanceHelper(newBtcWallet.id)
          const sentAmountBtc = btcBalanceAfter - btcBalanceBefore
          expect(sentAmountBtc).toBeLessThanOrEqual(0)

          const usdBalanceAfter = await getBalanceHelper(newUsdWallet.id)
          const sentAmountUsd = usdBalanceAfter - usdBalanceBefore
          expect(sentAmountUsd).toBeLessThanOrEqual(0)
        })

        it("via fee probe", async () => {
          const accountAndWallets = await newAccountAndWallets()
          const { newBtcWallet, newUsdWallet, newAccount } = accountAndWallets

          // DISCOVER ARBITRAGE AMOUNTS FOR STRATEGY
          // =====
          const midPriceRatio = await getMidPriceRatio(usdHedgeEnabled)
          if (midPriceRatio instanceof Error) throw midPriceRatio
          const startingBtcAmount = midPriceRatio.convertFromUsd(ONE_CENT)

          // Validate btc starting amount for min btc discovery
          const minBtcAmountToSpend = await getMinBtcAmountToSpend({
            startingBtcAmount: ONE_SAT,
            accountAndWallets,
            sentAmountFn: getBtcEquivalentForNoAmountInvoiceSendToUsd,
          })
          baseLogger.info("Discovered:", { minBtcAmountToSpend })

          // Validate btc starting amount for max btc discovery
          const maxBtcAmountToEarn = await getMaxBtcAmountToEarn({
            startingBtcAmount,
            accountAndWallets,
            sentAmountFn: getUsdEquivalentForWithAmountInvoiceProbeAndSendToBtc,
          })
          baseLogger.info("Discovered:", { maxBtcAmountToEarn })

          // EXECUTE ARBITRAGE
          // =====
          const btcBalanceBefore = await getBalanceHelper(newBtcWallet.id)
          const usdBalanceBefore = await getBalanceHelper(newUsdWallet.id)

          // Step 1: Pay min sats via no-amount invoice to USD wallet
          const invoice = await Wallets.addInvoiceNoAmountForSelf({
            walletId: newUsdWallet.id,
          })
          if (invoice instanceof Error) throw invoice

          const paid = await Payments.payNoAmountInvoiceByWalletIdForBtcWallet({
            amount: Number(minBtcAmountToSpend.amount),
            uncheckedPaymentRequest: invoice.lnInvoice.paymentRequest,
            memo: null,
            senderWalletId: newBtcWallet.id,
            senderAccount: newAccount,
          })
          if (paid instanceof Error) throw paid

          // Step 2: Pay back $0.01 from USD to BTC wallet
          const invoiceBtc = await Wallets.addInvoiceForSelfForBtcWallet({
            walletId: newBtcWallet.id,
            amount: toSats(maxBtcAmountToEarn.amount),
          })
          if (invoiceBtc instanceof Error) throw invoiceBtc

          const probeUsd = await Payments.getLightningFeeEstimationForUsdWallet({
            uncheckedPaymentRequest: invoiceBtc.lnInvoice.paymentRequest,
            walletId: newUsdWallet.id,
          })
          if (probeUsd instanceof Error) throw probeUsd

          const repaid = await Payments.payInvoiceByWalletId({
            uncheckedPaymentRequest: invoiceBtc.lnInvoice.paymentRequest,
            memo: null,
            senderWalletId: newUsdWallet.id,
            senderAccount: newAccount,
          })
          if (repaid instanceof Error) throw repaid

          // Step 3: Check that no profit was made in the process
          const btcBalanceAfter = await getBalanceHelper(newBtcWallet.id)
          const sentAmountBtc = btcBalanceAfter - btcBalanceBefore
          expect(sentAmountBtc).toBeLessThanOrEqual(0)

          const usdBalanceAfter = await getBalanceHelper(newUsdWallet.id)
          const sentAmountUsd = usdBalanceAfter - usdBalanceBefore
          expect(sentAmountUsd).toBeLessThanOrEqual(0)
        })
      })
    })

    describe("pay 1-sat to no-amount usd fee probe push from btc wallet", () => {
      describe("replenish with $0.01 push from usd wallet", () => {
        it("via intraledger payment", async () => {
          const accountAndWallets = await newAccountAndWallets()
          const { newBtcWallet, newUsdWallet, newAccount } = accountAndWallets

          // DISCOVER ARBITRAGE AMOUNTS FOR STRATEGY
          // =====
          // Validate btc starting amount for min btc discovery
          const minBtcAmountToSpend = await getMinBtcAmountToSpend({
            startingBtcAmount: ONE_SAT,
            accountAndWallets,
            sentAmountFn: getBtcEquivalentForNoAmountInvoiceProbeAndSendToUsd,
          })
          baseLogger.info("Discovered:", { minBtcAmountToSpend })

          // EXECUTE ARBITRAGE
          // =====
          const btcBalanceBefore = await getBalanceHelper(newBtcWallet.id)
          const usdBalanceBefore = await getBalanceHelper(newUsdWallet.id)

          // Step 1: Pay min sats via no-amount invoice to USD wallet
          const invoice = await Wallets.addInvoiceNoAmountForSelf({
            walletId: newUsdWallet.id,
          })
          if (invoice instanceof Error) throw invoice

          const probe = await Payments.getNoAmountLightningFeeEstimationForBtcWallet({
            amount: Number(minBtcAmountToSpend.amount),
            uncheckedPaymentRequest: invoice.lnInvoice.paymentRequest,
            walletId: newBtcWallet.id,
          })
          if (probe instanceof Error) throw probe

          const paid = await Payments.payNoAmountInvoiceByWalletIdForBtcWallet({
            amount: Number(minBtcAmountToSpend.amount),
            uncheckedPaymentRequest: invoice.lnInvoice.paymentRequest,
            memo: null,
            senderWalletId: newBtcWallet.id,
            senderAccount: newAccount,
          })
          if (paid instanceof Error) throw paid

          // Step 2: Pay back $0.01 from USD to BTC wallet
          const repaid = await Payments.intraledgerPaymentSendWalletIdForUsdWallet({
            amount: toCents(1),
            recipientWalletId: newBtcWallet.id,
            memo: null,
            senderWalletId: newUsdWallet.id,
            senderAccount: newAccount,
          })
          if (repaid instanceof Error) throw repaid

          // Step 3: Check that no profit was made in the process
          const btcBalanceAfter = await getBalanceHelper(newBtcWallet.id)
          const sentAmountBtc = btcBalanceAfter - btcBalanceBefore
          expect(sentAmountBtc).toBeLessThanOrEqual(0)

          const usdBalanceAfter = await getBalanceHelper(newUsdWallet.id)
          const sentAmountUsd = usdBalanceAfter - usdBalanceBefore
          expect(sentAmountUsd).toBeLessThanOrEqual(0)
        })

        it("via no-amount invoice", async () => {
          const accountAndWallets = await newAccountAndWallets()
          const { newBtcWallet, newUsdWallet, newAccount } = accountAndWallets

          // DISCOVER ARBITRAGE AMOUNTS FOR STRATEGY
          // =====
          // Validate btc starting amount for min btc discovery
          const minBtcAmountToSpend = await getMinBtcAmountToSpend({
            startingBtcAmount: ONE_SAT,
            accountAndWallets,
            sentAmountFn: getBtcEquivalentForNoAmountInvoiceProbeAndSendToUsd,
          })
          baseLogger.info("Discovered:", { minBtcAmountToSpend })

          // EXECUTE ARBITRAGE
          // =====
          const btcBalanceBefore = await getBalanceHelper(newBtcWallet.id)
          const usdBalanceBefore = await getBalanceHelper(newUsdWallet.id)

          // Step 1: Pay min sats via no-amount invoice to USD wallet
          const invoice = await Wallets.addInvoiceNoAmountForSelf({
            walletId: newUsdWallet.id,
          })
          if (invoice instanceof Error) throw invoice

          const probe = await Payments.getNoAmountLightningFeeEstimationForBtcWallet({
            amount: Number(minBtcAmountToSpend.amount),
            uncheckedPaymentRequest: invoice.lnInvoice.paymentRequest,
            walletId: newBtcWallet.id,
          })
          if (probe instanceof Error) throw probe

          const paid = await Payments.payNoAmountInvoiceByWalletIdForBtcWallet({
            amount: Number(minBtcAmountToSpend.amount),
            uncheckedPaymentRequest: invoice.lnInvoice.paymentRequest,
            memo: null,
            senderWalletId: newBtcWallet.id,
            senderAccount: newAccount,
          })
          if (paid instanceof Error) throw paid

          // Step 2: Replenish BTC from USD wallet with $0.01
          const invoiceNoAmountBtc = await Wallets.addInvoiceNoAmountForSelf({
            walletId: newBtcWallet.id,
          })
          if (invoiceNoAmountBtc instanceof Error) throw invoiceNoAmountBtc

          const repaid = await Payments.payNoAmountInvoiceByWalletIdForUsdWallet({
            amount: toCents(1),
            uncheckedPaymentRequest: invoiceNoAmountBtc.lnInvoice.paymentRequest,
            memo: null,
            senderWalletId: newUsdWallet.id,
            senderAccount: newAccount,
          })
          if (repaid instanceof Error) throw repaid

          // Step 3: Check that no profit was made in the process
          const btcBalanceAfter = await getBalanceHelper(newBtcWallet.id)
          const sentAmountBtc = btcBalanceAfter - btcBalanceBefore
          expect(sentAmountBtc).toBeLessThanOrEqual(0)

          const usdBalanceAfter = await getBalanceHelper(newUsdWallet.id)
          const sentAmountUsd = usdBalanceAfter - usdBalanceBefore
          expect(sentAmountUsd).toBeLessThanOrEqual(0)
        })

        it("via no-amount fee probe", async () => {
          const accountAndWallets = await newAccountAndWallets()
          const { newBtcWallet, newUsdWallet, newAccount } = accountAndWallets

          // DISCOVER ARBITRAGE AMOUNTS FOR STRATEGY
          // =====
          // Validate btc starting amount for min btc discovery
          const minBtcAmountToSpend = await getMinBtcAmountToSpend({
            startingBtcAmount: ONE_SAT,
            accountAndWallets,
            sentAmountFn: getBtcEquivalentForNoAmountInvoiceProbeAndSendToUsd,
          })
          baseLogger.info("Discovered:", { minBtcAmountToSpend })

          // EXECUTE ARBITRAGE
          // =====
          const btcBalanceBefore = await getBalanceHelper(newBtcWallet.id)
          const usdBalanceBefore = await getBalanceHelper(newUsdWallet.id)

          // Step 1: Pay min sats via no-amount invoice to USD wallet
          const invoice = await Wallets.addInvoiceNoAmountForSelf({
            walletId: newUsdWallet.id,
          })
          if (invoice instanceof Error) throw invoice

          const probe = await Payments.getNoAmountLightningFeeEstimationForBtcWallet({
            amount: Number(minBtcAmountToSpend.amount),
            uncheckedPaymentRequest: invoice.lnInvoice.paymentRequest,
            walletId: newBtcWallet.id,
          })
          if (probe instanceof Error) throw probe

          const paid = await Payments.payNoAmountInvoiceByWalletIdForBtcWallet({
            amount: Number(minBtcAmountToSpend.amount),
            uncheckedPaymentRequest: invoice.lnInvoice.paymentRequest,
            memo: null,
            senderWalletId: newBtcWallet.id,
            senderAccount: newAccount,
          })
          if (paid instanceof Error) throw paid

          // Step 2: Replenish BTC from USD wallet with $0.01
          const invoiceNoAmountBtc = await Wallets.addInvoiceNoAmountForSelf({
            walletId: newBtcWallet.id,
          })
          if (invoiceNoAmountBtc instanceof Error) throw invoiceNoAmountBtc

          const probeBtc = await Payments.getNoAmountLightningFeeEstimationForUsdWallet({
            amount: toCents(1),
            uncheckedPaymentRequest: invoiceNoAmountBtc.lnInvoice.paymentRequest,
            walletId: newUsdWallet.id,
          })
          if (probeBtc instanceof Error) throw probeBtc

          const repaid = await Payments.payNoAmountInvoiceByWalletIdForUsdWallet({
            amount: toCents(1),
            uncheckedPaymentRequest: invoiceNoAmountBtc.lnInvoice.paymentRequest,
            memo: null,
            senderWalletId: newUsdWallet.id,
            senderAccount: newAccount,
          })
          if (repaid instanceof Error) throw repaid

          // Step 3: Check that no profit was made in the process
          const btcBalanceAfter = await getBalanceHelper(newBtcWallet.id)
          const sentAmountBtc = btcBalanceAfter - btcBalanceBefore
          expect(sentAmountBtc).toBeLessThanOrEqual(0)

          const usdBalanceAfter = await getBalanceHelper(newUsdWallet.id)
          const sentAmountUsd = usdBalanceAfter - usdBalanceBefore
          expect(sentAmountUsd).toBeLessThanOrEqual(0)
        })
      })

      describe("replenish with min-btc-for-1-cent pull back to btc wallet", () => {
        it("via invoice", async () => {
          const accountAndWallets = await newAccountAndWallets()
          const { newBtcWallet, newUsdWallet, newAccount } = accountAndWallets

          // DISCOVER ARBITRAGE AMOUNTS FOR STRATEGY
          // =====
          const midPriceRatio = await getMidPriceRatio(usdHedgeEnabled)
          if (midPriceRatio instanceof Error) throw midPriceRatio
          const startingBtcAmount = midPriceRatio.convertFromUsd(ONE_CENT)

          // Validate btc starting amount for min btc discovery
          const minBtcAmountToSpend = await getMinBtcAmountToSpend({
            startingBtcAmount: ONE_SAT,
            accountAndWallets,
            sentAmountFn: getBtcEquivalentForNoAmountInvoiceProbeAndSendToUsd,
          })
          baseLogger.info("Discovered:", { minBtcAmountToSpend })

          // Validate btc starting amount for max btc discovery
          const maxBtcAmountToEarn = await getMaxBtcAmountToEarn({
            startingBtcAmount,
            accountAndWallets,
            sentAmountFn: getUsdEquivalentForWithAmountInvoiceSendToBtc,
          })
          baseLogger.info("Discovered:", { maxBtcAmountToEarn })

          // EXECUTE ARBITRAGE
          // =====
          const btcBalanceBefore = await getBalanceHelper(newBtcWallet.id)
          const usdBalanceBefore = await getBalanceHelper(newUsdWallet.id)

          // Step 1: Pay min sats via no-amount invoice to USD wallet
          const invoice = await Wallets.addInvoiceNoAmountForSelf({
            walletId: newUsdWallet.id,
          })
          if (invoice instanceof Error) throw invoice

          const probe = await Payments.getNoAmountLightningFeeEstimationForBtcWallet({
            amount: Number(minBtcAmountToSpend.amount),
            uncheckedPaymentRequest: invoice.lnInvoice.paymentRequest,
            walletId: newBtcWallet.id,
          })
          if (probe instanceof Error) throw probe

          const paid = await Payments.payNoAmountInvoiceByWalletIdForBtcWallet({
            amount: Number(minBtcAmountToSpend.amount),
            uncheckedPaymentRequest: invoice.lnInvoice.paymentRequest,
            memo: null,
            senderWalletId: newBtcWallet.id,
            senderAccount: newAccount,
          })
          if (paid instanceof Error) throw paid

          // Step 2: Pay back $0.01 from USD to BTC wallet
          const invoiceBtc = await Wallets.addInvoiceForSelfForBtcWallet({
            walletId: newBtcWallet.id,
            amount: toSats(maxBtcAmountToEarn.amount),
          })
          if (invoiceBtc instanceof Error) throw invoiceBtc

          const repaid = await Payments.payInvoiceByWalletId({
            uncheckedPaymentRequest: invoiceBtc.lnInvoice.paymentRequest,
            memo: null,
            senderWalletId: newUsdWallet.id,
            senderAccount: newAccount,
          })
          if (repaid instanceof Error) throw repaid

          // Step 3: Check that no profit was made in the process
          const btcBalanceAfter = await getBalanceHelper(newBtcWallet.id)
          const sentAmountBtc = btcBalanceAfter - btcBalanceBefore
          expect(sentAmountBtc).toBeLessThanOrEqual(0)

          const usdBalanceAfter = await getBalanceHelper(newUsdWallet.id)
          const sentAmountUsd = usdBalanceAfter - usdBalanceBefore
          expect(sentAmountUsd).toBeLessThanOrEqual(0)
        })

        it("via fee probe", async () => {
          const accountAndWallets = await newAccountAndWallets()
          const { newBtcWallet, newUsdWallet, newAccount } = accountAndWallets

          // DISCOVER ARBITRAGE AMOUNTS FOR STRATEGY
          // =====
          const midPriceRatio = await getMidPriceRatio(usdHedgeEnabled)
          if (midPriceRatio instanceof Error) throw midPriceRatio
          const startingBtcAmount = midPriceRatio.convertFromUsd(ONE_CENT)

          // Validate btc starting amount for min btc discovery
          const minBtcAmountToSpend = await getMinBtcAmountToSpend({
            startingBtcAmount: ONE_SAT,
            accountAndWallets,
            sentAmountFn: getBtcEquivalentForNoAmountInvoiceProbeAndSendToUsd,
          })
          baseLogger.info("Discovered:", { minBtcAmountToSpend })

          // Validate btc starting amount for max btc discovery
          const maxBtcAmountToEarn = await getMaxBtcAmountToEarn({
            startingBtcAmount,
            accountAndWallets,
            sentAmountFn: getUsdEquivalentForWithAmountInvoiceProbeAndSendToBtc,
          })
          baseLogger.info("Discovered:", { maxBtcAmountToEarn })

          // EXECUTE ARBITRAGE
          // =====
          const btcBalanceBefore = await getBalanceHelper(newBtcWallet.id)
          const usdBalanceBefore = await getBalanceHelper(newUsdWallet.id)

          // Step 1: Pay min sats via no-amount invoice to USD wallet
          const invoice = await Wallets.addInvoiceNoAmountForSelf({
            walletId: newUsdWallet.id,
          })
          if (invoice instanceof Error) throw invoice

          const probe = await Payments.getNoAmountLightningFeeEstimationForBtcWallet({
            amount: Number(minBtcAmountToSpend.amount),
            uncheckedPaymentRequest: invoice.lnInvoice.paymentRequest,
            walletId: newBtcWallet.id,
          })
          if (probe instanceof Error) throw probe

          const paid = await Payments.payNoAmountInvoiceByWalletIdForBtcWallet({
            amount: Number(minBtcAmountToSpend.amount),
            uncheckedPaymentRequest: invoice.lnInvoice.paymentRequest,
            memo: null,
            senderWalletId: newBtcWallet.id,
            senderAccount: newAccount,
          })
          if (paid instanceof Error) throw paid

          // Step 2: Pay back $0.01 from USD to BTC wallet
          const invoiceBtc = await Wallets.addInvoiceForSelfForBtcWallet({
            walletId: newBtcWallet.id,
            amount: toSats(maxBtcAmountToEarn.amount),
          })
          if (invoiceBtc instanceof Error) throw invoiceBtc

          const probeUsd = await Payments.getLightningFeeEstimationForUsdWallet({
            uncheckedPaymentRequest: invoiceBtc.lnInvoice.paymentRequest,
            walletId: newUsdWallet.id,
          })
          if (probeUsd instanceof Error) throw probeUsd

          const repaid = await Payments.payInvoiceByWalletId({
            uncheckedPaymentRequest: invoiceBtc.lnInvoice.paymentRequest,
            memo: null,
            senderWalletId: newUsdWallet.id,
            senderAccount: newAccount,
          })
          if (repaid instanceof Error) throw repaid

          // Step 3: Check that no profit was made in the process
          const btcBalanceAfter = await getBalanceHelper(newBtcWallet.id)
          const sentAmountBtc = btcBalanceAfter - btcBalanceBefore
          expect(sentAmountBtc).toBeLessThanOrEqual(0)

          const usdBalanceAfter = await getBalanceHelper(newUsdWallet.id)
          const sentAmountUsd = usdBalanceAfter - usdBalanceBefore
          expect(sentAmountUsd).toBeLessThanOrEqual(0)
        })
      })
    })
  })
})
