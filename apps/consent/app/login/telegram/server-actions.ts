"use server"

import { createHash } from "crypto"

import { redirect } from "next/navigation"
import { cookies } from "next/headers"

import { LoginType } from "@/app/types/index.types"
import { handleAxiosError } from "@/app/error-handler"
import { hydraClient } from "@/services/hydra"
import authApi from "@/services/galoy-auth"

export async function cancelAuth(loginChallenge: string) {
  // Reject the OAuth login request
  const response = await hydraClient.rejectOAuth2LoginRequest({
    loginChallenge,
    rejectOAuth2Request: {
      error: "access_denied",
      error_description: "The resource owner denied the request",
    },
  })

  redirect(response.data.redirect_to)
}

export async function telegramAuth(loginChallenge: string, phone: string, nonce: string) {
  try {
    // Check if all required parameters are provided
    if (!loginChallenge || !phone || !nonce) {
      return { success: false, message: "Missing required parameters" }
    }

    const normalizedPhone = phone.replace(/\s+/g, "")

    // Authenticate with Telegram Passport
    const { authToken, totpRequired } = await authApi.loginWithTelegramPassport({
      nonce,
      phone: normalizedPhone,
    })

    if (!authToken) {
      return { success: false, message: "Authentication failed" }
    }

    // Set auth cookie
    cookies().set(
      createHash("md5").update(loginChallenge).digest("hex"),
      JSON.stringify({
        loginType: LoginType.phone,
        value: normalizedPhone,
        remember: true,
        authToken,
        totpRequired,
      }),
      { secure: true, sameSite: "lax" },
    )

    // Return success with redirect URL instead of using redirect()
    return {
      success: true,
      redirectUrl: `/login/verification?login_challenge=${loginChallenge}`,
    }
  } catch (error) {
    const axiosError = handleAxiosError(error)
    console.error("Telegram authentication error:", axiosError)

    return {
      success: false,
      message: axiosError.message || "Authentication failed. Please try again.",
    }
  }
}
