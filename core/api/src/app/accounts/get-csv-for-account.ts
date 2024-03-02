import { CsvWalletsExporter } from "@/services/ledger/csv-wallet-export"
import { WalletsRepository } from "@/services/mongoose"

export const getCSVForAccount = async (
  accountId: AccountId,
): Promise<string | ApplicationError> => {
  const wallets = await WalletsRepository().listByAccountId(accountId)
  if (wallets instanceof Error) return wallets

  return CsvWalletsExporter(wallets.map((w) => w.id)).getBase64()
}
