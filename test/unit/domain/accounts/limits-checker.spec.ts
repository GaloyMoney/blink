import { getTwoFALimits, getUserLimits } from "@config/app"
import { LimitsChecker } from "@domain/accounts"
import { toSats } from "@domain/bitcoin"
import { LimitsExceededError } from "@domain/errors"

describe("LimitsChecker", () => {
  let intraledgerLimitsChecker: LimitsChecker
  let withdrawalLimitsChecker: LimitsChecker
  let twoFALimitsChecker: LimitsChecker
  let paymentAmount: Satoshis
  beforeAll(() => {
    const level: AccountLevel = 1
    const userLimits = getUserLimits({ level })
    const twoFALimits = getTwoFALimits()

    paymentAmount = toSats(10_000)
    const walletVolumeIntraledger: TxVolume = {
      outgoingSats: toSats(userLimits.onUsLimit - paymentAmount),
      incomingSats: toSats(0),
    }
    intraledgerLimitsChecker = LimitsChecker({
      walletVolume: walletVolumeIntraledger,
      userLimits,
      twoFALimits,
    })

    const walletVolumeWithdrawal = {
      outgoingSats: toSats(userLimits.withdrawalLimit - paymentAmount),
      incomingSats: toSats(0),
    }
    withdrawalLimitsChecker = LimitsChecker({
      walletVolume: walletVolumeWithdrawal,
      userLimits,
      twoFALimits,
    })

    const walletVolumeTwoFA = {
      outgoingSats: toSats(twoFALimits.threshold - paymentAmount),
      incomingSats: toSats(0),
    }
    twoFALimitsChecker = LimitsChecker({
      walletVolume: walletVolumeTwoFA,
      userLimits,
      twoFALimits,
    })
  })

  it("passes for exact limit amount", () => {
    const intraledgerLimitCheck = intraledgerLimitsChecker.checkIntraledger({
      pendingAmount: paymentAmount,
    })
    expect(intraledgerLimitCheck).not.toBeInstanceOf(Error)

    const withdrawalLimitCheck = withdrawalLimitsChecker.checkWithdrawal({
      pendingAmount: paymentAmount,
    })
    expect(withdrawalLimitCheck).not.toBeInstanceOf(Error)

    const twoFALimitCheck = twoFALimitsChecker.checkTwoFA({
      pendingAmount: paymentAmount,
    })
    expect(twoFALimitCheck).not.toBeInstanceOf(Error)
  })

  it("passes for amount below limit", () => {
    const intraledgerLimitCheck = intraledgerLimitsChecker.checkIntraledger({
      pendingAmount: toSats(paymentAmount - 1),
    })
    expect(intraledgerLimitCheck).not.toBeInstanceOf(Error)

    const withdrawalLimitCheck = withdrawalLimitsChecker.checkWithdrawal({
      pendingAmount: toSats(paymentAmount - 1),
    })
    expect(withdrawalLimitCheck).not.toBeInstanceOf(Error)

    const twoFALimitCheck = twoFALimitsChecker.checkTwoFA({
      pendingAmount: toSats(paymentAmount - 1),
    })
    expect(twoFALimitCheck).not.toBeInstanceOf(Error)
  })

  it("returns an error for exceeded intraledger amount", () => {
    const intraledgerLimitCheck = intraledgerLimitsChecker.checkIntraledger({
      pendingAmount: toSats(paymentAmount + 1),
    })
    expect(intraledgerLimitCheck).toBeInstanceOf(LimitsExceededError)
  })

  it("returns an error for exceeded withdrawal amount", () => {
    const withdrawalLimitCheck = withdrawalLimitsChecker.checkWithdrawal({
      pendingAmount: toSats(paymentAmount + 1),
    })
    expect(withdrawalLimitCheck).toBeInstanceOf(LimitsExceededError)
  })

  it("returns an error for exceeded 2FA amount", () => {
    const twoFALimitCheck = twoFALimitsChecker.checkTwoFA({
      pendingAmount: toSats(paymentAmount + 1),
    })
    expect(twoFALimitCheck).toBeInstanceOf(LimitsExceededError)
  })
})
