import { TransactionEdge } from "@/services/graphql/generated"
import { Balance } from "@mui/icons-material"

const processTransaction = ({
  transactions,
  currentUsdBalance,
  currentBtcBalance,
  days,
}: {
  transactions: TransactionEdge[]
  currentUsdBalance: number
  currentBtcBalance: number
  days: number
}) => {
  let usdBalance = currentUsdBalance
  let btcBalance = currentBtcBalance
  console.log("usdBalance", usdBalance)
  console.log("btcBalance", btcBalance)

  const btcTransactions = []
  const usdTransactions = []

  const daysAgo = Math.floor(Date.now() / 1000) - days * 24 * 60 * 60

  for (const { node } of transactions) {
    if (node.createdAt < daysAgo) {
      break
    }

    if (node.settlementCurrency === "USD") {
      usdTransactions.push({
        createdAt: new Date(node.createdAt * 1000)
          .toISOString()
          .replace("T", " ")
          .substring(0, 19),

        settlementAmount: node.settlementAmount,
        direction: node.direction,
        settlementFee: node.settlementFee,
        balance: usdBalance,
      })

      if (node.direction === "RECEIVE") {
        usdBalance -= Math.abs(node.settlementAmount)
      } else if (node.direction === "SEND") {
        usdBalance += Math.abs(node.settlementAmount) + node.settlementFee
      }
    } else if (node.settlementCurrency === "BTC") {
      btcTransactions.push({
        createdAt: new Date(node.createdAt * 1000)
          .toISOString()
          .replace("T", " ")
          .substring(0, 19),

        settlementAmount: node.settlementAmount,
        direction: node.direction,
        settlementFee: node.settlementFee,
        balance: btcBalance,
      })
      if (node.direction === "RECEIVE") {
        btcBalance -= Math.abs(node.settlementAmount)
      } else if (node.direction === "SEND") {
        btcBalance += Math.abs(node.settlementAmount) + node.settlementFee
      }
    }
  }

  return { usdTransactions, btcTransactions, usdBalance, btcBalance }
}

export default processTransaction

