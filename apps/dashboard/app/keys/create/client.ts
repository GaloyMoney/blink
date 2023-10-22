import { env } from "@/env"
import { Issuer } from "openid-client"

const clientId = env.CLIENT_ID_APP_API_KEY
const clientSecret = env.CLIENT_SECRET_APP_API_KEY

export const getOauth2Client = async () => {
  const GaloyIssuer = await Issuer.discover(env.HYDRA_PUBLIC)

  return new GaloyIssuer.Client({
    client_id: clientId,
    client_secret: clientSecret,
    redirect_uris: [`${env.NEXTAUTH_URL}/keys/create/callback`],
    response_types: ["code"],
  })
}
