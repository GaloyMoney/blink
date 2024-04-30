import { getServerSession } from "next-auth"
import React from "react"

import { Box } from "@mui/joy"

import { authOptions } from "../api/auth/[...nextauth]/route"

import ContentContainer from "@/components/content-container"
import CallBackList from "@/components/callback/callback-list"

import CreateCallBack from "@/components/callback/callback-input"
import { fetchCallbackData } from "@/services/graphql/queries/callback-query"
import CallBackCardItem from "@/components/callback/callback-item"

export default async function page() {
  const session = await getServerSession(authOptions)
  const token = session?.accessToken
  if (!token || typeof token !== "string") {
    throw new Error("invalid token")
  }
  let response
  try {
    response = await fetchCallbackData({ token })
  } catch (err) {
    return null
  }

  const endpoints = response.data.me?.defaultAccount.callbackEndpoints || []
  const callbackPortalUrl = session?.userData?.data?.me?.defaultAccount.callbackPortalUrl

  return (
    <ContentContainer>
      <Box
        sx={{
          maxWidth: "90em",
          margin: "0 auto",
          width: "100%",
        }}
      >
        <CreateCallBack callbackPortalUrl={callbackPortalUrl} />
        <Box
          sx={{
            display: {
              xs: "none",
              md: "block",
            },
          }}
        >
          <CallBackList endpoints={endpoints} />
        </Box>
        <Box
          sx={{
            display: {
              xs: "block",
              md: "none",
            },
          }}
        >
          <CallBackCardItem endpoints={endpoints} />
        </Box>
      </Box>
    </ContentContainer>
  )
}
