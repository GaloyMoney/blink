import { CSVAccountExport } from "@core/csv-account-export"
import { accountPath } from "@services/ledger/accounts"

export const getCSVForWallets = async (
  walletIds: WalletId[],
): Promise<string | ApplicationError> => {
  const csv = new CSVAccountExport()
  for (const walletId of walletIds) {
    await csv.addAccount({ account: accountPath(walletId) })
  }
  return csv.getBase64()
}
