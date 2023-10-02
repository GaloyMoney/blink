import { redirect, useRouter } from "next/navigation"
import { hydraClient } from "@/app/hydra-config"
import { oidcConformityMaybeFakeAcr } from "@/app/oidc-cert"
import { authUrl } from "@/env"
import axios from "axios"

interface VerificationProps {
  login_challenge: string
  email: string
  emailLoginId: string
  remember: string
}

const submitForm = async (form: FormData) => {
  "use server"
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

  // this is for tesing and development
  // const res2 = await axios.post(`${authUrl}/auth/email/login`, {
  //   code,
  //   emailLoginId,
  // });
  // const authToken = res2.data.result.authToken;
  // if (!authToken) {
  //   return;
  // }

  // TODO: me query to get userId
  let response2
  try {
    const response = await hydraClient.getOAuth2LoginRequest({
      loginChallenge: login_challenge,
    })
    const loginRequest = response.data

    response2 = await hydraClient.acceptOAuth2LoginRequest({
      loginChallenge: login_challenge,
      acceptOAuth2LoginRequest: {
        subject: "123",
        remember: remember,
        remember_for: 3600,
        acr: oidcConformityMaybeFakeAcr(loginRequest, "0"),
      },
    })
  } catch (err) {
    console.error("error in acceptOAuth2LoginRequest, getOAuth2LoginRequest ", err)
    return
  }

  redirect(response2.data.redirect_to)
}

const Verification = ({ searchParams }: { searchParams: VerificationProps }) => {
  const { login_challenge, email, emailLoginId, remember } = searchParams
  if (!login_challenge || !email || !emailLoginId) {
    return <p>INVALID REQUEST</p>
  }
  return (
    <main>
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="bg-white p-10 rounded-lg shadow-lg w-1/3">
          <h1 id="verification-title" className="text-2xl font-bold mb-4 text-center">
            Enter Verification Code
          </h1>
          <form action={submitForm} className="flex flex-col">
            <input type="hidden" name="login_challenge" value={login_challenge} />
            <input type="hidden" name="emailLoginId" value={emailLoginId} />
            <input type="hidden" name="remember" value={remember} />

            <p className="mb-4 text-gray-700 text-center">
              The code was sent to your email: {email}.
            </p>
            <p className="mb-4 text-gray-700 text-center">Please enter it below.</p>

            <input
              type="text"
              id="code"
              name="code"
              placeholder="Enter code here"
              className="p-2 mb-4 border rounded text-center"
            />
            <button
              type="submit"
              className="bg-blue-500 text-white p-2 rounded hover:bg-blue-700"
            >
              Submit
            </button>
          </form>
        </div>
      </div>
    </main>
  )
}

export default Verification
