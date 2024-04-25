import { getServerSession } from "next-auth"

import { authOptions } from "./api/auth/[...nextauth]/route"

import WalletBalanceContainer from "@/components/wallet-balance/wallet-balance-container"
import ContentContainer from "@/components/content-container"
import { TransactionEdge } from "@/services/graphql/generated"
import { fetchAllTransactions } from "@/lib/get-all-transactions"
import processTransaction from "@/lib/get-balance-for-transactions"
import TransactionChart from "@/components/chart"

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
  const { usdTransactions, btcTransactions } = processTransaction({
    transactions: response as TransactionEdge[],
    currentBtcBalance: btcWallet?.balance || 0,
    currentUsdBalance: usdWallet?.balance || 0,
    days,
  })

  const walletDetails = session?.userData?.data?.me?.defaultAccount?.wallets || []

  console.log("usdTransactions", usdTransactions.reverse())
  console.log("btcTransactions", btcTransactions)

  return (
    <main>
      <ContentContainer>
        <WalletBalanceContainer walletDetails={walletDetails}></WalletBalanceContainer>
        <TransactionChart
          usdTransactions={usdTransactions}
          btcTransactions={btcTransactions}
        ></TransactionChart>
      </ContentContainer>
    </main>
  )
}
