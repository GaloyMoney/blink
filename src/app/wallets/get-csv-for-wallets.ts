import { CSVAccountExport } from "@core/csv-account-export"

export const getCSVForWallets = async (
  walletIds: WalletId[],
): Promise<string | ApplicationError> => {
  const csv = new CSVAccountExport()
  for (const walletId of walletIds) {
    await csv.addWallet({ wallet: walletId })
  }
  return csv.getBase64()
}
