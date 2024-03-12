"use server"
import { headers } from "next/headers"

import { redirect } from "next/navigation"

import { VerificationCodeResponse, VerificationTotpResponse } from "./verification.types"

import { handleAxiosError } from "@/app/error-handler"
import { getUserId } from "@/app/graphql/queries/me-query"
import { LoginType } from "@/app/types/index.types"
import authApi from "@/services/galoy-auth"

import { hydraClient } from "@/services/hydra"

export const submitFormTotp = async (
  _prevState: VerificationTotpResponse,
  form: FormData,
): Promise<VerificationTotpResponse> => {
  const headersList = headers()
  const customHeaders = {
    "x-real-ip": headersList.get("x-real-ip"),
    "x-forwarded-for": headersList.get("x-forwarded-for"),
  }

  const login_challenge = form.get("login_challenge")

  const remember = form.get("remember") === "true"
  const totpCode = form.get("totpCode")
  const authToken = form.get("authToken")
  if (
    !login_challenge ||
    !totpCode ||
    !authToken ||
    typeof login_challenge !== "string" ||
    typeof totpCode !== "string" ||
    typeof authToken !== "string"
  ) {
    throw new Error("Invalid params")
  }

  try {
    await authApi.validateTotp({ totpCode, authToken, customHeaders })
  } catch (err) {
    console.error("error in 'totp/validate' ", err)
    return handleAxiosError(err)
  }

  const userId = await getUserId(authToken)
  if (!userId || typeof userId !== "string") {
    throw new Error("UserId not found")
  }

  // TODO: check if this 1st call is necessary
  await hydraClient.getOAuth2LoginRequest({
    loginChallenge: login_challenge,
  })

  const response2 = await hydraClient.acceptOAuth2LoginRequest({
    loginChallenge: login_challenge,
    acceptOAuth2LoginRequest: {
      subject: userId,
      remember,
      remember_for: 3600,
      acr: "2",
    },
  })
  redirect(response2.data.redirect_to)
}

export const submitForm = async (
  _prevState: VerificationCodeResponse,
  form: FormData,
): Promise<VerificationCodeResponse> => {
  const headersList = headers()
  const customHeaders = {
    "x-real-ip": headersList.get("x-real-ip"),
    "x-forwarded-for": headersList.get("x-forwarded-for"),
  }

  const login_challenge = form.get("login_challenge")
  const code = form.get("code")
  const remember = form.get("remember") === "true"
  const loginType = form.get("loginType")
  const value = form.get("value")
  const loginId = form.get("loginId")

  let authToken: string | null
  let totpRequired: boolean | null
  let userId: string | null

  if ((loginType === LoginType.email && !loginId) || typeof loginId !== "string") {
    throw new Error("Invalid Values")
  }

  if (
    !login_challenge ||
    !code ||
    !value ||
    typeof login_challenge !== "string" ||
    typeof code !== "string" ||
    typeof value !== "string"
  ) {
    throw new Error("Invalid Values")
  }

  if (loginType === LoginType.phone) {
    try {
      const loginResponse = await authApi.loginWithPhone({ value, code, customHeaders })
      authToken = loginResponse.authToken
      totpRequired = loginResponse.totpRequired
      userId = loginResponse.id
    } catch (err) {
      console.error("error in 'phone/login' ", err)
      return handleAxiosError(err)
    }
  } else if (loginType === LoginType.email) {
    try {
      const loginResponse = await authApi.loginWithEmail({
        code,
        emailLoginId: loginId,
        customHeaders,
      })
      authToken = loginResponse.authToken
      totpRequired = loginResponse.totpRequired
      userId = loginResponse.id
    } catch (err) {
      console.error("error in 'email/login' ", err)
      return handleAxiosError(err)
    }
  } else {
    throw new Error("Invalid Value")
  }

  if (!authToken) {
    return {
      error: true,
      message: "Invalid code",
      responsePayload: null,
    }
  }

  if (totpRequired) {
    return {
      error: false,
      message: "2FA required",
      responsePayload: {
        totpRequired: true,
        authToken,
      },
    }
  }

  if (!userId) {
    throw new Error("Invalid userId")
  }

  // TODO: check if this 1st call is necessary
  await hydraClient.getOAuth2LoginRequest({
    loginChallenge: login_challenge,
  })

  const response2 = await hydraClient.acceptOAuth2LoginRequest({
    loginChallenge: login_challenge,
    acceptOAuth2LoginRequest: {
      subject: userId,
      remember: remember,
      remember_for: 3600,
      acr: "2",
    },
  })

  redirect(response2.data.redirect_to)
}
