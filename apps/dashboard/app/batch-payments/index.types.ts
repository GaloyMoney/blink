import { WalletCurrency } from "@/services/graphql/generated"

export type ProcessedRecords = {
  username: string
  recipientWalletId: string
  currency: AmountCurrency
  amount: number
  sendingWallet: WalletCurrency
  memo?: string
  status: {
    failed: boolean
    message: string | null
  }
}

export enum AmountCurrency {
  USD = "USD",
  SATS = "SATS",
}

export type CSVRecord = {
  username: string
  amount: string
  currency: AmountCurrency
  wallet: WalletCurrency
  memo?: string
}

export type TotalPayingAmountForWallets = {
  wallets: {
    btcWallet: {
      SATS: number
      USD: number
    }
    usdWallet: {
      USD: 0
    }
  }
}
