export function startPrintCompanion(params: {
  lnurl: string
  voucherPrice: string
  voucherAmount: string
  voucherSecret: string
}): void {
  const { lnurl, voucherPrice, voucherAmount, voucherSecret } = params
  window.location.href = `blink-pos-companion://print?app=voucher&lnurl=${encodeURIComponent(
    lnurl,
  )}&voucherPrice=${encodeURIComponent(voucherPrice)}&voucherAmount=${encodeURIComponent(
    voucherAmount,
  )}&voucherSecret=${encodeURIComponent(voucherSecret)}`
}
