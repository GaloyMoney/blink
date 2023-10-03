"use server"

import {  redirect } from "next/navigation"
import { hydraClient } from "@/app/hydra-config"
import { oidcConformityMaybeFakeAcr } from "@/app/oidc-cert"
import { env } from "@/env"
import axios from "axios"

export const submitForm = async (_prevState: unknown, form: FormData) => {
  const login_challenge = form.get("login_challenge")
  const code = form.get("code")
  const remember = form.get("remember") === "true"
  const emailLoginId = form.get("emailLoginId")
  // TODO add check from email code.

  if (
    !login_challenge ||
    !code ||
    typeof login_challenge !== "string" ||
    typeof code !== "string"
  ) {
    console.error("Invalid Params")
    return
  }

  let authToken = null
  let totpRequired = null
  let userId = null
  const res2 = await axios.post(`${env.AUTH_URL}/auth/email/login`, {
    code,
    emailLoginId,
  })
  authToken = res2.data.result.authToken
  totpRequired = res2.data.result.totpRequired
  userId = res2.data.result.id

  if (!authToken) {
    return {
      message: "Invalid code",
    }
  }

  // TODO: me query to get userId
  let response2
  const response = await hydraClient.getOAuth2LoginRequest({
    loginChallenge: login_challenge,
  })
  const loginRequest = response.data

  response2 = await hydraClient.acceptOAuth2LoginRequest({
    loginChallenge: login_challenge,
    acceptOAuth2LoginRequest: {
      subject: userId,
      remember: remember,
      remember_for: 3600,
      acr: oidcConformityMaybeFakeAcr(loginRequest, "0"),
    },
  })

  redirect(response2.data.redirect_to)
}
