import { NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "./api/auth/[...nextauth]/route";
import Link from "next/link";
import PriceContainer from "@/components/price-container/price-container";
import ContentContainer from "@/components/content-container";
import { redirect } from "next/navigation";

export default async function Home(req: NextRequest) {
    const session = await getServerSession(authOptions);
    const isAuthed = session?.sub ?? false;
    if (!isAuthed) {
        redirect("/sign-in");
    }

    const AccountDetails = session.userData.data.me.defaultAccount.wallets;
    const DefaultAccountId = session.userData.data.me.defaultAccount.id;

    return (
        <main>
            {isAuthed && (
                <ContentContainer>
                    <PriceContainer
                        DefaultAccountId={DefaultAccountId}
                        AccountDetails={AccountDetails}
                    ></PriceContainer>
                </ContentContainer>
            )}
        </main>
    );
}
