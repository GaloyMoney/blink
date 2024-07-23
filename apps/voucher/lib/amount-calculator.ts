export const amountCalculator = {
  voucherAmountAfterPlatformFeesAndCommission: {
    fromPrice: ({
      voucherPrice,
      commissionPercentage,
      platformFeesInPpm,
    }: {
      voucherPrice: number
      commissionPercentage: number
      platformFeesInPpm: number
    }) => {
      const commissionAmount = voucherPrice * (commissionPercentage / 100)
      const platformFees = voucherPrice * (platformFeesInPpm / 1000000)
      const result = voucherPrice - commissionAmount - platformFees
      return Math.max(result, 0)
    },
    fromCommission: ({
      voucherAmountAfterCommission,
      platformFeesInPpm,
      voucherPrice,
    }: {
      voucherAmountAfterCommission: number
      platformFeesInPpm: number
      voucherPrice: number
    }) => {
      const platformFees = voucherPrice * (platformFeesInPpm / 1000000)
      const result = voucherAmountAfterCommission - platformFees
      return Math.max(result, 0)
    },
  },
  voucherAmountAfterCommission({
    voucherPrice,
    commissionPercentage,
  }: {
    voucherPrice: number
    commissionPercentage: number
  }): number {
    const commissionAmount = voucherPrice * (commissionPercentage / 100)
    const result = voucherPrice - commissionAmount
    return Math.max(result, 0)
  },
  platformFeesAmount({
    voucherPrice,
    platformFeesInPpm,
  }: {
    voucherPrice: number
    platformFeesInPpm: number
  }): number {
    const platformFees = voucherPrice * (platformFeesInPpm / 1000000)
    return Math.max(platformFees, 0)
  },
  profitAmount({
    voucherPrice,
    commissionPercentage,
  }: {
    voucherPrice: number
    commissionPercentage: number
  }): number {
    const voucherAmount = this.voucherAmountAfterCommission({
      voucherPrice,
      commissionPercentage,
    })
    const result = voucherPrice - voucherAmount
    return Math.max(result, 0)
  },
  voucherPrice({
    commissionPercentage,
    voucherAmount,
    platformFeesInPpm,
  }: {
    commissionPercentage: number
    voucherAmount: number
    platformFeesInPpm: number
  }) {
    const totalPercentage = commissionPercentage + platformFeesInPpm / 10000
    return voucherAmount / (1 - totalPercentage / 100)
  },
}
