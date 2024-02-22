"use server"
import { getServerSession } from "next-auth"
import { revalidatePath } from "next/cache"

import { ApiKeyResponse } from "./api-key.types"

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

export const createApiKeyServerAction = async (
  _prevState: ApiKeyResponse,
  form: FormData,
): Promise<ApiKeyResponse> => {
  let apiKeyExpiresInDays: number | null = null
  const apiKeyName = form.get("apiKeyName")
  const scopes = []
  if (form.get("readScope")) scopes.push("READ")
  if (form.get("receiveScope")) scopes.push("RECEIVE")
  if (form.get("writeScope")) scopes.push("WRITE")

  if (scopes.length === 0) {
    return {
      error: true,
      message: "At least one scope is required",
      responsePayload: null,
    }
  }

  const apiKeyExpiresInDaysSelect = form.get("apiKeyExpiresInDaysSelect")
  if (!apiKeyName || typeof apiKeyName !== "string") {
    return {
      error: true,
      message: "API Key name to create is not present",
      responsePayload: null,
    }
  }

  if (apiKeyExpiresInDaysSelect === "custom") {
    const customValue = form.get("apiKeyExpiresInDaysCustom")
    apiKeyExpiresInDays = customValue ? parseInt(customValue as string, 10) : null
  } else {
    apiKeyExpiresInDays = apiKeyExpiresInDaysSelect
      ? parseInt(apiKeyExpiresInDaysSelect as string, 10)
      : null
  }

  const session = await getServerSession(authOptions)
  const token = session?.accessToken
  if (!token || typeof token !== "string") {
    return {
      error: true,
      message: "Token is not present",
      responsePayload: null,
    }
  }

  let data
  try {
    data = await createApiKey(token, apiKeyName, apiKeyExpiresInDays, scopes)
  } catch (err) {
    console.log("error in createApiKey ", err)
    return {
      error: true,
      message:
        "Something went wrong Please try again and if error persist contact support",
      responsePayload: null,
    }
  }

  revalidatePath("/api-keys")

  return {
    error: false,
    message: "API Key created successfully",
    responsePayload: { apiKeySecret: data?.apiKeyCreate.apiKeySecret },
  }
}
