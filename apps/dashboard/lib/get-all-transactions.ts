import {
  fetchFirstTransactions,
  fetchPaginatedTransactions,
} from "@/services/graphql/queries/get-transactions"

export async function fetchAllTransactions({
  token,
  days,
}: {
  token: string
  days?: number
}) {
  const allTransactions = []

  let daysAgo
  if (days) {
    daysAgo = Math.floor(Date.now() / 1000) - days * 24 * 60 * 60
  }

  let response = await fetchFirstTransactions(token)
  let transactions = response?.edges || []
  let pageInfo = response?.pageInfo

  allTransactions.push(...transactions)

  let lastTransactionDate =
    transactions.length > 0 ? transactions[transactions.length - 1].node.createdAt : 0

  while (pageInfo?.hasNextPage && (!days || (daysAgo && lastTransactionDate > daysAgo))) {
    const nextCursor = pageInfo.endCursor
    response = await fetchPaginatedTransactions(token, "next", nextCursor)
    transactions = response?.edges || []
    pageInfo = response?.pageInfo
    allTransactions.push(...transactions)

    lastTransactionDate =
      transactions.length > 0 ? transactions[transactions.length - 1].node.createdAt : 0
  }

  return allTransactions
}
