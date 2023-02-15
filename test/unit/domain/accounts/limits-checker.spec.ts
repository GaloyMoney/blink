import { getAccountLimits } from "@config"
import { AccountLimitsChecker } from "@domain/accounts"
import { LimitsExceededError } from "@domain/errors"
import { WalletPriceRatio } from "@domain/payments"
import {
  AmountCalculator,
  paymentAmountFromNumber,
  WalletCurrency,
  ZERO_CENTS,
} from "@domain/shared"

let usdPaymentAmount: UsdPaymentAmount
let limitsChecker: AccountLimitsChecker
let walletVolumeIntraledger: TxBaseVolumeAmount<WalletCurrency>
let walletVolumeWithdrawal: TxBaseVolumeAmount<WalletCurrency>
let priceRatio: WalletPriceRatio

const calc = AmountCalculator()

const ONE_CENT = { amount: 1n, currency: WalletCurrency.Usd } as UsdPaymentAmount

beforeAll(async () => {
  const priceRatioResult = WalletPriceRatio({
    usd: ONE_CENT,
    btc: { amount: 50n, currency: WalletCurrency.Btc },
  })
  if (priceRatioResult instanceof Error) throw priceRatioResult
  priceRatio = priceRatioResult

  const level: AccountLevel = 1
  const accountLimits = getAccountLimits({ level })

  usdPaymentAmount = {
    amount: 10_000n,
    currency: WalletCurrency.Usd,
  }

  limitsChecker = AccountLimitsChecker({
    accountLimits,
    priceRatio,
  })

  const intraLedgerOutgoingBaseAmount = paymentAmountFromNumber({
    amount: accountLimits.intraLedgerLimit - Number(usdPaymentAmount.amount),
    currency: WalletCurrency.Usd,
  })
  if (intraLedgerOutgoingBaseAmount instanceof Error) throw intraLedgerOutgoingBaseAmount
  walletVolumeIntraledger = {
    outgoingBaseAmount: intraLedgerOutgoingBaseAmount,
    incomingBaseAmount: ZERO_CENTS,
  }

  const withdrawalOutgoingBaseAmount = paymentAmountFromNumber({
    amount: accountLimits.withdrawalLimit - Number(usdPaymentAmount.amount),
    currency: WalletCurrency.Usd,
  })
  if (withdrawalOutgoingBaseAmount instanceof Error) throw withdrawalOutgoingBaseAmount
  walletVolumeWithdrawal = {
    outgoingBaseAmount: withdrawalOutgoingBaseAmount,
    incomingBaseAmount: ZERO_CENTS,
  }
})

describe("LimitsChecker", () => {
  it("passes for exact limit amount", async () => {
    const intraledgerLimitCheck = await limitsChecker.checkIntraledger({
      amount: usdPaymentAmount,
      walletVolumes: [walletVolumeIntraledger],
    })
    expect(intraledgerLimitCheck).not.toBeInstanceOf(Error)

    const withdrawalLimitCheck = await limitsChecker.checkWithdrawal({
      amount: usdPaymentAmount,
      walletVolumes: [walletVolumeWithdrawal],
    })
    expect(withdrawalLimitCheck).not.toBeInstanceOf(Error)
  })

  it("passes for amount below limit", async () => {
    const intraledgerLimitCheck = await limitsChecker.checkIntraledger({
      amount: calc.sub(usdPaymentAmount, ONE_CENT),
      walletVolumes: [walletVolumeIntraledger],
    })
    expect(intraledgerLimitCheck).not.toBeInstanceOf(Error)

    const withdrawalLimitCheck = await limitsChecker.checkWithdrawal({
      amount: calc.sub(usdPaymentAmount, ONE_CENT),
      walletVolumes: [walletVolumeWithdrawal],
    })
    expect(withdrawalLimitCheck).not.toBeInstanceOf(Error)
  })

  it("returns an error for exceeded intraledger amount", async () => {
    const intraledgerLimitCheck = await limitsChecker.checkIntraledger({
      amount: calc.add(usdPaymentAmount, ONE_CENT),
      walletVolumes: [walletVolumeIntraledger],
    })
    expect(intraledgerLimitCheck).toBeInstanceOf(LimitsExceededError)
  })

  it("returns an error for exceeded withdrawal amount", async () => {
    const withdrawalLimitCheck = await limitsChecker.checkWithdrawal({
      amount: calc.add(usdPaymentAmount, ONE_CENT),
      walletVolumes: [walletVolumeWithdrawal],
    })
    expect(withdrawalLimitCheck).toBeInstanceOf(LimitsExceededError)
  })
})
