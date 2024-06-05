export function startPrintCompanion(params: {
  lnurl: string
  voucherPrice: string
  voucherAmount: string
  voucherSecret: string
  commissionPercentage: number
}): void {
  const { lnurl, voucherPrice, voucherAmount, voucherSecret, commissionPercentage } =
    params
  window.location.href = `blink-pos-companion://print?app=voucher&lnurl=${encodeURIComponent(
    lnurl,
  )}&voucherPrice=${encodeURIComponent(voucherPrice)}&voucherAmount=${encodeURIComponent(
    voucherAmount,
  )}&voucherSecret=${encodeURIComponent(
    voucherSecret,
  )}&commissionPercentage=${encodeURIComponent(commissionPercentage)}`
}
