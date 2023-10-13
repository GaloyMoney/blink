const clientId = process.env.CLIENT_ID
const clientSecret = process.env.CLIENT_SECRET

import { Issuer } from "openid-client"

export const getOauth2Client = async () => {
  if (!clientId || !clientSecret) {
    throw new Error("Missing CLIENT_ID or CLIENT_SECRET environment variable")
  }

  const GaloyIssuer = await Issuer.discover("http://127.0.0.1:4444")

  return new GaloyIssuer.Client({
    client_id: clientId,
    client_secret: clientSecret,
    redirect_uris: ["http://localhost:3001/keys/callback"],
    response_types: ["code"],
  })
}
