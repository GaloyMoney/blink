import { AmountCalculator, ONE_CENT, ONE_SAT, WalletCurrency } from "@domain/shared"
import { LnFees, WalletPriceRatio } from "@domain/payments"
import { MaxFeeTooLargeForRoutelessPaymentError } from "@domain/bitcoin/lightning"

const calc = AmountCalculator()

describe("LnFees", () => {
  describe("maxProtocolAndBankFee", () => {
    it("returns the maxProtocolAndBankFee", () => {
      const btcAmount = {
        amount: 10_000n,
        currency: WalletCurrency.Btc,
      }
      expect(LnFees().maxProtocolAndBankFee(btcAmount)).toEqual({
        amount: 50n,
        currency: WalletCurrency.Btc,
      })
    })

    it("correctly rounds the fee", () => {
      const btcAmount = {
        amount: 25844n,
        currency: WalletCurrency.Btc,
      }
      expect(LnFees().maxProtocolAndBankFee(btcAmount)).toEqual({
        amount: 129n,
        currency: WalletCurrency.Btc,
      })
    })

    it("handles a small amount", () => {
      const btcAmount = {
        amount: 1n,
        currency: WalletCurrency.Btc,
      }
      expect(LnFees().maxProtocolAndBankFee(btcAmount)).toEqual({
        amount: 1n,
        currency: WalletCurrency.Btc,
      })
    })
  })

  const amountsToTest = [
    // Original test case
    {
      btc: {
        amount: 4995n,
        currency: WalletCurrency.Btc,
      },
      usd: {
        amount: 100n,
        currency: WalletCurrency.Usd,
      },
    },
    // Live prod error case #1
    {
      btc: {
        amount: 871_652n,
        currency: WalletCurrency.Btc,
      },
      usd: {
        amount: 24_346n,
        currency: WalletCurrency.Usd,
      },
    },
    // Live prod error case #2 (fails in the same way as case #1, likely redundant)
    {
      btc: {
        amount: 11140n,
        currency: WalletCurrency.Btc,
      },
      usd: {
        amount: 320n,
        currency: WalletCurrency.Usd,
      },
    },
  ]
  for (const [i, { btc, usd }] of amountsToTest.entries()) {
    describe(`verifyMaxFee - case #${i + 1}`, () => {
      const priceRatio = WalletPriceRatio({ btc, usd })
      if (priceRatio instanceof Error) throw priceRatio

      const validBtcMaxFeeToVerify = LnFees().maxProtocolAndBankFee(btc)
      const validUsdMaxFeeInBtcToVerify = priceRatio.convertFromUsd(
        LnFees().maxProtocolAndBankFee(usd),
      )

      it("correctly verifies a valid Btc maxFee", () => {
        expect(
          LnFees().verifyMaxFee({
            maxFeeAmount: validBtcMaxFeeToVerify,
            btcPaymentAmount: btc,
            priceRatio,
            senderWalletCurrency: WalletCurrency.Btc,
          }),
        ).toBe(true)
      })

      it("correctly verifies a valid Usd maxFee", () => {
        expect(
          LnFees().verifyMaxFee({
            maxFeeAmount: validUsdMaxFeeInBtcToVerify,
            btcPaymentAmount: btc,
            priceRatio,
            senderWalletCurrency: WalletCurrency.Usd,
          }),
        ).toBe(true)
      })

      it("correctly verifies 1 sat Btc payment", () => {
        expect(
          LnFees().verifyMaxFee({
            maxFeeAmount: ONE_SAT,
            btcPaymentAmount: ONE_SAT,
            priceRatio,
            senderWalletCurrency: WalletCurrency.Btc,
          }),
        ).toBe(true)
      })

      it("correctly verifies 1 sat Usd payment", () => {
        expect(
          LnFees().verifyMaxFee({
            maxFeeAmount: priceRatio.convertFromUsd(ONE_CENT),
            btcPaymentAmount: ONE_SAT,
            priceRatio,
            senderWalletCurrency: WalletCurrency.Usd,
          }),
        ).toBe(true)
      })

      it("fails for a large Btc maxFee", () => {
        expect(
          LnFees().verifyMaxFee({
            maxFeeAmount: calc.add(validBtcMaxFeeToVerify, ONE_SAT),
            btcPaymentAmount: btc,
            priceRatio,
            senderWalletCurrency: WalletCurrency.Btc,
          }),
        ).toBeInstanceOf(MaxFeeTooLargeForRoutelessPaymentError)
      })

      it("fails for a large Usd maxFee", () => {
        expect(
          LnFees().verifyMaxFee({
            maxFeeAmount: calc.add(validUsdMaxFeeInBtcToVerify, ONE_SAT),
            btcPaymentAmount: btc,
            priceRatio,
            senderWalletCurrency: WalletCurrency.Usd,
          }),
        ).toBeInstanceOf(MaxFeeTooLargeForRoutelessPaymentError)
      })

      it("fails for a 1 sat large Btc maxFee", () => {
        expect(
          LnFees().verifyMaxFee({
            maxFeeAmount: calc.add(ONE_SAT, ONE_SAT),
            btcPaymentAmount: ONE_SAT,
            priceRatio,
            senderWalletCurrency: WalletCurrency.Btc,
          }),
        ).toBeInstanceOf(MaxFeeTooLargeForRoutelessPaymentError)
      })

      it("fails for a 1 sat large Usd maxFee", () => {
        expect(
          LnFees().verifyMaxFee({
            maxFeeAmount: calc.add(validUsdMaxFeeInBtcToVerify, ONE_SAT),
            btcPaymentAmount: ONE_SAT,
            priceRatio,
            senderWalletCurrency: WalletCurrency.Usd,
          }),
        ).toBeInstanceOf(MaxFeeTooLargeForRoutelessPaymentError)
      })
    })
  }

  describe("feeFromRawRoute", () => {
    it("returns the feeFromRawRoute", () => {
      const rawRoute = { total_mtokens: "21000000", safe_fee: 210 } as RawRoute
      expect(LnFees().feeFromRawRoute(rawRoute)).toEqual({
        amount: 210n,
        currency: WalletCurrency.Btc,
      })
    })
  })
})
