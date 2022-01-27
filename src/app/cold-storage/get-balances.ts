import { ColdStorageService } from "@services/cold-storage"

export const getBalances = async (): Promise<ColdStorageBalance[] | ApplicationError> => {
  const coldStorageService = await ColdStorageService()
  if (coldStorageService instanceof Error) return coldStorageService
  return coldStorageService.getBalances()
}
