import { redirect } from "next/navigation"
import React from "react"
import { cookies } from "next/headers"

import { hydraClient } from "../../services/hydra"
import MainContent from "../../components/main-container"
import Card from "../../components/card"
import Logo from "../../components/logo"
import ScopeItem from "../../components/scope-item/scope-item"
import PrimaryButton from "../../components/button/primary-button-component"
import SecondaryButton from "../../components/button/secondary-button-component"
import Heading from "../../components/heading"
import { SubmitValue } from "../types/index.types"

interface ConsentProps {
  consent_challenge: string
}

const submitForm = async (form: FormData) => {
  "use server"
  const consent_challenge = form.get("consent_challenge")
  const submitValue = form.get("submit")
  const remember = form.get("remember") === "1"

  const grantScope = form.getAll("grant_scope").map((value) => value.toString())

  if (!consent_challenge || typeof consent_challenge !== "string") {
    console.error("INVALID PARAMS")
    return
  }

  if (submitValue === SubmitValue.denyAccess) {
    console.log("User denied access")
    const response = await hydraClient.rejectOAuth2ConsentRequest(
      {
        consentChallenge: consent_challenge,
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

  const responseInit = await hydraClient.getOAuth2ConsentRequest(
    {
      consentChallenge: consent_challenge,
    },
    {
      headers: {
        Cookie: cookies().toString(),
      },
    },
  )

  const body = responseInit.data
  const responseConfirm = await hydraClient.acceptOAuth2ConsentRequest(
    {
      consentChallenge: consent_challenge,
      acceptOAuth2ConsentRequest: {
        grant_scope: grantScope,
        grant_access_token_audience: body.requested_access_token_audience,
        remember: remember,
        remember_for: 3600,
      },
    },
    {
      headers: {
        Cookie: cookies().toString(),
      },
    },
  )
  redirect(responseConfirm.data.redirect_to)
}

const Consent = async ({ searchParams }: { searchParams: ConsentProps }) => {
  const { consent_challenge } = searchParams

  if (!consent_challenge) {
    throw new Error("Invalid Request")
  }

  const data = await hydraClient.getOAuth2ConsentRequest({
    consentChallenge: consent_challenge,
  })

  const body = data.data
  const login_challenge = data.data.login_challenge

  if (!login_challenge) {
    throw new Error("Login Challenge Not Found")
  }

  if (body.client?.skip_consent) {
    const response = await hydraClient.acceptOAuth2ConsentRequest(
      {
        consentChallenge: consent_challenge,
        acceptOAuth2ConsentRequest: {
          grant_scope: body.requested_scope,
          grant_access_token_audience: body.requested_access_token_audience,
        },
      },
      {
        headers: {
          Cookie: cookies().toString(),
        },
      },
    )
    redirect(String(response.data.redirect_to))
  }

  const user = body.subject
  const { client, requested_scope } = body

  if (!user || !client || !requested_scope) {
    throw new Error("Invalid Request ")
  }

  return (
    <MainContent>
      <Card>
        <Logo />

        <Heading>An application requests access to your data!</Heading>

        <form action={submitForm} className="flex flex-col">
          <input type="hidden" name="consent_challenge" value={consent_challenge} />

          <p className="mb-4 text-[var(--inputColor)]  text-center ">
            Application <strong>{client.client_name || client.client_id}</strong> wants
            access resources on your behalf and to:
          </p>

          {requested_scope.map((scope) => (
            <ScopeItem scope={scope} key={scope} />
          ))}

          <p className="mb-4  mt-4  text-[var(--inputColor)]">
            Do you want to be asked next time when this application wants to access your
            data? The application will not be able to ask for more permissions without
            your consent.
          </p>
          <ul className="mb-4">
            {client.policy_uri && (
              <li className="mb-2">
                <a href={client.policy_uri} className="text-blue-500 hover:underline">
                  Policy
                </a>
              </li>
            )}
            {client.tos_uri && (
              <li className="mb-2">
                <a href={client.tos_uri} className="text-blue-500 hover:underline">
                  Terms of Service
                </a>
              </li>
            )}
          </ul>
          <p className="flex items-center mb-4">
            <input
              type="checkbox"
              id="remember"
              name="remember"
              value="1"
              className="mr-2"
            />
            <label htmlFor="remember" className="text-[var(--inputColor)]">
              Do not ask me again
            </label>
          </p>
          <div className="flex flex-col md:flex-row-reverse w-full gap-2">
            <PrimaryButton
              data-testid="submit_consent_btn"
              type="submit"
              id="accept"
              name="submit"
              value={SubmitValue.allowAccess}
            >
              Allow
            </PrimaryButton>
            <SecondaryButton
              type="submit"
              id="reject"
              name="submit"
              value={SubmitValue.denyAccess}
              formNoValidate
            >
              Deny
            </SecondaryButton>
          </div>
        </form>
      </Card>
    </MainContent>
  )
}
export default Consent
