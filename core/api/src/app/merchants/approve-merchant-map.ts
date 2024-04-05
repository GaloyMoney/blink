import { MerchantsRepository } from "@/services/mongoose"

export const approveMerchantById = async (
  id: MerchantId,
): Promise<BusinessMapMarker | ApplicationError> => {
  const merchantsRepo = MerchantsRepository()

  const merchant = await merchantsRepo.findById(id)
  if (merchant instanceof Error) return merchant

  merchant.validated = true
  return merchantsRepo.update(merchant)
}
