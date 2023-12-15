import { AmountLessThanFeeError } from "@/domain/errors"
import { WalletPriceRatio } from "@/domain/payments"
import { AmountCalculator, BtcPaymentAmount, WalletCurrency } from "@/domain/shared"

import { WalletAddressReceiver } from "@/domain/wallet-on-chain/wallet-address-receiver"

const calc = AmountCalculator()

describe("WalletAddressReceiver", () => {
  const midPriceRatio = 2n
  const usdFromBtcMidPrice = async (amount: BtcPaymentAmount) => {
    return Promise.resolve({
      amount: amount.amount * midPriceRatio,
      currency: WalletCurrency.Usd,
    })
  }

  const immediatePriceRatio = 3n
  const usdFromBtc = async (amount: BtcPaymentAmount) => {
    return Promise.resolve({
      amount: amount.amount * immediatePriceRatio,
      currency: WalletCurrency.Usd,
    })
  }

  const receivedBtc = BtcPaymentAmount(1200n)
  const satsFee = BtcPaymentAmount(200n)
  const recipientBtcWallet = {
    id: "recipientWalletId" as WalletId,
    currency: WalletCurrency.Btc,
    accountId: "recipientAccountId" as AccountId,
  }
  const recipientUsdWallet = {
    id: "recipientWalletId" as WalletId,
    currency: WalletCurrency.Usd,
    accountId: "recipientAccountId" as AccountId,
  }

  describe("for btc wallet", () => {
    const btcWalletAddress: WalletAddress<"BTC"> = {
      address: "btcAddress" as OnChainAddress,
      recipientWalletDescriptor: recipientBtcWallet,
    }

    it("fails when receiveBtc is less than fee", async () => {
      const walletAddressAmounts = await WalletAddressReceiver({
        walletAddress: btcWalletAddress,
        receivedBtc,
        satsFee: BtcPaymentAmount(receivedBtc.amount + 1n),
        usdFromBtcMidPrice,
        usdFromBtc,
      })

      expect(walletAddressAmounts).toBeInstanceOf(AmountLessThanFeeError)
    })

    it("returns correct amounts", async () => {
      const walletAddressAmounts = await WalletAddressReceiver({
        walletAddress: btcWalletAddress,
        receivedBtc,
        satsFee,
        usdFromBtcMidPrice,
        usdFromBtc,
      })

      if (walletAddressAmounts instanceof Error) throw walletAddressAmounts

      const receivedUsd = await usdFromBtcMidPrice(receivedBtc)
      if (receivedUsd instanceof Error) throw receivedUsd

      const priceRatio = WalletPriceRatio({ usd: receivedUsd, btc: receivedBtc })
      if (priceRatio instanceof Error) throw priceRatio
      const centsFee = priceRatio.convertFromBtcToCeil(satsFee)

      expect(walletAddressAmounts).toEqual(
        expect.objectContaining({
          usdBankFee: centsFee,
          btcBankFee: satsFee,
          usdToCreditReceiver: calc.sub(receivedUsd, centsFee),
          btcToCreditReceiver: calc.sub(receivedBtc, satsFee),
        }),
      )
    })
  })

  describe("for usd wallet", () => {
    const usdWalletAddress: WalletAddress<"USD"> = {
      address: "usdAddress" as OnChainAddress,
      recipientWalletDescriptor: recipientUsdWallet,
    }

    it("fails when receiveBtc is less than fee", async () => {
      const walletAddressAmounts = await WalletAddressReceiver({
        walletAddress: usdWalletAddress,
        receivedBtc,
        satsFee: BtcPaymentAmount(receivedBtc.amount + 1n),
        usdFromBtcMidPrice,
        usdFromBtc,
      })

      expect(walletAddressAmounts).toBeInstanceOf(AmountLessThanFeeError)
    })

    it("returns correct amounts", async () => {
      const walletAddressAmounts = await WalletAddressReceiver({
        walletAddress: usdWalletAddress,
        receivedBtc,
        satsFee,
        usdFromBtcMidPrice,
        usdFromBtc,
      })

      if (walletAddressAmounts instanceof Error) throw walletAddressAmounts

      const receivedUsd = await usdFromBtc(receivedBtc)
      if (receivedUsd instanceof Error) throw receivedUsd

      const priceRatio = WalletPriceRatio({ usd: receivedUsd, btc: receivedBtc })
      if (priceRatio instanceof Error) throw priceRatio
      const centsFee = priceRatio.convertFromBtcToCeil(satsFee)

      expect(walletAddressAmounts).toEqual(
        expect.objectContaining({
          usdBankFee: centsFee,
          btcBankFee: satsFee,
          usdToCreditReceiver: calc.sub(receivedUsd, centsFee),
          btcToCreditReceiver: calc.sub(receivedBtc, satsFee),
        }),
      )
    })
  })
})
