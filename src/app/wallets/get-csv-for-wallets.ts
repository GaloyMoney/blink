import { CSVAccountExport } from "@core/csv-account-export"
import { walletPath } from "@services/ledger/accounts"

export const getCSVForWallets = async (
  walletIds: WalletId[],
): Promise<string | ApplicationError> => {
  const csv = new CSVAccountExport()
  for (const walletId of walletIds) {
    await csv.addAccount({ account: walletPath(walletId) })
  }
  return csv.getBase64()
}
