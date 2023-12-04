import { redirect } from "next/navigation"
import React from "react"

import { CountryCode } from "libphonenumber-js"

import PhoneAuthForm from "./phone-auth-form"

import { getSupportedCountryCodes } from "@/app/graphql/queries/get-supported-countries"

import { hydraClient } from "@/services/hydra"
import Card from "@/components/card"
import MainContent from "@/components/main-container"
import Logo from "@/components/logo"
import Heading from "@/components/heading"
import SubHeading from "@/components/sub-heading"

interface PhoneAuth {
  login_challenge: string
  authAction: "Register" | "Login"
}

const PhoneAuth = async ({ login_challenge, authAction }: PhoneAuth) => {
  if (!login_challenge) {
    throw new Error("Invalid Request")
  }

  const { data: body } = await hydraClient.getOAuth2LoginRequest({
    loginChallenge: login_challenge,
  })

  if (body.skip) {
    const { data: response } = await hydraClient.acceptOAuth2LoginRequest({
      loginChallenge: login_challenge,
      acceptOAuth2LoginRequest: {
        subject: String(body.subject),
      },
    })
    redirect(String(response.redirect_to))
  }

  const countries = await getSupportedCountryCodes()
  if (!countries) {
    throw new Error("Unable to get Countries")
  }

  const countryCodes: CountryCode[] = countries.map(
    (country) => country.id as CountryCode,
  )
  const subHeadingMessage =
    authAction === "Register"
      ? "Enter your phone number to register with Blink and log in to this application."
      : "Enter your phone number to log in to this application."

  return (
    <MainContent>
      <Card>
        <Logo />
        <Heading>{authAction} In with Blink</Heading>
        <SubHeading>{subHeadingMessage}</SubHeading>
        <PhoneAuthForm
          authAction={authAction}
          countryCodes={countryCodes}
          login_challenge={login_challenge}
        />
      </Card>
    </MainContent>
  )
}
export default PhoneAuth
