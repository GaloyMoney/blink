import { CsvWalletsExport } from "@services/ledger/csv-wallet-export"

export const getCSVForWallets = async (
  walletIds: WalletId[],
): Promise<string | ApplicationError> => {
  const csv = new CsvWalletsExport()
  for (const walletId of walletIds) {
    await csv.addWallet(walletId)
  }
  return csv.getBase64()
}
