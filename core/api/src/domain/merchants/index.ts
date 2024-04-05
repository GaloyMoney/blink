import { InvalidMerchantIdError } from "./errors"

import { UUIDV4 } from "@/utils/uuid"

const MerchantIdRegex = UUIDV4

export const checkedToMerchantId = (
  merchantId: string,
): MerchantId | InvalidMerchantIdError => {
  if (merchantId.match(MerchantIdRegex)) {
    return merchantId as MerchantId
  }
  return new InvalidMerchantIdError(merchantId)
}
