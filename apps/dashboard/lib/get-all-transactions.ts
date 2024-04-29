import { TransactionEdge } from "@/services/graphql/generated"
import {
  fetchFirstTransactions,
  fetchPaginatedTransactions,
} from "@/services/graphql/queries/get-transactions"

export async function fetchAllTransactionsByCount({
  token,
  fetchCount,
}: {
  token: string
  fetchCount: number
}) {
  const allTransactions: TransactionEdge[] = []
  let response = await fetchFirstTransactions(token)
  let transactions = response?.edges || []
  let pageInfo = response?.pageInfo

  allTransactions.push(...transactions)

  let currentFetchCount = 1

  while (pageInfo?.hasNextPage && currentFetchCount < fetchCount) {
    const nextCursor = pageInfo.endCursor
    response = await fetchPaginatedTransactions(token, "next", nextCursor)
    transactions = response?.edges || []
    pageInfo = response?.pageInfo
    allTransactions.push(...transactions)

    currentFetchCount++
  }

  return allTransactions
}
