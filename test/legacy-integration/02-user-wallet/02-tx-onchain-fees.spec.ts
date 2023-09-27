import { once } from "events"

import { Wallets } from "@app"
import { getOnChainWalletConfig } from "@config"
import { sat2btc, toSats } from "@domain/bitcoin"
import { LessThanDustThresholdError } from "@domain/errors"
import { toCents } from "@domain/fiat"
import { WalletCurrency } from "@domain/shared"
import { PayoutSpeed } from "@domain/bitcoin/onchain"

import { DealerPriceService } from "@services/dealer-price"
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

  // Fund walletIdA
  await sendToLndWalletTestWrapper({
    amountSats: toSats(defaultAmount * 5),
    walletId: walletIdA,
  })

  // Fund walletIdUsdA
  await sendToLndWalletTestWrapper({
    amountSats: toSats(defaultAmount * 5),
    walletId: walletIdUsdA,
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

    amountCases.forEach(({ amountCurrency }) => {
      describe(`${amountCurrency.toLowerCase()} send amount`, () => {
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
