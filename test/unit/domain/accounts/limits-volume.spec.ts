import { getAccountLimits } from "@config"
import { AccountTxVolumeRemaining } from "@domain/accounts"
import { WalletPriceRatio } from "@domain/payments"
import {
  ONE_CENT,
  WalletCurrency,
  ZERO_CENTS,
  paymentAmountFromNumber,
} from "@domain/shared"

let volumeRemainingCalc: IAccountTxVolumeRemaining
let priceRatio: WalletPriceRatio
let accountLimits: IAccountLimits

let usdPaymentAmountRemaining: UsdPaymentAmount
let walletVolumeIntraLedger: TxBaseVolumeAmount<WalletCurrency>
let walletVolumeWithdrawal: TxBaseVolumeAmount<WalletCurrency>
let walletVolumeTradeIntraAccount: TxBaseVolumeAmount<WalletCurrency>

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

  const intraLedgerOutgoingBaseAmount = paymentAmountFromNumber({
    amount: accountLimits.intraLedgerLimit - Number(usdPaymentAmountRemaining.amount),
    currency: WalletCurrency.Usd,
  })
  if (intraLedgerOutgoingBaseAmount instanceof Error) throw intraLedgerOutgoingBaseAmount
  walletVolumeIntraLedger = {
    outgoingBaseAmount: intraLedgerOutgoingBaseAmount,
    incomingBaseAmount: ZERO_CENTS,
  }

  const withdrawalOutgoingBaseAmount = paymentAmountFromNumber({
    amount: accountLimits.withdrawalLimit - Number(usdPaymentAmountRemaining.amount),
    currency: WalletCurrency.Usd,
  })
  if (withdrawalOutgoingBaseAmount instanceof Error) throw withdrawalOutgoingBaseAmount
  walletVolumeWithdrawal = {
    outgoingBaseAmount: withdrawalOutgoingBaseAmount,
    incomingBaseAmount: ZERO_CENTS,
  }

  const tradeIntraAccountOutgoingBaseAmount = paymentAmountFromNumber({
    amount:
      accountLimits.tradeIntraAccountLimit - Number(usdPaymentAmountRemaining.amount),
    currency: WalletCurrency.Usd,
  })
  if (tradeIntraAccountOutgoingBaseAmount instanceof Error) {
    throw tradeIntraAccountOutgoingBaseAmount
  }
  walletVolumeTradeIntraAccount = {
    outgoingBaseAmount: tradeIntraAccountOutgoingBaseAmount,
    incomingBaseAmount: ZERO_CENTS,
  }
})

describe("LimitsChecker", () => {
  describe("calculates remaining volume", () => {
    it("intraLedger", async () => {
      const remaining = await volumeRemainingCalc.intraLedger({
        priceRatio,
        walletVolumes: [walletVolumeIntraLedger],
      })
      if (remaining instanceof Error) throw remaining
      expect(remaining.amount).toEqual(usdPaymentAmountRemaining.amount)
    })

    it("withdrawal", async () => {
      const remaining = await volumeRemainingCalc.withdrawal({
        priceRatio,
        walletVolumes: [walletVolumeWithdrawal],
      })
      if (remaining instanceof Error) throw remaining
      expect(remaining.amount).toEqual(usdPaymentAmountRemaining.amount)
    })

    it("tradeIntraAccount", async () => {
      const remaining = await volumeRemainingCalc.tradeIntraAccount({
        priceRatio,
        walletVolumes: [walletVolumeTradeIntraAccount],
      })
      if (remaining instanceof Error) throw remaining
      expect(remaining.amount).toEqual(usdPaymentAmountRemaining.amount)
    })
  })

  describe.skip("returns 0n for walletVolumes above limit", () => {
    it("intraLedger", async () => {
      const remaining = await volumeRemainingCalc.intraLedger({
        priceRatio,
        walletVolumes: [
          {
            ...walletVolumeIntraLedger,
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
            ...walletVolumeWithdrawal,
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
            ...walletVolumeWithdrawal,
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
