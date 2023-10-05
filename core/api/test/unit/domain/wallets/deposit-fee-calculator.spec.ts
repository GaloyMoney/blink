import { DepositFeeCalculator } from "@/domain/wallets"
import { WalletCurrency, ZERO_SATS } from "@/domain/shared"

describe("DepositFeeCalculator", () => {
  const calculator = DepositFeeCalculator()

  const onChainFeeConfig = {
    ratio: 30n as DepositFeeRatioAsBasisPoints,
    minBankFee: {
      amount: 3000n,
      currency: WalletCurrency.Btc,
    },
    minBankFeeThreshold: {
      amount: 1_000_000n,
      currency: WalletCurrency.Btc,
    },
  }

  describe("onChainDepositFee", () => {
    it("applies a depositFeeRatio", () => {
      const amount = {
        amount: 10_000_000n,
        currency: WalletCurrency.Btc,
      }
      const config = { ...onChainFeeConfig, ratio: 200n as DepositFeeRatioAsBasisPoints }
      const fee = calculator.onChainDepositFee({ ...config, amount })
      expect(fee).toEqual({ amount: 200000n, currency: WalletCurrency.Btc })
    })

    it("applies a depositFeeRatio of 0", () => {
      let amount = {
        amount: 1_000_001n,
        currency: WalletCurrency.Btc,
      }
      const config = { ...onChainFeeConfig, ratio: 0n as DepositFeeRatioAsBasisPoints }
      let fee = calculator.onChainDepositFee({ ...config, amount })
      expect(fee).toEqual(ZERO_SATS)

      amount = {
        amount: 999_999n,
        currency: WalletCurrency.Btc,
      }
      fee = calculator.onChainDepositFee({ ...config, amount })
      expect(fee).toEqual({ amount: 3000n, currency: WalletCurrency.Btc })
    })

    it("applies a min fee", () => {
      const amount = {
        amount: 9999n,
        currency: WalletCurrency.Btc,
      }
      const config = {
        ...onChainFeeConfig,
        minBankFeeThreshold: {
          amount: 10_000n,
          currency: WalletCurrency.Btc,
        },
      }
      const fee = calculator.onChainDepositFee({ ...config, amount })
      expect(fee).toEqual({ amount: 3000n, currency: WalletCurrency.Btc })
    })
  })

  describe("lnDepositFee", () => {
    it("is free", () => {
      const fee = calculator.lnDepositFee()
      expect(fee).toEqual(ZERO_SATS)
    })
  })
})
