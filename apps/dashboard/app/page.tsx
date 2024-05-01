import { getServerSession } from "next-auth"

import { authOptions } from "./api/auth/[...nextauth]/route"

import WalletBalanceContainer from "@/components/wallet-balance/wallet-balance-container"
import ContentContainer from "@/components/content-container"

export default async function Home() {
  const session = await getServerSession(authOptions)
  const walletDetails = session?.userData?.data?.me?.defaultAccount?.wallets || []

  return (
    <main>
      <ContentContainer>
        <WalletBalanceContainer walletDetails={walletDetails}></WalletBalanceContainer>
      </ContentContainer>
    </main>
  )
}
