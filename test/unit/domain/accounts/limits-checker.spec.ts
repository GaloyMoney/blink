import { getAccountLimits } from "@config"
import {
  checkIntraledger,
  checkTradeIntraAccount,
  checkWithdrawal,
} from "@domain/accounts"
import {
  IntraledgerLimitsExceededError,
  TradeIntraAccountLimitsExceededError,
  WithdrawalLimitsExceededError,
} from "@domain/errors"
import { WalletPriceRatio } from "@domain/payments"
import {
  AmountCalculator,
  paymentAmountFromNumber,
  WalletCurrency,
  ZERO_CENTS,
} from "@domain/shared"

let usdPaymentAmount: UsdPaymentAmount
let priceRatio: WalletPriceRatio
let accountLimits: IAccountLimits
let walletVolumeIntraledger: TxBaseVolumeAmount<WalletCurrency>
let walletVolumeWithdrawal: TxBaseVolumeAmount<WalletCurrency>
let walletVolumeTradeIntraAccount: TxBaseVolumeAmount<WalletCurrency>

const calc = AmountCalculator()

const ONE_CENT = { amount: 1n, currency: WalletCurrency.Usd } as UsdPaymentAmount

beforeAll(async () => {
  const priceRatioResult = WalletPriceRatio({
    usd: ONE_CENT,
    btc: { amount: 50n, currency: WalletCurrency.Btc },
  })
  if (priceRatioResult instanceof Error) throw priceRatioResult
  priceRatio = priceRatioResult

  accountLimits = getAccountLimits({ level: 1 })

  usdPaymentAmount = {
    amount: 10_000n,
    currency: WalletCurrency.Usd,
  }

  const intraLedgerOutgoingBaseAmount = paymentAmountFromNumber({
    amount: accountLimits.intraLedgerLimit - Number(usdPaymentAmount.amount),
    currency: WalletCurrency.Usd,
  })
  if (intraLedgerOutgoingBaseAmount instanceof Error) {
    throw intraLedgerOutgoingBaseAmount
  }
  walletVolumeIntraledger = {
    outgoingBaseAmount: intraLedgerOutgoingBaseAmount,
    incomingBaseAmount: ZERO_CENTS,
  }

  const withdrawalOutgoingBaseAmount = paymentAmountFromNumber({
    amount: accountLimits.withdrawalLimit - Number(usdPaymentAmount.amount),
    currency: WalletCurrency.Usd,
  })
  if (withdrawalOutgoingBaseAmount instanceof Error) {
    throw withdrawalOutgoingBaseAmount
  }
  walletVolumeWithdrawal = {
    outgoingBaseAmount: withdrawalOutgoingBaseAmount,
    incomingBaseAmount: ZERO_CENTS,
  }

  const tradeIntraAccountOutgoingBaseAmount = paymentAmountFromNumber({
    amount: accountLimits.tradeIntraAccountLimit - Number(usdPaymentAmount.amount),
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
  it("passes for exact limit amount", async () => {
    const intraledgerLimitCheck = await checkIntraledger({
      accountLimits,
      priceRatio,
      amount: usdPaymentAmount,
      walletVolumes: [walletVolumeIntraledger],
    })
    expect(intraledgerLimitCheck).not.toBeInstanceOf(Error)

    const withdrawalLimitCheck = await checkWithdrawal({
      accountLimits,
      priceRatio,
      amount: usdPaymentAmount,
      walletVolumes: [walletVolumeWithdrawal],
    })
    expect(withdrawalLimitCheck).not.toBeInstanceOf(Error)

    const tradeIntraAccountLimitCheck = await checkTradeIntraAccount({
      accountLimits,
      priceRatio,
      amount: usdPaymentAmount,
      walletVolumes: [walletVolumeTradeIntraAccount],
    })
    expect(tradeIntraAccountLimitCheck).not.toBeInstanceOf(Error)
  })

  it("passes for amount below limit", async () => {
    const intraledgerLimitCheck = await checkIntraledger({
      accountLimits,
      priceRatio,
      amount: calc.sub(usdPaymentAmount, ONE_CENT),
      walletVolumes: [walletVolumeIntraledger],
    })
    expect(intraledgerLimitCheck).not.toBeInstanceOf(Error)

    const withdrawalLimitCheck = await checkWithdrawal({
      accountLimits,
      priceRatio,
      amount: calc.sub(usdPaymentAmount, ONE_CENT),
      walletVolumes: [walletVolumeWithdrawal],
    })
    expect(withdrawalLimitCheck).not.toBeInstanceOf(Error)

    const tradeIntraAccountLimitCheck = await checkTradeIntraAccount({
      accountLimits,
      priceRatio,
      amount: calc.sub(usdPaymentAmount, ONE_CENT),
      walletVolumes: [walletVolumeTradeIntraAccount],
    })
    expect(tradeIntraAccountLimitCheck).not.toBeInstanceOf(Error)
  })

  it("returns an error for exceeded intraledger amount", async () => {
    const intraledgerLimitCheck = await checkIntraledger({
      accountLimits,
      priceRatio,
      amount: calc.add(usdPaymentAmount, ONE_CENT),
      walletVolumes: [walletVolumeIntraledger],
    })
    expect(intraledgerLimitCheck).toBeInstanceOf(IntraledgerLimitsExceededError)
  })

  it("returns an error for exceeded withdrawal amount", async () => {
    const withdrawalLimitCheck = await checkWithdrawal({
      accountLimits,
      priceRatio,
      amount: calc.add(usdPaymentAmount, ONE_CENT),
      walletVolumes: [walletVolumeWithdrawal],
    })
    expect(withdrawalLimitCheck).toBeInstanceOf(WithdrawalLimitsExceededError)
  })

  it("returns an error for exceeded trade-intra-account amount", async () => {
    const tradeIntraAccountLimitCheck = await checkTradeIntraAccount({
      accountLimits,
      priceRatio,
      amount: calc.add(usdPaymentAmount, ONE_CENT),
      walletVolumes: [walletVolumeTradeIntraAccount],
    })
    expect(tradeIntraAccountLimitCheck).toBeInstanceOf(
      TradeIntraAccountLimitsExceededError,
    )
  })
})
