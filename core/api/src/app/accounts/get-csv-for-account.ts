import { CsvWalletsExport } from "@/services/ledger/csv-wallet-export"
import { WalletsRepository } from "@/services/mongoose"

export const getCSVForAccount = async (
  accountUuid: AccountUuid,
): Promise<string | ApplicationError> => {
  const wallets = await WalletsRepository().listByAccountUuid(accountUuid)
  if (wallets instanceof Error) return wallets

  const csv = new CsvWalletsExport()
  for (const wallet of wallets) {
    await csv.addWallet(wallet.id)
  }
  return csv.getBase64()
}
