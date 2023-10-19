import { getServerSession } from "next-auth"

import { authOptions } from "./api/auth/[...nextauth]/route"

import PriceContainer from "@/components/price-container/price-container"
import ContentContainer from "@/components/content-container"

export default async function Home() {
  const session = await getServerSession(authOptions)
  const walletDetails = session?.userData?.data?.me?.defaultAccount?.wallets || []

  return (
    <main>
      <ContentContainer>
        <PriceContainer walletDetails={walletDetails}></PriceContainer>
      </ContentContainer>
    </main>
  )
}
