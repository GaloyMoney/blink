"use server"
import { redirect } from "next/navigation"
import { cookies, headers } from "next/headers"

import { hydraClient } from "../../services/hydra"
import { LoginType, SubmitValue } from "../types/index.types"

import { LoginEmailResponse } from "./email-login.types"

import authApi from "@/services/galoy-auth"
import { handleAxiosError } from "@/app/error-handler"

export async function submitForm(
  _prevState: LoginEmailResponse,
  formData: FormData,
): Promise<LoginEmailResponse> {
  const headersList = headers()
  const customHeaders = {
    "x-real-ip": headersList.get("x-real-ip"),
    "x-forwarded-for": headersList.get("x-forwarded-for"),
  }

  const login_challenge = formData.get("login_challenge")
  const submitValue = formData.get("submit")
  const email = formData.get("email")
  const remember = String(formData.get("remember") === "1")
  if (
    !login_challenge ||
    !submitValue ||
    !remember ||
    typeof login_challenge !== "string" ||
    typeof submitValue !== "string"
  ) {
    throw new Error("Invalid Value")
  }

  if (submitValue === SubmitValue.denyAccess) {
    console.log("User denied access")
    const response = await hydraClient.rejectOAuth2LoginRequest(
      {
        loginChallenge: login_challenge,
        rejectOAuth2Request: {
          error: "access_denied",
          error_description: "The resource owner denied the request",
        },
      },
      {
        headers: {
          Cookie: cookies().toString(),
        },
      },
    )
    redirect(response.data.redirect_to)
  }

  if (!email || typeof email !== "string") {
    console.error("Invalid Values for email")
    throw new Error("Invalid Email Value")
  }

  let emailCodeRequest: string | null
  try {
    emailCodeRequest = await authApi.requestEmailCode({ email, customHeaders })
  } catch (err) {
    console.error("Error in requestEmailCode", err)
    return handleAxiosError(err)
  }

  // TODO: manage error on ip rate limit
  // TODO: manage error when trying the same email too often
  if (!emailCodeRequest) {
    return {
      error: true,
      message: "Internal Server Error",
      responsePayload: null,
    }
  }

  cookies().set(
    login_challenge,
    JSON.stringify({
      loginType: LoginType.email,
      loginId: emailCodeRequest,
      value: email,
      remember,
    }),
    { secure: true },
  )

  const params = new URLSearchParams({
    login_challenge,
  })
  redirect(`/login/verification?${params}`)
}
