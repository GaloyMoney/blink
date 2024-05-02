import { TransactionEdge } from "@/services/graphql/generated"
import { ProcessedTransaction } from "./index.types"
import { formatDateTime, formatMonth } from "@/app/utils"

export const getBalanceForTransactions = ({
  transactions,
  currentUsdBalance,
  currentBtcBalance,
}: {
  transactions: TransactionEdge[]
  currentUsdBalance: number
  currentBtcBalance: number
}): {
  usdTransactions: ProcessedTransaction[]
  btcTransactions: ProcessedTransaction[]
  minBalance: { usd: number; btc: number }
  maxBalance: { usd: number; btc: number }
} => {
  let usdBalance = currentUsdBalance
  let btcBalance = currentBtcBalance

  const minBalance = {
    usd: currentUsdBalance,
    btc: currentBtcBalance,
  }
  const maxBalance = {
    usd: currentUsdBalance,
    btc: currentBtcBalance,
  }

  const btcTransactions: ProcessedTransaction[] = []
  const usdTransactions: ProcessedTransaction[] = []

  for (const { node } of transactions) {
    if (node.settlementCurrency === "USD") {
      minBalance.usd = Math.min(minBalance.usd, usdBalance)
      maxBalance.usd = Math.max(maxBalance.usd, usdBalance)

      usdTransactions.push({
        balance: usdBalance,
        date: formatMonth(node.createdAt),
        dateTime: formatDateTime(node.createdAt),
      })

      if (node.direction === "RECEIVE") {
        usdBalance -= Math.abs(node.settlementAmount)
      } else if (node.direction === "SEND") {
        usdBalance += Math.abs(node.settlementAmount) + node.settlementFee
      }
    } else if (node.settlementCurrency === "BTC") {
      minBalance.btc = Math.min(minBalance.btc, btcBalance)
      maxBalance.btc = Math.max(maxBalance.btc, btcBalance)

      btcTransactions.push({
        balance: btcBalance,
        date: formatMonth(node.createdAt),
        dateTime: formatDateTime(node.createdAt),
      })

      if (node.direction === "RECEIVE") {
        btcBalance -= Math.abs(node.settlementAmount)
      } else if (node.direction === "SEND") {
        btcBalance += Math.abs(node.settlementAmount) + node.settlementFee
      }
    }
  }

  return { usdTransactions, btcTransactions, minBalance, maxBalance }
}
