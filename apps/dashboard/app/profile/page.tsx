import { getServerSession } from "next-auth";
import { authOptions } from "./../api/auth/[...nextauth]/route";
import ContentContainer from "@/components/content-container";
import { Box } from "@mui/joy";
import EnableEmail from "@/components/profile-settings/email/email";

export default async function Home() {
  const session = await getServerSession(authOptions);
  const totpEnabled = session?.userData.data.me?.totpEnabled;
  const email = session?.userData.data.me?.email;
  return (
    <main>
      <ContentContainer>
        <EnableEmail address={email?.address} verified={email?.verified} />
      </ContentContainer>
    </main>
  );
}