import { once } from "events"

import { Wallets, Payments } from "@app"
import { BTC_NETWORK, getFeesConfig, getOnChainWalletConfig } from "@config"
import { sat2btc, toSats, toTargetConfs } from "@domain/bitcoin"
import { InsufficientBalanceError, LessThanDustThresholdError } from "@domain/errors"
import { toCents } from "@domain/fiat"
import { WalletCurrency } from "@domain/shared"
import { TxDecoder } from "@domain/bitcoin/onchain"
import { DealerPriceService } from "@services/dealer-price"
import * as OnChainServiceImpl from "@services/lnd/onchain-service"
import { AccountsRepository, WalletsRepository } from "@services/mongoose"
import { baseLogger } from "@services/logger"
import { getFunderWalletId } from "@services/ledger/caching"

import {
  bitcoindClient,
  bitcoindOutside,
  createUserAndWalletFromUserRef,
  getAccountByTestUserRef,
  getDefaultWalletIdByTestUserRef,
  getUsdWalletIdByTestUserRef,
  lndonchain,
  sendToAddressAndConfirm,
  subscribeToChainAddress,
  waitUntilBlockHeight,
} from "test/helpers"

const defaultAmount = toSats(5244)
const defaultUsdAmount = toCents(105)
const defaultTarget = toTargetConfs(3)
const { dustThreshold } = getOnChainWalletConfig()

let walletIdA: WalletId
let walletIdB: WalletId
let walletIdUsdA: WalletId
let accountA: Account

const dealerFns = DealerPriceService()

beforeAll(async () => {
  await bitcoindClient.loadWallet({ filename: "outside" })

  await createUserAndWalletFromUserRef("A")
  await createUserAndWalletFromUserRef("B")

  walletIdA = await getDefaultWalletIdByTestUserRef("A")
  walletIdUsdA = await getUsdWalletIdByTestUserRef("A")
  accountA = await getAccountByTestUserRef("A")
  walletIdB = await getDefaultWalletIdByTestUserRef("B")

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
  const address = await Wallets.lndCreateOnChainAddress(walletId)
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

  const updated = await Wallets.updateOnChainReceipt({ logger: baseLogger })
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
        targetConfirmations: defaultTarget,
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
      const address = await Wallets.createOnChainAddressForBtcWallet({
        walletId: walletIdB,
      })
      if (address instanceof Error) throw address
      const feeAmount = await Wallets.getOnChainFeeForBtcWallet({
        walletId: walletIdA,
        account: accountA,
        amount: defaultAmount,
        address,
        targetConfirmations: defaultTarget,
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
        targetConfirmations: defaultTarget,
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
        targetConfirmations: defaultTarget,
      })
      expect(fee).toBeInstanceOf(LessThanDustThresholdError)
      expect(fee).toHaveProperty(
        "message",
        `Use lightning to send amounts less than ${dustThreshold} sats`,
      )
    })

    it("returns error for balance too low", async () => {
      const address = (await bitcoindOutside.getNewAddress()) as OnChainAddress
      const amount = toSats(1_000_000_000)
      const fee = await Wallets.getOnChainFeeForBtcWallet({
        walletId: walletIdA,
        account: accountA,
        amount,
        address,
        targetConfirmations: defaultTarget,
      })
      expect(fee).toBeInstanceOf(InsufficientBalanceError)
      expect(fee).toHaveProperty(
        "message",
        expect.stringMatching(/Payment amount '\d+' sats exceeds balance '\d+'/),
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

          const address = (await bitcoindOutside.getNewAddress()) as OnChainAddress
          const onChainService = OnChainServiceImpl.OnChainService(TxDecoder(BTC_NETWORK))
          if (onChainService instanceof Error) throw onChainService

          const minerFee = await onChainService.getOnChainFeeEstimate({
            amount: defaultAmount,
            address,
            targetConfirmations: 1 as TargetConfirmations,
          })
          if (minerFee instanceof Error) throw minerFee

          const feeRates = getFeesConfig()
          const feeSats = toSats(feeRates.withdrawDefaultMin + minerFee)

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
            targetConfirmations: defaultTarget,
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

          const centsFeeAmount = await dealerFns.getCentsFromSatsForImmediateSell({
            amount: BigInt(feeSats),
            currency: WalletCurrency.Btc,
          })
          if (centsFeeAmount instanceof Error) throw centsFeeAmount
          const expectedFee = Number(centsFeeAmount.amount)
          expect(expectedFee).toEqual(fee)
        })

        it("returns zero for an on us address", async () => {
          const address = await Wallets.createOnChainAddressForBtcWallet({
            walletId: walletIdB,
          })
          if (address instanceof Error) throw address

          const getFeeArgs = {
            walletId: walletIdUsdA,
            account: accountA,
            address,
            targetConfirmations: defaultTarget,
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
            targetConfirmations: defaultTarget,
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
            targetConfirmations: defaultTarget,
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

        it("returns error for balance too low", async () => {
          const address = (await bitcoindOutside.getNewAddress()) as OnChainAddress
          const amount = toSats(1_000_000_000)

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
            targetConfirmations: defaultTarget,
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
          expect(fee).toBeInstanceOf(InsufficientBalanceError)
          expect(fee).toHaveProperty(
            "message",
            expect.stringMatching(/Payment amount '\d+' cents exceeds balance '\d+'/),
          )
        })
      })
    })
  })
})
