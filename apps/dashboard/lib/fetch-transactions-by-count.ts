import { TransactionEdge } from "@/services/graphql/generated"
import {
  fetchFirstTransactions,
  fetchPaginatedTransactions,
} from "@/services/graphql/queries/get-transactions"

export async function fetchTransactionsByCount({ maxCount }: { maxCount: number }) {
  if (maxCount <= 0) {
    return []
  }

  const allTransactions: TransactionEdge[] = []
  let response = await fetchFirstTransactions()
  let transactions = response?.edges || []
  let pageInfo = response?.pageInfo

  if (transactions.length >= maxCount) {
    return transactions.slice(0, maxCount)
  }

  allTransactions.push(...transactions)

  let transactionCount = transactions.length

  while (pageInfo?.hasNextPage && transactionCount < maxCount) {
    const nextCursor = pageInfo.endCursor
    response = await fetchPaginatedTransactions({
      direction: "next",
      cursor: nextCursor,
    })
    transactions = response?.edges || []
    pageInfo = response?.pageInfo

    if (transactionCount + transactions.length > maxCount) {
      allTransactions.push(...transactions.slice(0, maxCount - transactionCount))
      break
    }

    allTransactions.push(...transactions)
    transactionCount += transactions.length
  }

  return allTransactions
}
