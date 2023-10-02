import { redirect } from "next/navigation"
import React from "react"
import { hydraClient } from "../hydra-config"
import { oidcConformityMaybeFakeSession } from "../oidc-cert"

interface ConsentProps {
  consent_challenge: string
}

const submitForm = async (form: FormData) => {
  "use server"
  const consent_challenge = form.get("consent_challenge")
  const submitValue = form.get("submit")
  const remember = form.get("remember") === "1"
  const grantScope = form.getAll("grant_scope").map((value) => value.toString())
  // TODO add check from email code.

  if (!consent_challenge || typeof consent_challenge !== "string") {
    console.error("INVALID PARAMS")
    return
  }

  if (submitValue === "Deny access") {
    console.log("User denied access")
    let response
    try {
      response = await hydraClient.rejectOAuth2ConsentRequest({
        consentChallenge: consent_challenge,
        rejectOAuth2Request: {
          error: "access_denied",
          error_description: "The resource owner denied the request",
        },
      })
    } catch (err) {
      console.error("error in rejectOAuth2ConsentRequest", err)
      return
    }
    redirect(response.data.redirect_to)
  }

  let responseConfirm
  try {
    let session = {
      // TODO: pass email
      access_token: { card: "alice", email: "" },
      id_token: { card: "bob", email: "" },
    }
    const responseInit = await hydraClient.getOAuth2ConsentRequest({
      consentChallenge: consent_challenge,
    })
    const body = responseInit.data
    responseConfirm = await hydraClient.acceptOAuth2ConsentRequest({
      consentChallenge: consent_challenge,
      acceptOAuth2ConsentRequest: {
        grant_scope: grantScope,
        session: oidcConformityMaybeFakeSession(grantScope, body, session),
        grant_access_token_audience: body.requested_access_token_audience,
        remember: remember,
        remember_for: 3600,
      },
    })
  } catch (err) {
    console.error("error in getOAuth2ConsentRequest, acceptOAuth2ConsentRequest", err)
    return
  }

  redirect(responseConfirm.data.redirect_to)
}

const Consent = async ({ searchParams }: { searchParams: ConsentProps }) => {
  const { consent_challenge } = searchParams
  if (!consent_challenge) {
    return <p>INVALID REQUEST</p>
  }

  const data = await hydraClient.getOAuth2ConsentRequest({
    consentChallenge: consent_challenge,
  })

  const body = data.data
  if (body.client?.skip_consent) {
    let response
    try {
      response = await hydraClient.acceptOAuth2ConsentRequest({
        consentChallenge: consent_challenge,
        acceptOAuth2ConsentRequest: {
          grant_scope: body.requested_scope,
          grant_access_token_audience: body.requested_access_token_audience,
          session: {
            access_token: { card: "alice" },
            // TODO fetch email
            id_token: { who: "bob", email: "" },
          },
        },
      })
    } catch (err) {
      console.log("error in: acceptOAuth2ConsentRequest ", err)
      return <p>INTERNAL SERVER ERROR</p>
    }
    redirect(String(response.data.redirect_to))
  }

  const user = body.subject
  const { client, requested_scope } = body

  if (!user || !client || !requested_scope) {
    return <p>INTERNAL SERVER ERROR</p>
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white p-10 rounded-lg shadow-lg w-1/3">
        <h1 className="text-2xl font-bold mb-4 text-center">
          An application requests access to your data!
        </h1>
        <form action={submitForm} className="flex flex-col">
          <input type="hidden" name="consent_challenge" value={consent_challenge} />

          <p className="mb-4 text-gray-700">
            Hi {user}, application{" "}
            <strong>{client.client_name || client.client_id}</strong> wants access
            resources on your behalf and to:
          </p>

          {requested_scope.map((scope) => (
            <div key={scope} className="flex items-center mb-2">
              <input
                type="checkbox"
                className="grant_scope mr-2"
                id={scope}
                value={scope}
                name="grant_scope"
                defaultChecked
              />
              <label htmlFor={scope} className="text-gray-700">
                {scope}
              </label>
            </div>
          ))}

          <p className="mb-4 text-gray-700">
            Do you want to be asked next time when this application wants to access your
            data?
          </p>
          <p className="mb-4 text-gray-700">
            The application will not be able to ask for more permissions without your
            consent.
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
            <label htmlFor="remember" className="text-gray-700">
              Do not ask me again
            </label>
          </p>
          <div className="flex flex-col w-full">
            <button
              type="submit"
              id="accept"
              name="submit"
              value="Allow access"
              className="mb-4 bg-blue-500 text-white p-2 rounded hover:bg-blue-700 w-full"
            >
              Allow access
            </button>
            <button
              type="submit"
              id="reject"
              name="submit"
              value="Deny access"
              className="bg-red-500 text-white p-2 rounded hover:bg-red-700 w-full"
            >
              Deny access
            </button>
          </div>
        </form>
      </div>
    </main>
  )
}
export default Consent
