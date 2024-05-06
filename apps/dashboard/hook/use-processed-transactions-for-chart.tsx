import { useCallback, useMemo, useState } from "react"

import { TransactionEdge } from "@/services/graphql/generated"
import { getMinMaxBalanceAndPerWalletTransaction } from "@/lib/get-balance-for-transactions"

const useProcessedTransactionsForChart = ({
  transactions,
  currentUsdBalance,
  currentBtcBalance,
}: {
  transactions: TransactionEdge[]
  currentUsdBalance: number
  currentBtcBalance: number
}) => {
  const [loading, setLoading] = useState(true)

  const memoizedProcessTransaction = useCallback(() => {
    return getMinMaxBalanceAndPerWalletTransaction({
      transactions,
      currentUsdBalance,
      currentBtcBalance,
    })
  }, [transactions, currentUsdBalance, currentBtcBalance])

  const processedTransactions = useMemo(() => {
    setLoading(true)
    const data = memoizedProcessTransaction()
    setLoading(false)
    return data
  }, [memoizedProcessTransaction])

  return { processedTransactions, loading }
}

export default useProcessedTransactionsForChart
