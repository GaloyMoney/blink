import { getOauth2Client } from "../client"
import { env } from "@/env"
import { CallbackParamsType, TokenSet } from "openid-client"

export default async function page({ searchParams }: {searchParams: URLSearchParams}) {
  const client = await getOauth2Client()

  const params = searchParams as unknown as CallbackParamsType

  let tokenSet: TokenSet

  // should use .oauthCallback if idtoken is not present
  try {
    tokenSet = await client.callback(
      `${env.NEXTAUTH_URL}/keys/create/callback`,
      params,
      { state: params.state },
    )
  } catch (err) {
    console.error(err)
    return <div>error: {err.message}</div>
  }

  return (
  <>
    This is your api key: {tokenSet.access_token}
    <br />
    You won't see this key again, so copy it now
    <br />
    Meta: {JSON.stringify({...tokenSet})}
  </>
  )
}
