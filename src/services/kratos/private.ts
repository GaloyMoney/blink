import { getKratosConfig } from "@config"
import {
  MissingExpiredAtKratosError,
  UnknownKratosError,
} from "@domain/authentication/errors"
import { Configuration, V0alpha2Api, V0alpha2ApiInterface } from "@ory/client"

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

export const listSessionsInternal = async (
  userId: KratosUserId,
): Promise<KratosSession[] | KratosError> => {
  try {
    const res = await kratosAdmin.adminListIdentitySessions(userId)
    if (res.data === null) return []
    return res.data
  } catch (err) {
    return new UnknownKratosError(err)
  }
}
