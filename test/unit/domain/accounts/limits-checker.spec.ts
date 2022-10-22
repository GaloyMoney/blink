import { getAccountLimits } from "@config"
import { LimitsChecker } from "@domain/accounts"
import { LimitsExceededError } from "@domain/errors"
import { toCents } from "@domain/fiat"

describe("LimitsChecker", () => {
  let paymentAmount: UsdCents
  let limitsChecker: LimitsChecker
  let walletVolumeIntraledger: TxBaseVolume
  let walletVolumeWithdrawal: TxBaseVolume
  beforeAll(() => {
    const level: AccountLevel = 1
    const accountLimits = getAccountLimits({ level })

    paymentAmount = toCents(10_000)
    limitsChecker = LimitsChecker({
      accountLimits,
    })

    walletVolumeIntraledger = {
      outgoingBaseAmount: toCents(accountLimits.intraLedgerLimit - paymentAmount),
      incomingBaseAmount: toCents(0),
    }

    walletVolumeWithdrawal = {
      outgoingBaseAmount: toCents(accountLimits.withdrawalLimit - paymentAmount),
      incomingBaseAmount: toCents(0),
    }
  })

  it("passes for exact limit amount", () => {
    const intraledgerLimitCheck = limitsChecker.checkIntraledger({
      amount: paymentAmount,
      walletVolume: walletVolumeIntraledger,
    })
    expect(intraledgerLimitCheck).not.toBeInstanceOf(Error)

    const withdrawalLimitCheck = limitsChecker.checkWithdrawal({
      amount: paymentAmount,
      walletVolume: walletVolumeWithdrawal,
    })
    expect(withdrawalLimitCheck).not.toBeInstanceOf(Error)
  })

  it("passes for amount below limit", () => {
    const intraledgerLimitCheck = limitsChecker.checkIntraledger({
      amount: toCents(paymentAmount - 1),
      walletVolume: walletVolumeIntraledger,
    })
    expect(intraledgerLimitCheck).not.toBeInstanceOf(Error)

    const withdrawalLimitCheck = limitsChecker.checkWithdrawal({
      amount: toCents(paymentAmount - 1),
      walletVolume: walletVolumeWithdrawal,
    })
    expect(withdrawalLimitCheck).not.toBeInstanceOf(Error)
  })

  it("returns an error for exceeded intraledger amount", () => {
    const intraledgerLimitCheck = limitsChecker.checkIntraledger({
      amount: toCents(paymentAmount + 1),
      walletVolume: walletVolumeIntraledger,
    })
    expect(intraledgerLimitCheck).toBeInstanceOf(LimitsExceededError)
  })

  it("returns an error for exceeded withdrawal amount", () => {
    const withdrawalLimitCheck = limitsChecker.checkWithdrawal({
      amount: toCents(paymentAmount + 1),
      walletVolume: walletVolumeWithdrawal,
    })
    expect(withdrawalLimitCheck).toBeInstanceOf(LimitsExceededError)
  })
})
