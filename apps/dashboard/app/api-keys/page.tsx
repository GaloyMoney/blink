import { Box, Link, Typography } from "@mui/joy"

import { redirect } from "next/navigation"

import { getServerSession } from "next-auth"

import { authOptions } from "../api/auth/[...nextauth]/route"

import ContentContainer from "@/components/content-container"
import ApiKeysList from "@/components/api-keys/list"
import ApiKeyCreate from "@/components/api-keys/create"
import ApiKeysCard from "@/components/api-keys/api-card"

import { apiKeys } from "@/services/graphql/queries/api-keys"

export default async function Home() {
  const session = await getServerSession(authOptions)
  const token = session?.accessToken

  if (!token || typeof token !== "string") {
    redirect("/")
  }

  const keys = await apiKeys(token)

  const activeKeys = keys.filter(({ expired, revoked }) => !expired && !revoked)
  const expiredKeys = keys.filter(({ expired }) => expired)
  const revokedKeys = keys.filter(({ revoked }) => revoked)
  const defaultWalletId = session.userData.data.me?.defaultAccount.id

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
          <ApiKeyCreate defaultWalletId={defaultWalletId} />
        </Box>
        <Typography fontSize={17}>
          Our team will never ask for the API keys. Anyone with access to the key with
          write access will have full control of the funds on the wallet.
        </Typography>
        <Box
          sx={{
            display: { xs: "none", md: "flex" },
            flexDirection: "column",
            rowGap: "1em",
            width: "100%",
          }}
        >
          <ApiKeysList
            activeKeys={activeKeys}
            expiredKeys={expiredKeys}
            revokedKeys={revokedKeys}
          />
        </Box>
        <Box
          sx={{
            display: { xs: "flex", md: "none" },
            flexDirection: "column",
            rowGap: "1em",
            width: "100%",
          }}
        >
          <ApiKeysCard
            activeKeys={activeKeys}
            expiredKeys={expiredKeys}
            revokedKeys={revokedKeys}
          />
        </Box>
      </Box>
    </ContentContainer>
  )
}
