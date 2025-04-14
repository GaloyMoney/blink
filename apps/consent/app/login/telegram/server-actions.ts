"use server"

import { createHash } from "crypto"

import { redirect } from "next/navigation"
import { cookies, headers } from "next/headers"

import { LoginType } from "@/app/types/index.types"
import { handleAxiosError } from "@/app/error-handler"
import { hydraClient } from "@/services/hydra"
import authApi from "@/services/galoy-auth"

export async function cancelAuth(loginChallenge: string) {
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

    const headersList = headers()
    const customHeaders = {
      "x-real-ip": headersList.get("x-real-ip"),
      "x-forwarded-for": headersList.get("x-forwarded-for"),
    }

    const { authToken, totpRequired } = await authApi.loginWithTelegramPassport({
      nonce,
      phone: normalizedPhone,
      customHeaders,
    })

    if (!authToken) {
      return { success: false, message: "Authentication failed" }
    }

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
