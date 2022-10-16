import { AdminUpdateIdentityBody, Identity, IdentityState } from "@ory/client"

import { KratosError, PhoneIdentityInexistentError, UnknownKratosError } from "./errors"
import { kratosAdmin, toDomainIdentityPhone } from "./private"

export const IdentityRepository = (): IIdentityRepository => {
  // TODO: test
  // TODO: manage email as well
  const getIdentity = async (
    kratosUserId: KratosUserId,
  ): Promise<IdentityPhone | KratosError> => {
    let data: Identity

    try {
      const res = await kratosAdmin.adminGetIdentity(kratosUserId)
      data = res.data
    } catch (err) {
      return new UnknownKratosError(err)
    }

    return toDomainIdentityPhone(data)
  }

  const listIdentities = async (): Promise<IdentityPhone[] | KratosError> => {
    try {
      const res = await kratosAdmin.adminListIdentities()
      return res.data.map(toDomainIdentityPhone)
    } catch (err) {
      return new UnknownKratosError(err)
    }
  }

  // only use for non public endpoint for now
  // because there is no index/go through all records
  const slowFindByPhone = async (
    phone: PhoneNumber,
  ): Promise<IdentityPhone | KratosError> => {
    let identities: Identity[]

    try {
      const res = await kratosAdmin.adminListIdentities()
      identities = res.data
    } catch (err) {
      return new UnknownKratosError(err)
    }

    const identity = identities.find((identity) => identity.traits.phone === phone)

    if (!identity) return new PhoneIdentityInexistentError(phone)

    return toDomainIdentityPhone(identity)
  }

  const setLanguage = async ({
    id,
    language,
  }: {
    id: KratosUserId
    language: UserLanguage
  }) => {
    let identity: Identity

    try {
      ;({ data: identity } = await kratosAdmin.adminGetIdentity(id))
    } catch (err) {
      return new UnknownKratosError(err)
    }

    const metadata_public = {
      // only override language
      ...identity.metadata_public,
      language,
    }

    const updatedIdentity: AdminUpdateIdentityBody = {
      ...identity,
      state: identity.state as IdentityState, // FIXME? type bug from ory library?
      metadata_public,
    }

    let newIdentity: Identity

    try {
      ;({ data: newIdentity } = await kratosAdmin.adminUpdateIdentity(
        id,
        updatedIdentity,
      ))
    } catch (err) {
      return new UnknownKratosError(err)
    }

    return toDomainIdentityPhone(newIdentity)
  }

  const setDeviceTokens = async ({
    id,
    deviceTokens,
  }: {
    id: KratosUserId
    deviceTokens: DeviceToken[]
  }) => {
    let identity: Identity

    try {
      ;({ data: identity } = await kratosAdmin.adminGetIdentity(id))
    } catch (err) {
      return new UnknownKratosError(err)
    }

    const metadata_public = {
      // only override deviceTokens
      ...identity.metadata_public,
      deviceTokens,
    }

    const updatedIdentity: AdminUpdateIdentityBody = {
      ...identity,
      state: identity.state as IdentityState, // FIXME? type bug from ory library?
      metadata_public,
    }

    let newIdentity: Identity

    try {
      ;({ data: newIdentity } = await kratosAdmin.adminUpdateIdentity(
        id,
        updatedIdentity,
      ))
    } catch (err) {
      return new UnknownKratosError(err)
    }

    return toDomainIdentityPhone(newIdentity)
  }

  const setPhoneMetadata = async ({
    id,
    phoneMetadata,
  }: {
    id: KratosUserId
    phoneMetadata: PhoneMetadata
  }) => {
    let identity: Identity

    try {
      ;({ data: identity } = await kratosAdmin.adminGetIdentity(id))
    } catch (err) {
      return new UnknownKratosError(err)
    }

    const metadata_admin: KratosAdminMetadata = {
      phoneMetadata,
    }

    const updatedIdentity: AdminUpdateIdentityBody = {
      ...identity,
      state: identity.state as IdentityState, // FIXME? type bug from ory library?
      metadata_admin,
    }

    let newIdentity: Identity

    try {
      ;({ data: newIdentity } = await kratosAdmin.adminUpdateIdentity(
        id,
        updatedIdentity,
      ))
    } catch (err) {
      return new UnknownKratosError(err)
    }

    return toDomainIdentityPhone(newIdentity)
  }

  return {
    getIdentity,
    listIdentities,
    slowFindByPhone,
    setPhoneMetadata,
    setDeviceTokens,
    setLanguage,
  }
}
