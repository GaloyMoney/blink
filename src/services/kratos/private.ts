import { getKratosConfig } from "@config"
import { Configuration, V0alpha2Api, V0alpha2ApiInterface } from "@ory/client"

import { MissingExpiredAtKratosError } from "./errors"

const { publicApi, adminApi } = getKratosConfig()

const KratosSdk: (kratosEndpoint: string) => V0alpha2ApiInterface = (kratosEndpoint) =>
  new V0alpha2Api(new Configuration({ basePath: kratosEndpoint }))

export const kratosPublic = KratosSdk(publicApi)
export const kratosAdmin = KratosSdk(adminApi)

export const toDomainSession = (session: KratosSession): Session => {
  // is throw ok? this should not happen I (nb) believe but the type say it can
  // this may probably be a type issue in kratos SDK
  if (!session.expires_at) throw new MissingExpiredAtKratosError()

  return {
    id: session.id as SessionId,
    identity: toDomainIdentityPhone(session.identity),
  }
}

export const toDomainIdentityPhone = (identity: KratosIdentity): IdentityPhone => ({
  id: identity.id as KratosUserId,
  phone: identity.traits.phone,
})
