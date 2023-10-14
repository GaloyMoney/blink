import { NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";

import { authOptions } from "./api/auth/[...nextauth]/route";

import PriceContainer from "@/components/price-container/price-container";
import ContentContainer from "@/components/content-container";

export default async function Home(req: NextRequest) {
  const session = await getServerSession(authOptions);
  const isAuthed = session?.sub ?? false;
  if (!isAuthed) {
    redirect("/api/auth/signin");
  }

  const accountDetails = session.userData.data.me.defaultAccount.wallets;
  const defaultAccountId = session.userData.data.me.defaultAccount.id;

  return (
    <main>
      {isAuthed && (
        <ContentContainer>
          <PriceContainer
            defaultAccountId={defaultAccountId}
            accountDetails={accountDetails}
          ></PriceContainer>
        </ContentContainer>
      )}
    </main>
  );
}
