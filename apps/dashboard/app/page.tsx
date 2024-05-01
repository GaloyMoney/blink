import { getServerSession } from "next-auth"

import { Box } from "@mui/joy"

import { authOptions } from "./api/auth/[...nextauth]/route"

import WalletBalanceContainer from "@/components/wallet-balance/wallet-balance-container"
import ContentContainer from "@/components/content-container"
import { fetchTransactionsByCount } from "@/lib/fetch-transactions-by-count"
import TransactionChart from "@/components/chart"

const MAXIMUM_TRANSACTIONS = 500

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

  const response = await fetchTransactionsByCount({
    maxCount: MAXIMUM_TRANSACTIONS,
  })

  const walletDetails = session?.userData?.data?.me?.defaultAccount?.wallets || []

  return (
    <main>
      <ContentContainer>
        <Box
          sx={{
            maxWidth: "90em",
            width: "100%",
            margin: "0 auto",
          }}
        >
          <WalletBalanceContainer walletDetails={walletDetails}></WalletBalanceContainer>
          <TransactionChart
            currentBtcBalance={btcWallet?.balance || 0}
            currentUsdBalance={usdWallet?.balance || 0}
            transactions={response}
          />
        </Box>
      </ContentContainer>
    </main>
  )
}
