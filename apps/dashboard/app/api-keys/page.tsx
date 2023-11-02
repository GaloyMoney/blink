import { getServerSession } from "next-auth"
import { Box, Link, Typography } from "@mui/joy"

import { authOptions } from "@/app/api/auth/[...nextauth]/route"
import ContentContainer from "@/components/content-container"
import ApiKeysList from "@/components/api-keys/list"
import ApiKeyCreate from "@/components/api-keys/create"

export default async function Home() {
  const session = await getServerSession(authOptions)
  return (
    <ContentContainer>
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          rowGap: "1em",
          alignItems: "flex-start",
          maxWidth: "90em",
          margin: "0 auto",
          width: "100%",
        }}
      >
        <Box
          sx={{
            display: "flex",
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "center",
            maxWidth: "90em",
            margin: "0 auto",
            width: "100%",
          }}
        >
          <Typography>
            Your API Keys that can be used to access the{" "}
            <Link href="https://dev.blink.sv/">Blink API</Link>
          </Typography>
          <ApiKeyCreate />
        </Box>
        <ApiKeysList />
      </Box>
    </ContentContainer>
  )
}
