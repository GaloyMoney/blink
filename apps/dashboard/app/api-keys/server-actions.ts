"use server"
import { getServerSession } from "next-auth"
import { revalidatePath } from "next/cache"

import { authOptions } from "@/app/api/auth/[...nextauth]/route"
import { createApiKey, revokeApiKey } from "@/services/graphql/mutations/api-keys"

export const revokeApiKeyServerAction = async (id: string) => {
  if (!id || typeof id !== "string") {
    return {
      error: true,
      message: "API Key ID to revoke is not present",
      data: null,
    }
  }

  const session = await getServerSession(authOptions)
  const token = session?.accessToken
  if (!token || typeof token !== "string") {
    return {
      error: true,
      message: "Token is not present",
      data: null,
    }
  }

  try {
    await revokeApiKey(token, id)
  } catch (err) {
    console.log("error in revokeApiKey ", err)
    return {
      error: true,
      message:
        "Something went wrong Please try again and if error persist contact support",
      data: null,
    }
  }

  revalidatePath("/api-keys")

  return {
    error: false,
    message: "API Key revoked successfully",
    data: { ok: true },
  }
}

export const createApiKeyServerAction = async (_prevState: unknown, form: FormData) => {
  const apiKeyName = form.get("apiKeyName")
  if (!apiKeyName || typeof apiKeyName !== "string") {
    return {
      error: true,
      message: "API Key name to create is not present",
      data: null,
    }
  }

  const session = await getServerSession(authOptions)
  const token = session?.accessToken
  if (!token || typeof token !== "string") {
    return {
      error: true,
      message: "Token is not present",
      data: null,
    }
  }

  let data
  try {
    data = await createApiKey(token, apiKeyName)
  } catch (err) {
    console.log("error in createApiKey ", err)
    return {
      error: true,
      message:
        "Something went wrong Please try again and if error persist contact support",
      data: null,
    }
  }

  revalidatePath("/api-keys")

  return {
    error: false,
    message: "API Key created successfully",
    data: { apiKeySecret: data?.apiKeyCreate.apiKeySecret },
  }
}
