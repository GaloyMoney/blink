import { getAccountLimits } from "@/config"
import { AccountTxVolumeRemaining } from "@/domain/accounts"
import { WalletPriceRatio } from "@/domain/payments"
import {
  AmountCalculator,
  ONE_CENT,
  WalletCurrency,
  ZERO_CENTS,
  ZERO_SATS,
  paymentAmountFromNumber,
} from "@/domain/shared"

const calc = AmountCalculator()

let volumeRemainingCalc: IAccountTxVolumeRemaining
let priceRatio: WalletPriceRatio
let accountLimits: IAccountLimits

let usdPaymentAmountRemaining: UsdPaymentAmount
let usdWalletVolumeIntraLedger: TxBaseVolumeAmount<"USD">
let btcWalletVolumeIntraLedger: TxBaseVolumeAmount<"BTC">
let usdWalletVolumeWithdrawal: TxBaseVolumeAmount<"USD">
let btcWalletVolumeWithdrawal: TxBaseVolumeAmount<"BTC">
let usdWalletVolumeTradeIntraAccount: TxBaseVolumeAmount<"USD">
let btcWalletVolumeTradeIntraAccount: TxBaseVolumeAmount<"BTC">

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
  usdWalletVolumeIntraLedger = {
    outgoingBaseAmount: calc.divRound(totalIntraLedgerOutgoingBaseAmount, 2n),
    incomingBaseAmount: ZERO_CENTS,
  }
  btcWalletVolumeIntraLedger = {
    outgoingBaseAmount: priceRatio.convertFromUsd(
      calc.divRound(totalIntraLedgerOutgoingBaseAmount, 2n),
    ),
    incomingBaseAmount: ZERO_SATS,
  }

  const totalWithdrawalOutgoingBaseAmount = paymentAmountFromNumber({
    amount: accountLimits.withdrawalLimit - Number(usdPaymentAmountRemaining.amount),
    currency: WalletCurrency.Usd,
  })
  if (totalWithdrawalOutgoingBaseAmount instanceof Error) {
    throw totalWithdrawalOutgoingBaseAmount
  }
  usdWalletVolumeWithdrawal = {
    outgoingBaseAmount: calc.divRound(totalWithdrawalOutgoingBaseAmount, 2n),
    incomingBaseAmount: ZERO_CENTS,
  }
  btcWalletVolumeWithdrawal = {
    outgoingBaseAmount: priceRatio.convertFromUsd(
      calc.divRound(totalWithdrawalOutgoingBaseAmount, 2n),
    ),
    incomingBaseAmount: ZERO_SATS,
  }

  const totalTradeIntraAccountOutgoingBaseAmount = paymentAmountFromNumber({
    amount:
      accountLimits.tradeIntraAccountLimit - Number(usdPaymentAmountRemaining.amount),
    currency: WalletCurrency.Usd,
  })
  if (totalTradeIntraAccountOutgoingBaseAmount instanceof Error) {
    throw totalTradeIntraAccountOutgoingBaseAmount
  }
  usdWalletVolumeTradeIntraAccount = {
    outgoingBaseAmount: calc.divRound(totalTradeIntraAccountOutgoingBaseAmount, 2n),
    incomingBaseAmount: ZERO_CENTS,
  }
  btcWalletVolumeTradeIntraAccount = {
    outgoingBaseAmount: priceRatio.convertFromUsd(
      calc.divRound(totalTradeIntraAccountOutgoingBaseAmount, 2n),
    ),
    incomingBaseAmount: ZERO_SATS,
  }
})

describe("LimitsChecker", () => {
  describe("calculates remaining volume", () => {
    it("intraLedger", async () => {
      const remaining = await volumeRemainingCalc.intraLedger({
        priceRatio,
        walletVolumes: [usdWalletVolumeIntraLedger, btcWalletVolumeIntraLedger],
      })
      if (remaining instanceof Error) throw remaining
      expect(remaining.amount).toEqual(usdPaymentAmountRemaining.amount)
    })

    it("withdrawal", async () => {
      const remaining = await volumeRemainingCalc.withdrawal({
        priceRatio,
        walletVolumes: [usdWalletVolumeWithdrawal, btcWalletVolumeWithdrawal],
      })
      if (remaining instanceof Error) throw remaining
      expect(remaining.amount).toEqual(usdPaymentAmountRemaining.amount)
    })

    it("tradeIntraAccount", async () => {
      const remaining = await volumeRemainingCalc.tradeIntraAccount({
        priceRatio,
        walletVolumes: [
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
        walletVolumes: [
          {
            ...usdWalletVolumeIntraLedger,
            outgoingBaseAmount: {
              amount: BigInt(accountLimits.intraLedgerLimit + 1),
              currency: WalletCurrency.Usd,
            },
          },
        ],
      })
      if (remaining instanceof Error) throw remaining
      expect(remaining.amount).toEqual(0n)
    })

    it("withdrawal", async () => {
      const remaining = await volumeRemainingCalc.withdrawal({
        priceRatio,
        walletVolumes: [
          {
            ...usdWalletVolumeWithdrawal,
            outgoingBaseAmount: {
              amount: BigInt(accountLimits.withdrawalLimit + 1),
              currency: WalletCurrency.Usd,
            },
          },
        ],
      })
      if (remaining instanceof Error) throw remaining
      expect(remaining.amount).toEqual(0n)
    })

    it("tradeIntraAccount", async () => {
      const remaining = await volumeRemainingCalc.tradeIntraAccount({
        priceRatio,
        walletVolumes: [
          {
            ...usdWalletVolumeWithdrawal,
            outgoingBaseAmount: {
              amount: BigInt(accountLimits.tradeIntraAccountLimit + 1),
              currency: WalletCurrency.Usd,
            },
          },
        ],
      })
      if (remaining instanceof Error) throw remaining
      expect(remaining.amount).toEqual(0n)
    })
  })
})
