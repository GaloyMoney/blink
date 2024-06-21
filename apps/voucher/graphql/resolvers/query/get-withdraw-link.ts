import { getWithdrawLinkBySecret } from "@/services/db"
import { isValidVoucherSecret } from "@/utils/helpers"

export const getWithdrawLink = async (_: undefined, args: { voucherSecret: string }) => {
  const { voucherSecret } = args
  if (!isValidVoucherSecret(voucherSecret)) {
    return new Error("Invalid voucher secret")
  }
  const res = await getWithdrawLinkBySecret({ voucherSecret })
  return res
}
