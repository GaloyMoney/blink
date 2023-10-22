import { redirect } from "next/navigation"
import { getOauth2Client } from "./client"

import { cookies } from "next/headers"

const crypto = require("crypto")

function generateSecureRandomString(length: number) {
  return crypto.randomBytes(length).toString("hex").slice(0, length)
}

export async function GET(request: Request) {
  cookies().delete("ory_hydra_session_dev")

  const client = await getOauth2Client()
  const randomString = generateSecureRandomString(16)

  const authorizationUri = client.authorizationUrl({
    scope: "transactions:read payments:send openid",
    state: randomString,
  })

  redirect(authorizationUri)
}
