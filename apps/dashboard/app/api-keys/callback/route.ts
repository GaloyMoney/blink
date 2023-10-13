import { redirect } from "next/navigation"
import { NextResponse } from "next/server"
import { getOauth2Client } from "../client"

export async function GET(request: Request) {
  const client = await getOauth2Client()

  const params = client.callbackParams(request.url)

  const tokenSet = await client.oauthCallback(
    "http://localhost:3001/keys/callback",
    params,
    { state: params.state },
  )
  console.log("received and validated tokens %j", tokenSet)

  return NextResponse.json({ token: tokenSet.access_token })
}
