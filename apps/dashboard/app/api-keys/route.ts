import { redirect } from "next/navigation"
import { getOauth2Client } from "./client"

const crypto = require("crypto")

function generateSecureRandomString(length: number) {
  return crypto.randomBytes(length).toString("hex").slice(0, length)
}

export async function GET(request: Request) {
  const client = await getOauth2Client()
  const randomString = generateSecureRandomString(16)

  const authorizationUri = client.authorizationUrl({
    scope: "offline transactions:read payments:send",
    state: randomString,
  })

  redirect(authorizationUri)
}
