import { redirect } from "next/navigation"
import React from "react"
import { cookies } from "next/headers"

import { hydraClient } from "../../services/hydra"
import MainContent from "../../components/main-container"
import Logo from "../../components/logo"
import Heading from "../../components/heading"
import SubHeading from "../../components/sub-heading"

import Card from "../../components/card"

import EmailLoginForm from "./email-login-form"

interface LoginProps {
  login_challenge: string
}

const Login = async ({ searchParams }: { searchParams: LoginProps }) => {
  const { login_challenge } = searchParams

  if (!login_challenge) {
    throw new Error("Invalid Request")
  }

  const { data: body } = await hydraClient.getOAuth2LoginRequest(
    {
      loginChallenge: login_challenge,
    },
    {
      headers: {
        Cookie: cookies().toString(),
      },
    },
  )

  if (body.skip) {
    const { data: response } = await hydraClient.acceptOAuth2LoginRequest(
      {
        loginChallenge: login_challenge,
        acceptOAuth2LoginRequest: {
          subject: String(body.subject),
        },
      },
      {
        headers: {
          Cookie: cookies().toString(),
        },
      },
    )
    redirect(String(response.redirect_to))
  }

  return (
    <MainContent>
      <Card>
        <Logo />
        <Heading>Sign In with Blink</Heading>
        <SubHeading>
          Enter your Blink Account ID to sign in to this application.
        </SubHeading>
        <EmailLoginForm login_challenge={login_challenge}></EmailLoginForm>
      </Card>
    </MainContent>
  )
}
export default Login
