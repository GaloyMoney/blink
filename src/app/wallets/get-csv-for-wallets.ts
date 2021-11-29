import { CSVAccountExport } from "@core/csv-account-export"
import { toLiabilitiesAccountId } from "@domain/ledger"

export const getCSVForWallets = async (
  walletIds: WalletId[],
): Promise<string | ApplicationError> => {
  const csv = new CSVAccountExport()
  for (const walletId of walletIds) {
    await csv.addAccount({ account: toLiabilitiesAccountId(walletId) })
  }
  return csv.getBase64()
}
