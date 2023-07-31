import { once } from "events"

import { Wallets, Payments } from "@app"
import { getFeesConfig, getOnChainWalletConfig } from "@config"
import { sat2btc, toSats } from "@domain/bitcoin"
import { LessThanDustThresholdError } from "@domain/errors"
import { toCents } from "@domain/fiat"
import { WalletCurrency, paymentAmountFromNumber } from "@domain/shared"
import { PayoutSpeed } from "@domain/bitcoin/onchain"

import { NewOnChainService } from "@services/bria"
import { DealerPriceService } from "@services/dealer-price"
import { AccountsRepository, WalletsRepository } from "@services/mongoose"
import { baseLogger } from "@services/logger"
import { getFunderWalletId } from "@services/ledger/caching"

import {
  lndCreateOnChainAddress,
  bitcoindClient,
  bitcoindOutside,
  createUserAndWalletFromPhone,
  getAccountByPhone,
  getDefaultWalletIdByPhone,
  getUsdWalletIdByPhone,
  lndonchain,
  randomPhone,
  sendToAddressAndConfirm,
  subscribeToChainAddress,
  waitUntilBlockHeight,
} from "test/helpers"

const defaultAmount = toSats(5244)
const defaultUsdAmount = toCents(105)
const defaultSpeed = PayoutSpeed.Fast
const { dustThreshold } = getOnChainWalletConfig()

let walletIdA: WalletId
let walletIdB: WalletId
let walletIdUsdA: WalletId
let accountA: Account

const dealerFns = DealerPriceService()

const phoneA = randomPhone()
const phoneB = randomPhone()

beforeAll(async () => {
  await bitcoindClient.loadWallet({ filename: "outside" })

  await createUserAndWalletFromPhone(phoneA)
  await createUserAndWalletFromPhone(phoneB)

  walletIdA = await getDefaultWalletIdByPhone(phoneA)
  walletIdUsdA = await getUsdWalletIdByPhone(phoneA)
  accountA = await getAccountByPhone(phoneA)
  walletIdB = await getDefaultWalletIdByPhone(phoneB)

  // Fund walletIdA
  await sendToLndWalletTestWrapper({
    amountSats: toSats(defaultAmount * 5),
    walletId: walletIdA,
  })

  // Fund lnd
  const funderWalletId = await getFunderWalletId()
  await sendToLndWalletTestWrapper({
    amountSats: toSats(2_000_000_000),
    walletId: funderWalletId,
  })
})

afterAll(async () => {
  await bitcoindClient.unloadWallet({ walletName: "outside" })
})

const sendToLndWalletTestWrapper = async ({
  amountSats,
  walletId,
}: {
  amountSats: Satoshis
  walletId: WalletId
}) => {
  const address = await lndCreateOnChainAddress(walletId)
  if (address instanceof Error) throw address
  expect(address.substring(0, 4)).toBe("bcrt")

  const initialBlockNumber = await bitcoindClient.getBlockCount()
  const txId = await sendToAddressAndConfirm({
    walletClient: bitcoindOutside,
    address,
    amount: sat2btc(amountSats),
  })
  if (txId instanceof Error) throw txId

  // Register confirmed txn in database
  const sub = subscribeToChainAddress({
    lnd: lndonchain,
    bech32_address: address,
    min_height: initialBlockNumber,
  })
  await once(sub, "confirmation")
  sub.removeAllListeners()

  await waitUntilBlockHeight({ lnd: lndonchain })

  const updated = await Wallets.updateLegacyOnChainReceipt({ logger: baseLogger })
  if (updated instanceof Error) throw updated

  return txId as OnChainTxHash
}

describe("UserWallet - getOnchainFee", () => {
  describe("from btc wallet", () => {
    it("returns a fee greater than zero for an external address", async () => {
      const address = (await bitcoindOutside.getNewAddress()) as OnChainAddress
      const feeAmount = await Wallets.getOnChainFeeForBtcWallet({
        walletId: walletIdA,
        account: accountA,
        amount: defaultAmount,
        address,
        speed: defaultSpeed,
      })
      if (feeAmount instanceof Error) throw feeAmount
      expect(feeAmount.currency).toBe(WalletCurrency.Btc)
      const fee = Number(feeAmount.amount)
      expect(fee).toBeGreaterThan(0)

      const wallet = await WalletsRepository().findById(walletIdA)
      if (wallet instanceof Error) throw wallet

      const account = await AccountsRepository().findById(wallet.accountId)
      if (account instanceof Error) throw account

      expect(fee).toBeGreaterThan(account.withdrawFee)
    })

    it("returns zero for an on us address", async () => {
      const address = await Wallets.createOnChainAddress({
        walletId: walletIdB,
      })
      if (address instanceof Error) throw address
      const feeAmount = await Wallets.getOnChainFeeForBtcWallet({
        walletId: walletIdA,
        account: accountA,
        amount: defaultAmount,
        address,
        speed: defaultSpeed,
      })
      if (feeAmount instanceof Error) throw feeAmount
      const fee = Number(feeAmount.amount)
      expect(fee).toBe(0)
    })

    it("returns error for dust amount", async () => {
      const address = (await bitcoindOutside.getNewAddress()) as OnChainAddress
      const amount = toSats(dustThreshold - 1)
      const fee = await Wallets.getOnChainFeeForBtcWallet({
        walletId: walletIdA,
        account: accountA,
        amount,
        address,
        speed: defaultSpeed,
      })
      expect(fee).toBeInstanceOf(LessThanDustThresholdError)
      expect(fee).toHaveProperty(
        "message",
        `Use lightning to send amounts less than ${dustThreshold} sats`,
      )
    })

    it("returns error for minimum amount", async () => {
      const address = (await bitcoindOutside.getNewAddress()) as OnChainAddress
      const amount = toSats(1)
      const fee = await Wallets.getOnChainFeeForBtcWallet({
        walletId: walletIdA,
        account: accountA,
        amount,
        address,
        speed: defaultSpeed,
      })
      expect(fee).toBeInstanceOf(LessThanDustThresholdError)
      expect(fee).toHaveProperty(
        "message",
        `Use lightning to send amounts less than ${dustThreshold} sats`,
      )
    })
  })

  describe("from usd wallet", () => {
    const amountCases = [
      { amountCurrency: WalletCurrency.Usd, senderAmount: defaultUsdAmount },
      { amountCurrency: WalletCurrency.Btc, senderAmount: defaultAmount },
    ]
    const testAmountCaseAmounts = async (
      convert: (
        amount: UsdPaymentAmount,
      ) => Promise<BtcPaymentAmount | DealerPriceServiceError>,
    ) => {
      const usdAmount = amountCases.filter(
        (testCase) => testCase.amountCurrency === WalletCurrency.Usd,
      )[0].senderAmount

      const convertedBtcFromUsdAmount = await convert({
        amount: BigInt(usdAmount),
        currency: WalletCurrency.Usd,
      })
      if (convertedBtcFromUsdAmount instanceof Error) throw convertedBtcFromUsdAmount

      expect(defaultAmount).toEqual(Number(convertedBtcFromUsdAmount.amount))
    }

    amountCases.forEach(({ amountCurrency, senderAmount }) => {
      describe(`${amountCurrency.toLowerCase()} send amount`, () => {
        it("returns a fee greater than zero for an external address", async () => {
          await testAmountCaseAmounts(dealerFns.getSatsFromCentsForImmediateSell)

          const onChainService = NewOnChainService()

          const address = (await bitcoindOutside.getNewAddress()) as OnChainAddress

          const paymentAmount = paymentAmountFromNumber({
            amount: defaultAmount,
            currency: WalletCurrency.Btc,
          })
          if (paymentAmount instanceof Error) throw paymentAmount

          const minerFee = await onChainService.estimateFeeForPayout({
            amount: paymentAmount,
            address,
            speed: PayoutSpeed.Fast,
          })
          if (minerFee instanceof Error) throw minerFee

          const feeRates = getFeesConfig()
          const feeSats = toSats(feeRates.withdrawDefaultMin + Number(minerFee.amount))

          // Fund empty USD wallet
          const payResult = await Payments.intraledgerPaymentSendWalletIdForBtcWallet({
            recipientWalletId: walletIdUsdA,
            memo: "",
            amount: defaultAmount + feeSats,
            senderWalletId: walletIdA,
            senderAccount: accountA,
          })
          if (payResult instanceof Error) throw payResult

          const getFeeArgs = {
            walletId: walletIdUsdA,
            account: accountA,
            address,
            speed: defaultSpeed,
            amount: senderAmount,
          }
          const feeAmount =
            amountCurrency === WalletCurrency.Usd
              ? await Wallets.getOnChainFeeForUsdWallet(getFeeArgs)
              : await Wallets.getOnChainFeeForUsdWalletAndBtcAmount(getFeeArgs)
          if (feeAmount instanceof Error) throw feeAmount
          expect(feeAmount.currency).toBe(WalletCurrency.Usd)
          const fee = Number(feeAmount.amount)
          expect(fee).toBeGreaterThan(0)

          const wallet = await WalletsRepository().findById(walletIdUsdA)
          if (wallet instanceof Error) throw wallet

          const account = await AccountsRepository().findById(wallet.accountId)
          if (account instanceof Error) throw account

          const usdAmount = await dealerFns.getCentsFromSatsForImmediateSell({
            amount: BigInt(account.withdrawFee),
            currency: WalletCurrency.Btc,
          })
          if (usdAmount instanceof Error) throw usdAmount
          const withdrawFeeAsUsd = Number(usdAmount.amount)
          expect(fee).toBeGreaterThan(withdrawFeeAsUsd)
        })

        it("returns zero for an on us address", async () => {
          const address = await Wallets.createOnChainAddress({
            walletId: walletIdB,
          })
          if (address instanceof Error) throw address

          const getFeeArgs = {
            walletId: walletIdUsdA,
            account: accountA,
            address,
            speed: defaultSpeed,
            amount: senderAmount,
          }
          const feeAmount =
            amountCurrency === WalletCurrency.Usd
              ? await Wallets.getOnChainFeeForUsdWallet(getFeeArgs)
              : await Wallets.getOnChainFeeForUsdWalletAndBtcAmount(getFeeArgs)
          if (feeAmount instanceof Error) throw feeAmount
          const fee = Number(feeAmount.amount)
          expect(fee).toBe(0)
        })

        it("returns error for dust amount", async () => {
          const address = (await bitcoindOutside.getNewAddress()) as OnChainAddress
          const amount = toSats(dustThreshold - 1)

          const usdAmount = await dealerFns.getCentsFromSatsForImmediateBuy({
            amount: BigInt(amount),
            currency: WalletCurrency.Btc,
          })
          if (usdAmount instanceof Error) throw usdAmount
          const amountInUsd = Number(usdAmount.amount)

          const getFeeArgsPartial = {
            walletId: walletIdUsdA,
            account: accountA,
            address,
            speed: defaultSpeed,
          }
          const fee =
            amountCurrency === WalletCurrency.Usd
              ? await Wallets.getOnChainFeeForUsdWallet({
                  ...getFeeArgsPartial,
                  amount: amountInUsd,
                })
              : await Wallets.getOnChainFeeForUsdWalletAndBtcAmount({
                  ...getFeeArgsPartial,
                  amount,
                })
          expect(fee).toBeInstanceOf(LessThanDustThresholdError)
          expect(fee).toHaveProperty(
            "message",
            `Use lightning to send amounts less than ${dustThreshold} sats`,
          )
        })

        it("returns error for minimum amount", async () => {
          const address = (await bitcoindOutside.getNewAddress()) as OnChainAddress

          const getFeeArgsPartial = {
            walletId: walletIdUsdA,
            account: accountA,
            address,
            speed: defaultSpeed,
          }
          const fee =
            amountCurrency === WalletCurrency.Usd
              ? await Wallets.getOnChainFeeForUsdWallet({
                  ...getFeeArgsPartial,
                  amount: toCents(1),
                })
              : await Wallets.getOnChainFeeForUsdWalletAndBtcAmount({
                  ...getFeeArgsPartial,
                  amount: toSats(1),
                })
          expect(fee).toBeInstanceOf(LessThanDustThresholdError)
          expect(fee).toHaveProperty(
            "message",
            `Use lightning to send amounts less than ${dustThreshold} sats`,
          )
        })
      })
    })
  })
})
