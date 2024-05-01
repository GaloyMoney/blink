import { InvalidMerchantIdError } from "./errors"

import { UuidRegex } from "@/domain/shared"

const MerchantIdRegex = UuidRegex

export const checkedToMerchantId = (
  merchantId: string,
): MerchantId | InvalidMerchantIdError => {
  if (merchantId.match(MerchantIdRegex)) {
    return merchantId as MerchantId
  }
  return new InvalidMerchantIdError(merchantId)
}
