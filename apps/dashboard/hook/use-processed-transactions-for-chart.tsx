import { useCallback, useMemo } from "react"

import { TransactionEdge } from "@/services/graphql/generated"
import { getBalanceForTransactions } from "@/lib/get-balance-for-transactions"

const useProcessedTransactionsForChart = ({
  transactions,
  currentUsdBalance,
  currentBtcBalance,
}: {
  transactions: TransactionEdge[]
  currentUsdBalance: number
  currentBtcBalance: number
}) => {
  const memoizedProcessTransaction = useCallback(() => {
    return getBalanceForTransactions({
      transactions,
      currentUsdBalance,
      currentBtcBalance,
    })
  }, [transactions, currentUsdBalance, currentBtcBalance])

  return useMemo(() => memoizedProcessTransaction(), [memoizedProcessTransaction])
}

export default useProcessedTransactionsForChart
