import { PriceRatio } from "@domain/payments"
import { AmountCalculator, BtcPaymentAmount, WalletCurrency } from "@domain/shared"

import { WalletAddressReceiver } from "@domain/wallet-on-chain-addresses/wallet-address-receiver"

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
  const feeBtc = BtcPaymentAmount(200n)
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

    it("returns correct amounts", async () => {
      const walletAddressAmounts = await WalletAddressReceiver({
        walletAddress: btcWalletAddress,
        receivedBtc,
        feeBtc,
        usdFromBtcMidPrice,
        usdFromBtc,
      })

      if (walletAddressAmounts instanceof Error) throw walletAddressAmounts

      const receivedUsd = await usdFromBtcMidPrice(receivedBtc)
      if (receivedUsd instanceof Error) throw receivedUsd

      const priceRatio = PriceRatio({ usd: receivedUsd, btc: receivedBtc })
      if (priceRatio instanceof Error) throw priceRatio
      const feeUsd = priceRatio.convertFromBtcToCeil(feeBtc)

      expect(walletAddressAmounts).toEqual(
        expect.objectContaining({
          usdBankFee: feeUsd,
          btcBankFee: feeBtc,
          usdToCreditReceiver: calc.sub(receivedUsd, feeUsd),
          btcToCreditReceiver: calc.sub(receivedBtc, feeBtc),
        }),
      )
    })
  })

  describe("for usd wallet", () => {
    const usdWalletAddress: WalletAddress<"USD"> = {
      address: "usdAddress" as OnChainAddress,
      recipientWalletDescriptor: recipientUsdWallet,
    }

    it("returns correct amounts", async () => {
      const walletAddressAmounts = await WalletAddressReceiver({
        walletAddress: usdWalletAddress,
        receivedBtc,
        feeBtc,
        usdFromBtcMidPrice,
        usdFromBtc,
      })

      if (walletAddressAmounts instanceof Error) throw walletAddressAmounts

      const receivedUsd = await usdFromBtc(receivedBtc)
      if (receivedUsd instanceof Error) throw receivedUsd

      const priceRatio = PriceRatio({ usd: receivedUsd, btc: receivedBtc })
      if (priceRatio instanceof Error) throw priceRatio
      const feeUsd = priceRatio.convertFromBtcToCeil(feeBtc)

      expect(walletAddressAmounts).toEqual(
        expect.objectContaining({
          usdBankFee: feeUsd,
          btcBankFee: feeBtc,
          usdToCreditReceiver: calc.sub(receivedUsd, feeUsd),
          btcToCreditReceiver: calc.sub(receivedBtc, feeBtc),
        }),
      )
    })
  })
})
