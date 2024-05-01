"use server"
import { getServerSession } from "next-auth"

import { authOptions } from "../api/auth/[...nextauth]/route"

import { getWalletDetailsByUsername } from "@/services/graphql/queries/get-user-wallet-id"

export const getUserDetailsAction = async ({ username }: { username: string }) => {
  const session = await getServerSession(authOptions)
  const token = session?.accessToken
  if (!token) {
    return {
      error: true,
      message: "Session not Found",
      responsePayload: null,
    }
  }

  const response = await getWalletDetailsByUsername({
    username,
  })
  if (response instanceof Error) {
    return {
      error: true,
      message: response.message,
      responsePayload: null,
    }
  }

  return {
    error: false,
    message: "success",
    responsePayload: response,
  }
}
