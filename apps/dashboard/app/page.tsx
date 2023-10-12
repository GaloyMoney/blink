import { NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "./api/auth/[...nextauth]/route";
import { apollo } from "../services/graphql";
import Link from "next/link";
import PriceContainer from "@/components/price-container/price-container";
import { Container } from "@mui/material";

export default async function Home(req: NextRequest) {
  const session = await getServerSession(authOptions);
  const isAuthed = session?.sub ?? false;
  if (!isAuthed) {
    return (
      <>
        <p>not logged in</p>
        <a href="/api/auth/signin">Sign in</a>
      </>
    );
  }

  const AccountDetails = session.userData.data.me.defaultAccount.wallets;
  const DefaultAccountId = session.userData.data.me.defaultAccount.id;

  return (
    <main>
      {isAuthed && (
        <Container>
          <PriceContainer
            DefaultAccountId={DefaultAccountId}
            AccountDetails={AccountDetails}
          ></PriceContainer>
          <p>logged in </p>
          <p>UserId: {session.sub}</p>
          <Link href={`/transaction`}>transactions</Link>
        </Container>
      )}
    </main>
  );
}
