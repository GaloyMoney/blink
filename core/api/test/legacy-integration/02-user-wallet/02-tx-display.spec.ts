import { Wallets } from "@/app"
import { getCurrentPriceAsDisplayPriceRatio } from "@/app/prices"

import { sat2btc, toSats } from "@/domain/bitcoin"
import { paymentAmountFromNumber, WalletCurrency } from "@/domain/shared"
import { displayAmountFromNumber } from "@/domain/fiat"

import { updateDisplayCurrency } from "@/app/accounts"

import { BriaPayloadType } from "@/services/bria"
import { AccountsRepository } from "@/services/mongoose"

import {
  utxoDetectedEventHandler,
  utxoSettledEventHandler,
} from "@/servers/event-handlers/bria"

import {
  bitcoindClient,
  bitcoindOutside,
  createUserAndWalletFromPhone,
  getAccountByPhone,
  getDefaultWalletIdByPhone,
  getPendingTransactionsForWalletId,
  onceBriaSubscribe,
  RANDOM_ADDRESS,
  randomPhone,
} from "test/helpers"

let accountB: Account
let accountC: Account

let walletIdB: WalletId

const phoneB = randomPhone()
const phoneC = randomPhone()

beforeAll(async () => {
  await createUserAndWalletFromPhone(phoneB)
  await createUserAndWalletFromPhone(phoneC)

  accountB = await getAccountByPhone(phoneB)
  accountC = await getAccountByPhone(phoneC)

  walletIdB = await getDefaultWalletIdByPhone(phoneB)

  await bitcoindClient.loadWallet({ filename: "outside" })

  // Update account display currencies
  const updatedAccountB = await updateDisplayCurrency({
    accountId: accountB.id,
    currency: "EUR",
  })
  if (updatedAccountB instanceof Error) throw updatedAccountB

  const updatedAccountC = await updateDisplayCurrency({
    accountId: accountC.id,
    currency: "CRC",
  })
  if (updatedAccountC instanceof Error) throw updatedAccountC

  const accountBRaw = await AccountsRepository().findById(accountB.id)
  if (accountBRaw instanceof Error) throw accountBRaw
  accountB = accountBRaw
  if (accountB.displayCurrency !== "EUR") {
    throw new Error("Error changing display currency for accountB")
  }

  const accountCRaw = await AccountsRepository().findById(accountC.id)
  if (accountCRaw instanceof Error) throw accountCRaw
  accountC = accountCRaw
  if (accountC.displayCurrency !== "CRC") {
    throw new Error("Error changing display currency for accountC")
  }
})

afterAll(async () => {
  await bitcoindClient.unloadWallet({ walletName: "outside" })
})

describe("Display properties on transactions", () => {
  const getDisplayAmounts = async ({
    satsAmount,
    satsFee,
  }: {
    satsAmount: Satoshis
    satsFee: Satoshis
  }) => {
    const currencies = ["EUR" as DisplayCurrency, "CRC" as DisplayCurrency]

    const btcAmount = paymentAmountFromNumber({
      amount: satsAmount,
      currency: WalletCurrency.Btc,
    })
    if (btcAmount instanceof Error) throw btcAmount
    const btcFee = paymentAmountFromNumber({
      amount: satsFee,
      currency: WalletCurrency.Btc,
    })
    if (btcFee instanceof Error) throw btcFee

    const result: Record<
      string,
      {
        displayAmount: DisplayCurrencyBaseAmount
        displayFee: DisplayCurrencyBaseAmount
        displayCurrency: DisplayCurrency
      }
    > = {}
    for (const currency of currencies) {
      const displayPriceRatio = await getCurrentPriceAsDisplayPriceRatio({
        currency,
      })
      if (displayPriceRatio instanceof Error) throw displayPriceRatio

      const displayAmount = displayPriceRatio.convertFromWallet(btcAmount)
      if (satsAmount > 0 && displayAmount.amountInMinor === 0n) {
        displayAmount.amountInMinor = 1n
      }

      const displayFee = displayPriceRatio.convertFromWalletToCeil(btcFee)

      result[currency] = {
        displayAmount: Number(displayAmount.amountInMinor) as DisplayCurrencyBaseAmount,
        displayFee: Number(displayFee.amountInMinor) as DisplayCurrencyBaseAmount,
        displayCurrency: currency,
      }
    }

    return result
  }

  describe("onchain", () => {
    describe("receive", () => {
      it("(Pending, no metadata) identifies unconfirmed incoming on-chain transactions", async () => {
        const amountSats = toSats(20_000)

        const recipientWalletId = walletIdB

        // Execute receive
        const address = await Wallets.createOnChainAddress({
          walletId: recipientWalletId,
        })
        if (address instanceof Error) throw address

        const txId = (await bitcoindOutside.sendToAddress({
          address,
          amount: sat2btc(amountSats),
        })) as OnChainTxHash

        const detectedEvent = await onceBriaSubscribe({
          type: BriaPayloadType.UtxoDetected,
          txId,
        })
        if (detectedEvent?.payload.type !== BriaPayloadType.UtxoDetected) {
          throw new Error(`Expected ${BriaPayloadType.UtxoDetected} event`)
        }
        const resultPending = await utxoDetectedEventHandler({
          event: detectedEvent.payload,
        })
        if (resultPending instanceof Error) {
          throw resultPending
        }

        // Check entries
        const pendingTxs = await getPendingTransactionsForWalletId(recipientWalletId)
        if (pendingTxs instanceof Error) throw pendingTxs

        expect(pendingTxs.length).toBe(1)
        const recipientTxn = pendingTxs[0]

        const { EUR: expectedRecipientDisplayProps } = await getDisplayAmounts({
          satsAmount: toSats(recipientTxn.settlementAmount),
          satsFee: toSats(recipientTxn.settlementFee),
        })

        const settlementDisplayAmountObj = displayAmountFromNumber({
          amount: expectedRecipientDisplayProps.displayAmount,
          currency: expectedRecipientDisplayProps.displayCurrency,
        })
        if (settlementDisplayAmountObj instanceof Error) throw settlementDisplayAmountObj

        const settlementDisplayFeeObj = displayAmountFromNumber({
          amount: expectedRecipientDisplayProps.displayFee,
          currency: expectedRecipientDisplayProps.displayCurrency,
        })
        if (settlementDisplayFeeObj instanceof Error) throw settlementDisplayFeeObj

        const expectedRecipientWalletTxnDisplayProps = {
          settlementDisplayAmount: settlementDisplayAmountObj.displayInMajor,
          settlementDisplayFee: settlementDisplayFeeObj.displayInMajor,
        }

        expect(recipientTxn).toEqual(
          expect.objectContaining(expectedRecipientWalletTxnDisplayProps),
        )
        expect(recipientTxn.settlementDisplayPrice).toEqual(
          expect.objectContaining({
            displayCurrency: expectedRecipientDisplayProps.displayCurrency,
          }),
        )

        // Settle pending
        await bitcoindOutside.generateToAddress({ nblocks: 3, address: RANDOM_ADDRESS })

        const settledEvent = await onceBriaSubscribe({
          type: BriaPayloadType.UtxoSettled,
          txId,
        })
        if (settledEvent?.payload.type !== BriaPayloadType.UtxoSettled) {
          throw new Error(`Expected ${BriaPayloadType.UtxoSettled} event`)
        }
        const resultSettled = await utxoSettledEventHandler({
          event: settledEvent.payload,
        })
        if (resultSettled instanceof Error) {
          throw resultSettled
        }
      })
    })
  })
})
