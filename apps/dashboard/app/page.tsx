import { getServerSession } from "next-auth"

import { authOptions } from "./api/auth/[...nextauth]/route"

import WalletBalanceContainer from "@/components/wallet-balance/wallet-balance-container"
import ContentContainer from "@/components/content-container"
import { TransactionEdge } from "@/services/graphql/generated"
import {
  fetchFirstTransactions,
  fetchPaginatedTransactions,
} from "@/services/graphql/queries/get-transactions"

export async function fetchAllTransactions({
  token,
  days,
}: {
  token: string
  days: number
}) {
  const allTransactions = []

  // fetch all transactions for last n days
  const daysAgo = Math.floor(Date.now() / 1000) - days * 24 * 60 * 60

  let response = await fetchFirstTransactions(token)
  let transactions = response?.edges || []
  let pageInfo = response?.pageInfo

  allTransactions.push(...transactions)

  let lastTransactionDate =
    transactions.length > 0 ? transactions[transactions.length - 1].node.createdAt : 0

  while (pageInfo?.hasNextPage && lastTransactionDate > daysAgo) {
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

const processTransaction = ({
  transactions,
  usdBalance,
  btcBalance,
  days,
}: {
  transactions: TransactionEdge[]
  usdBalance: number
  btcBalance: number
  days: number
}) => {
  const btcTransactions = []
  const usdTransactions = []
  const daysAgo = Math.floor(Date.now() / 1000) - days * 24 * 60 * 60

  for (const { node } of transactions) {
    if (node.createdAt < daysAgo) {
      break
    }

    if (node.settlementCurrency === "USD") {
      if (node.direction === "RECEIVE") {
        usdBalance -= node.settlementAmount
      } else if (node.direction === "SEND") {
        usdBalance += node.settlementAmount + node.settlementFee
      }

      usdTransactions.push({
        createdAt: new Date(node.createdAt * 1000).toISOString().split("T")[0],
        settlementAmount: node.settlementAmount,
        direction: node.direction,
        settlementFee: node.settlementFee,
      })
    } else if (node.settlementCurrency === "BTC") {
      if (node.direction === "RECEIVE") {
        btcBalance -= node.settlementAmount
      } else if (node.direction === "SEND") {
        btcBalance += node.settlementAmount + node.settlementFee
      }

      btcTransactions.push({
        createdAt: new Date(node.createdAt * 1000).toISOString().split("T")[0],
        settlementAmount: node.settlementAmount,
        direction: node.direction,
        settlementFee: node.settlementFee,
      })
    }
  }

  return { usdTransactions, btcTransactions, usdBalance, btcBalance }
}

export default async function Home() {
  const session = await getServerSession(authOptions)

  const token = session?.accessToken
  if (!token || typeof token !== "string") {
    throw new Error("invalid token")
  }

  const btcWallet = session.userData.data.me?.defaultAccount.wallets.find(
    (wallet) => wallet.walletCurrency === "BTC",
  )
  const usdWallet = session.userData.data.me?.defaultAccount.wallets.find(
    (wallet) => wallet.walletCurrency === "USD",
  )

  // PREPARE DATA
  const days = 30
  const response = await fetchAllTransactions({
    token,
    days,
  })
  // transaction data with balance.
  const { usdTransactions, btcTransactions } = processTransaction(
    {
      transactions: response as TransactionEdge[],
      btcBalance: btcWallet?.balance || 0,
      usdBalance: usdWallet?.balance || 0,
      days,
    },
  )

  const walletDetails = session?.userData?.data?.me?.defaultAccount?.wallets || []

  return (
    <main>
      <ContentContainer>
        <WalletBalanceContainer walletDetails={walletDetails}></WalletBalanceContainer>
      </ContentContainer>
    </main>
  )
}
