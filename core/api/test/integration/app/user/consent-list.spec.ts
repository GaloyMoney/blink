import { consentList } from "@/services/hydra"
import axios from "axios"

import { createUserAndWalletFromPhone, getUserIdByPhone, randomPhone } from "test/helpers"

let userId: UserId
const phone = randomPhone()
// const phone = "+14152991378" as PhoneNumber

const redirectUri = "http://localhost/callback"
const scope = "offline read write"
const grant_types = ["authorization_code", "refresh_token"]

beforeAll(async () => {
  await createUserAndWalletFromPhone(phone)
  userId = await getUserIdByPhone(phone)
})

async function createOAuthClient() {
  const hydraAdminUrl = "http://localhost:4445/admin/clients"

  try {
    const response = await axios.post(hydraAdminUrl, {
      client_name: "integration_test",
      grant_types,
      response_types: ["code", "id_token"],
      redirect_uris: [redirectUri],
      scope,
      skip_consent: true,
    })

    const clientId = response.data.client_id
    const clientSecret = response.data.client_secret

    return { clientId, clientSecret }
  } catch (error) {
    console.error("Error creating OAuth client:", error.response)
  }
}

async function performOAuthLogin({
  clientId,
  clientSecret,
}: {
  clientId: string
  clientSecret: string
}) {
  // create oauth2 client

  const responseType = "code"
  const randomState = "MKfNw-q60talMJ4GU_h1kHFvcPtnQkZI0XLpTkHvJL4"

  const authUrl = `http://localhost:4444/oauth2/auth?response_type=${responseType}&client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${encodeURIComponent(scope)}&state=${randomState}`

  // https://oauth.blink.sv/oauth2/auth?client_id=73ae7c3e-e526-412a-856c-25d1ae0cbc55&scope=read%20write&response_type=code&redirect_uri=https%3A%2F%2Fdashboard.blink.sv%2Fapi%2Fauth%2Fcallback%2Fblink&state=MKfNw-q60talMJ4GU_h1kHFvcPtnQkZI0XLpTkHvJL4

  // Simulate user going to the authorization URL and logging in
  // This part would require a real user interaction or a browser automation tool like puppeteer

  let data
  try {
    const res = await axios.get(authUrl)
    data = res.data
  } catch (error) {
    console.error("Error getting auth URL:", error)
    return
  }

  // You need to extract the code from the callback response
  const code = data.code // Simplified: Actual extraction depends on your OAuth provider

  console.log("data", data)
  console.log("code", code)

  try {
    // Exchange the code for a token
    const tokenResponse = await axios.post("http://localhost:4444/oauth2/token", {
      code,
      redirect_uri: redirectUri,
      client_id: clientId,
      client_secret: clientSecret,
      grant_type: "authorization_code",
    })

    const accessToken = tokenResponse.data.access_token

    // Use the access token to get user info or other secured resources
    // Update the consent list as needed
    return accessToken // This might be used for further secured requests
  } catch (error) {
    console.error("Error exchanging code for token:", error)
  }
}

describe("Hydra", () => {
  it("get an empty consent list", async () => {
    const res = await consentList(userId)
    expect(res).toEqual([])
  })

  it("get consent list when the user had perform oauth2 login", async () => {
    const res = await createOAuthClient()
    if (!res) return
    const { clientId, clientSecret } = res
    console.log("clientId", clientId, "clientSecret", clientSecret)

    const accessToken = await performOAuthLogin({ clientId, clientSecret })
    console.log("accessToken", accessToken)
  })
})
