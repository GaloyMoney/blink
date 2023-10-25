import { getServerSession } from "next-auth"
import React from "react"

import { authOptions } from "../api/auth/[...nextauth]/route"

import ContentContainer from "@/components/content-container"
import { fetchCallbackData } from "@/services/graphql/queries/callback-query"
import CallbackItem from "@/components/callback/callback-item"
import CreateCallBack from "@/components/callback/callback-input"

export default async function page() {
  const session = await getServerSession(authOptions)
  const token = session?.accessToken
  if (!token || typeof token !== "string") {
    throw new Error("invalid token")
  }

  let response
  try {
    response = await fetchCallbackData(token)
  } catch {
    return null
  }

  const callbackEndpoints = response.data.me?.defaultAccount.callbackEndpoints || []
  return (
    <ContentContainer>
      <CreateCallBack />
      {callbackEndpoints.map((endpointItem) => {
        return (
          <CallbackItem
            key={endpointItem.id}
            id={endpointItem.id}
            url={endpointItem.url}
          />
        )
      })}
    </ContentContainer>
  )
}
