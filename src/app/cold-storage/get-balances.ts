import { ColdStorageService } from "@services/cold-storage"

export const getBalance = async (
  walletName: string,
): Promise<ColdStorageBalance | ApplicationError> => {
  const coldStorageService = await ColdStorageService()
  if (coldStorageService instanceof Error) return coldStorageService
  return coldStorageService.getBalance(walletName)
}

export const listWallets = async (): Promise<string[] | ApplicationError> => {
  const coldStorageService = await ColdStorageService()
  if (coldStorageService instanceof Error) return coldStorageService
  return coldStorageService.listWallets()
}

export const getBalances = async (): Promise<ColdStorageBalance[] | ApplicationError> => {
  const coldStorageService = await ColdStorageService()
  if (coldStorageService instanceof Error) return coldStorageService
  return coldStorageService.getBalances()
}
