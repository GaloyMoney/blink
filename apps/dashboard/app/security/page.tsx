import { getServerSession } from "next-auth"
import { Box } from "@mui/joy"

import { authOptions } from "@/app/api/auth/[...nextauth]/route"
import ContentContainer from "@/components/content-container"
import EmailSettings from "@/components/security/email/email"

export default async function Home() {
  const session = await getServerSession(authOptions)
  const email = session?.userData.data.me?.email
  return (
    <ContentContainer>
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          maxWidth: "90em",
          margin: "0 auto",
          width: "100%",
        }}
      >
        {email ? <EmailSettings emailData={email}></EmailSettings> : null}
      </Box>
    </ContentContainer>
  )
}
