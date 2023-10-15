import { NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "./api/auth/[...nextauth]/route";
import PriceContainer from "@/components/price-container/price-container";
import ContentContainer from "@/components/content-container";

export default async function Home(req: NextRequest) {
  const session = await getServerSession(authOptions);

  const walletDetails = session.userData.data.me.defaultAccount.wallets;
  const defaultAccountId = session.userData.data.me.defaultAccount.id;

  return (
    <main>
        <ContentContainer>
          <PriceContainer
            defaultAccountId={defaultAccountId}
            walletDetails={walletDetails}
          ></PriceContainer>
        </ContentContainer>
    </main>
  );
}
