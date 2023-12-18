import { getAccountLimits } from "@/config"
import { AccountTxVolumeLimitChecker } from "@/domain/accounts"
import {
  IntraledgerLimitsExceededError,
  TradeIntraAccountLimitsExceededError,
  WithdrawalLimitsExceededError,
} from "@/domain/errors"
import { AmountCalculator, WalletCurrency } from "@/domain/shared"

let usdPaymentAmount: UsdPaymentAmount
let accountLimits: IAccountLimits

const calc = AmountCalculator()

const ONE_CENT = { amount: 1n, currency: WalletCurrency.Usd } as UsdPaymentAmount

beforeAll(async () => {
  accountLimits = getAccountLimits({ level: 1 })

  usdPaymentAmount = {
    amount: 10_000n,
    currency: WalletCurrency.Usd,
  }
})

describe("LimitsChecker", () => {
  it("passes for exact limit amount", async () => {
    const intraledgerLimitCheck = await AccountTxVolumeLimitChecker(
      accountLimits,
    ).checkIntraledger({
      amount: usdPaymentAmount,
      volumeRemaining: usdPaymentAmount,
    })
    expect(intraledgerLimitCheck).not.toBeInstanceOf(Error)

    const withdrawalLimitCheck = await AccountTxVolumeLimitChecker(
      accountLimits,
    ).checkWithdrawal({
      amount: usdPaymentAmount,
      volumeRemaining: usdPaymentAmount,
    })
    expect(withdrawalLimitCheck).not.toBeInstanceOf(Error)

    const tradeIntraAccountLimitCheck = await AccountTxVolumeLimitChecker(
      accountLimits,
    ).checkTradeIntraAccount({
      amount: usdPaymentAmount,
      volumeRemaining: usdPaymentAmount,
    })
    expect(tradeIntraAccountLimitCheck).not.toBeInstanceOf(Error)
  })

  it("passes for amount below limit", async () => {
    const intraledgerLimitCheck = await AccountTxVolumeLimitChecker(
      accountLimits,
    ).checkIntraledger({
      amount: calc.sub(usdPaymentAmount, ONE_CENT),
      volumeRemaining: usdPaymentAmount,
    })
    expect(intraledgerLimitCheck).not.toBeInstanceOf(Error)

    const withdrawalLimitCheck = await AccountTxVolumeLimitChecker(
      accountLimits,
    ).checkWithdrawal({
      amount: calc.sub(usdPaymentAmount, ONE_CENT),
      volumeRemaining: usdPaymentAmount,
    })
    expect(withdrawalLimitCheck).not.toBeInstanceOf(Error)

    const tradeIntraAccountLimitCheck = await AccountTxVolumeLimitChecker(
      accountLimits,
    ).checkTradeIntraAccount({
      amount: calc.sub(usdPaymentAmount, ONE_CENT),
      volumeRemaining: usdPaymentAmount,
    })
    expect(tradeIntraAccountLimitCheck).not.toBeInstanceOf(Error)
  })

  it("returns an error for exceeded intraledger amount", async () => {
    const intraledgerLimitCheck = await AccountTxVolumeLimitChecker(
      accountLimits,
    ).checkIntraledger({
      amount: calc.add(usdPaymentAmount, ONE_CENT),
      volumeRemaining: usdPaymentAmount,
    })
    expect(intraledgerLimitCheck).toBeInstanceOf(IntraledgerLimitsExceededError)
  })

  it("returns an error for exceeded withdrawal amount", async () => {
    const withdrawalLimitCheck = await AccountTxVolumeLimitChecker(
      accountLimits,
    ).checkWithdrawal({
      amount: calc.add(usdPaymentAmount, ONE_CENT),
      volumeRemaining: usdPaymentAmount,
    })
    expect(withdrawalLimitCheck).toBeInstanceOf(WithdrawalLimitsExceededError)
  })

  it("returns an error for exceeded trade-intra-account amount", async () => {
    const tradeIntraAccountLimitCheck = await AccountTxVolumeLimitChecker(
      accountLimits,
    ).checkTradeIntraAccount({
      amount: calc.add(usdPaymentAmount, ONE_CENT),
      volumeRemaining: usdPaymentAmount,
    })
    expect(tradeIntraAccountLimitCheck).toBeInstanceOf(
      TradeIntraAccountLimitsExceededError,
    )
  })
})
