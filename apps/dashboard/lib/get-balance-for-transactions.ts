import { TransactionEdge } from "@/services/graphql/generated"
import { ProcessedTransaction } from "./index.types"

const processTransaction = ({
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
    usd: Number((currentUsdBalance / 100).toFixed(2)),
    btc: currentBtcBalance,
  }
  const maxBalance = {
    usd: Number((currentUsdBalance / 100).toFixed(2)),
    btc: currentBtcBalance,
  }

  const btcTransactions: ProcessedTransaction[] = []
  const usdTransactions: ProcessedTransaction[] = []

  // for now commented this as we are not restricting transaction by date.
  // const daysAgo = Math.floor(Date.now() / 1000) - days * 24 * 60 * 60

  for (const { node } of transactions) {
    // if (node.createdAt < daysAgo) {
    //   break
    // }

    if (node.settlementCurrency === "USD") {
      minBalance.usd = Math.min(minBalance.usd, Number((usdBalance / 100).toFixed(2)))
      maxBalance.usd = Math.max(maxBalance.usd, Number((usdBalance / 100).toFixed(2)))

      usdTransactions.push({
        createdAt: new Date(node.createdAt * 1000)
          .toISOString()
          .replace("T", " ")
          .substring(0, 19),

        balance: Number((usdBalance / 100).toFixed(2)),
        date: new Date(node.createdAt).toLocaleDateString("en-US", {
          month: "short",
          day: "2-digit",
        }),
        dateTime: new Date(node.createdAt).toLocaleString("en-US", {
          month: "long",
          day: "numeric",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
        }),
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
        createdAt: new Date(node.createdAt * 1000)
          .toISOString()
          .replace("T", " ")
          .substring(0, 19),

        balance: btcBalance,
        date: new Date(node.createdAt).toLocaleDateString("en-US", {
          month: "short",
          day: "2-digit",
        }),
        dateTime: new Date(node.createdAt).toLocaleString("en-US", {
          month: "long",
          day: "numeric",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
        }),
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

export default processTransaction
