import { getTwoFALimits, getUserLimits } from "@config"
import { LimitsChecker } from "@domain/accounts"
import { toSats } from "@domain/bitcoin"
import { LimitsExceededError } from "@domain/errors"

describe("LimitsChecker", () => {
  let paymentAmount: Satoshis
  let limitsChecker: LimitsChecker
  let walletVolumeIntraledger: TxVolume
  let walletVolumeWithdrawal: TxVolume
  let walletVolumeTwoFA: TxVolume
  beforeAll(() => {
    const level: AccountLevel = 1
    const userLimits = getUserLimits({ level })
    const twoFALimits = getTwoFALimits()

    paymentAmount = toSats(10_000n)
    limitsChecker = LimitsChecker({
      userLimits,
      twoFALimits,
    })

    walletVolumeIntraledger = {
      outgoingSats: toSats(userLimits.onUsLimit - paymentAmount),
      incomingSats: toSats(0n),
    }

    walletVolumeWithdrawal = {
      outgoingSats: toSats(userLimits.withdrawalLimit - paymentAmount),
      incomingSats: toSats(0n),
    }

    walletVolumeTwoFA = {
      outgoingSats: toSats(twoFALimits.threshold - paymentAmount),
      incomingSats: toSats(0n),
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

    const twoFALimitCheck = limitsChecker.checkTwoFA({
      amount: paymentAmount,
      walletVolume: walletVolumeTwoFA,
    })
    expect(twoFALimitCheck).not.toBeInstanceOf(Error)
  })

  it("passes for amount below limit", () => {
    const intraledgerLimitCheck = limitsChecker.checkIntraledger({
      amount: toSats(paymentAmount - 1n),
      walletVolume: walletVolumeIntraledger,
    })
    expect(intraledgerLimitCheck).not.toBeInstanceOf(Error)

    const withdrawalLimitCheck = limitsChecker.checkWithdrawal({
      amount: toSats(paymentAmount - 1n),
      walletVolume: walletVolumeWithdrawal,
    })
    expect(withdrawalLimitCheck).not.toBeInstanceOf(Error)

    const twoFALimitCheck = limitsChecker.checkTwoFA({
      amount: toSats(paymentAmount - 1n),
      walletVolume: walletVolumeTwoFA,
    })
    expect(twoFALimitCheck).not.toBeInstanceOf(Error)
  })

  it("returns an error for exceeded intraledger amount", () => {
    const intraledgerLimitCheck = limitsChecker.checkIntraledger({
      amount: toSats(paymentAmount + 1n),
      walletVolume: walletVolumeIntraledger,
    })
    expect(intraledgerLimitCheck).toBeInstanceOf(LimitsExceededError)
  })

  it("returns an error for exceeded withdrawal amount", () => {
    const withdrawalLimitCheck = limitsChecker.checkWithdrawal({
      amount: toSats(paymentAmount + 1n),
      walletVolume: walletVolumeWithdrawal,
    })
    expect(withdrawalLimitCheck).toBeInstanceOf(LimitsExceededError)
  })

  it("returns an error for exceeded 2FA amount", () => {
    const twoFALimitCheck = limitsChecker.checkTwoFA({
      amount: toSats(paymentAmount + 1n),
      walletVolume: walletVolumeTwoFA,
    })
    expect(twoFALimitCheck).toBeInstanceOf(LimitsExceededError)
  })
})
