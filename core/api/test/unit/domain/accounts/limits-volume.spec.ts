import { getAccountLimits } from "@/config"
import { AccountTxVolumeRemaining } from "@/domain/accounts"
import { WalletPriceRatio } from "@/domain/payments"
import {
  AmountCalculator,
  ONE_CENT,
  WalletCurrency,
  paymentAmountFromNumber,
} from "@/domain/shared"

const calc = AmountCalculator()

let volumeRemainingCalc: IAccountTxVolumeRemaining
let priceRatio: WalletPriceRatio
let accountLimits: IAccountLimits

let usdPaymentAmountRemaining: UsdPaymentAmount
let usdWalletVolumeIntraLedger: UsdPaymentAmount
let btcWalletVolumeIntraLedger: BtcPaymentAmount
let usdWalletVolumeWithdrawal: UsdPaymentAmount
let btcWalletVolumeWithdrawal: BtcPaymentAmount
let usdWalletVolumeTradeIntraAccount: UsdPaymentAmount
let btcWalletVolumeTradeIntraAccount: BtcPaymentAmount

beforeAll(() => {
  accountLimits = getAccountLimits({ level: 1 })
  volumeRemainingCalc = AccountTxVolumeRemaining(accountLimits)

  const priceRatioResult = WalletPriceRatio({
    usd: ONE_CENT,
    btc: { amount: 50n, currency: WalletCurrency.Btc },
  })
  if (priceRatioResult instanceof Error) throw priceRatioResult
  priceRatio = priceRatioResult

  usdPaymentAmountRemaining = {
    amount: 10_000n,
    currency: WalletCurrency.Usd,
  }

  const totalIntraLedgerOutgoingBaseAmount = paymentAmountFromNumber({
    amount: accountLimits.intraLedgerLimit - Number(usdPaymentAmountRemaining.amount),
    currency: WalletCurrency.Usd,
  })
  if (totalIntraLedgerOutgoingBaseAmount instanceof Error) {
    throw totalIntraLedgerOutgoingBaseAmount
  }
  usdWalletVolumeIntraLedger = calc.divRound(totalIntraLedgerOutgoingBaseAmount, 2n)
  btcWalletVolumeIntraLedger = priceRatio.convertFromUsd(
    calc.divRound(totalIntraLedgerOutgoingBaseAmount, 2n),
  )

  const totalWithdrawalOutgoingBaseAmount = paymentAmountFromNumber({
    amount: accountLimits.withdrawalLimit - Number(usdPaymentAmountRemaining.amount),
    currency: WalletCurrency.Usd,
  })
  if (totalWithdrawalOutgoingBaseAmount instanceof Error) {
    throw totalWithdrawalOutgoingBaseAmount
  }
  usdWalletVolumeWithdrawal = calc.divRound(totalWithdrawalOutgoingBaseAmount, 2n)
  btcWalletVolumeWithdrawal = priceRatio.convertFromUsd(
    calc.divRound(totalWithdrawalOutgoingBaseAmount, 2n),
  )

  const totalTradeIntraAccountOutgoingBaseAmount = paymentAmountFromNumber({
    amount:
      accountLimits.tradeIntraAccountLimit - Number(usdPaymentAmountRemaining.amount),
    currency: WalletCurrency.Usd,
  })
  if (totalTradeIntraAccountOutgoingBaseAmount instanceof Error) {
    throw totalTradeIntraAccountOutgoingBaseAmount
  }
  usdWalletVolumeTradeIntraAccount = calc.divRound(
    totalTradeIntraAccountOutgoingBaseAmount,
    2n,
  )
  btcWalletVolumeTradeIntraAccount = priceRatio.convertFromUsd(
    calc.divRound(totalTradeIntraAccountOutgoingBaseAmount, 2n),
  )
})

describe("LimitsChecker", () => {
  describe("calculates remaining volume", () => {
    it("intraLedger", async () => {
      const remaining = await volumeRemainingCalc.intraLedger({
        priceRatio,
        outWalletVolumes: [usdWalletVolumeIntraLedger, btcWalletVolumeIntraLedger],
      })
      if (remaining instanceof Error) throw remaining
      expect(remaining.amount).toEqual(usdPaymentAmountRemaining.amount)
    })

    it("withdrawal", async () => {
      const remaining = await volumeRemainingCalc.withdrawal({
        priceRatio,
        netOutWalletVolumes: [usdWalletVolumeWithdrawal, btcWalletVolumeWithdrawal],
      })
      if (remaining instanceof Error) throw remaining
      expect(remaining.amount).toEqual(usdPaymentAmountRemaining.amount)
    })

    it("tradeIntraAccount", async () => {
      const remaining = await volumeRemainingCalc.tradeIntraAccount({
        priceRatio,
        outWalletVolumes: [
          usdWalletVolumeTradeIntraAccount,
          btcWalletVolumeTradeIntraAccount,
        ],
      })
      if (remaining instanceof Error) throw remaining
      expect(remaining.amount).toEqual(usdPaymentAmountRemaining.amount)
    })
  })

  describe("returns 0n for walletVolumes above limit", () => {
    it("intraLedger", async () => {
      const remaining = await volumeRemainingCalc.intraLedger({
        priceRatio,
        outWalletVolumes: [
          {
            amount: BigInt(accountLimits.intraLedgerLimit + 1),
            currency: WalletCurrency.Usd,
          },
        ],
      })
      if (remaining instanceof Error) throw remaining
      expect(remaining.amount).toEqual(0n)
    })

    it("withdrawal", async () => {
      const remaining = await volumeRemainingCalc.withdrawal({
        priceRatio,
        netOutWalletVolumes: [
          {
            amount: BigInt(accountLimits.withdrawalLimit + 1),
            currency: WalletCurrency.Usd,
          },
        ],
      })
      if (remaining instanceof Error) throw remaining
      expect(remaining.amount).toEqual(0n)
    })

    it("tradeIntraAccount", async () => {
      const remaining = await volumeRemainingCalc.tradeIntraAccount({
        priceRatio,
        outWalletVolumes: [
          {
            amount: BigInt(accountLimits.tradeIntraAccountLimit + 1),
            currency: WalletCurrency.Usd,
          },
        ],
      })
      if (remaining instanceof Error) throw remaining
      expect(remaining.amount).toEqual(0n)
    })
  })
})
