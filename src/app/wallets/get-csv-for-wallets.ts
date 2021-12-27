import { CSVAccountExport } from "@services/ledger/csv-account-export"

export const getCSVForWallets = async (
  walletIds: WalletId[],
): Promise<string | ApplicationError> => {
  const csv = new CSVAccountExport()
  for (const walletId of walletIds) {
    await csv.addWallet(walletId)
  }
  return csv.getBase64()
}
