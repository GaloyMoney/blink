import knex from "knex"

import { Configuration, FrontendApi, Identity, IdentityApi } from "@ory/client"

import { MissingCreatedAtKratosError, UnknownKratosError } from "./errors"

import { SchemaIdType } from "./schema"

import { ErrorLevel } from "@/domain/shared"
import { recordExceptionInCurrentSpan } from "@/services/tracing"

import { KRATOS_ADMIN_API, KRATOS_PG_CON, KRATOS_PUBLIC_API } from "@/config"

export const kratosPublic = new FrontendApi(
  new Configuration({ basePath: KRATOS_PUBLIC_API }),
)

export const kratosAdmin = new IdentityApi(
  new Configuration({ basePath: KRATOS_ADMIN_API }),
)

export const getKratosPostgres = () =>
  knex({
    client: "pg",
    connection: KRATOS_PG_CON,
  })

export const toDomainSession = (session: KratosSession): MobileSession => {
  return {
    id: session.id as SessionId,
    identity: toDomainIdentity(session.identity as Identity),
    expiresAt: new Date(session?.expires_at as string),
    issuedAt: new Date(session?.issued_at as string),
  }
}

const toSchema = (schemaId: string): SchemaId => {
  switch (schemaId) {
    case "phone_no_password_v0":
      return SchemaIdType.PhoneNoPasswordV0
    case "phone_email_no_password_v0":
      return SchemaIdType.PhoneEmailNoPasswordV0
    case "email_no_password_v0":
      return SchemaIdType.EmailNoPasswordV0
    case "username_password_deviceid_v0":
      return SchemaIdType.UsernamePasswordDeviceIdV0
    default:
      throw new UnknownKratosError(`Invalid schemaId: ${schemaId}`)
  }
}

export const toDomainIdentity = (identity: KratosIdentity): AnyIdentity => {
  let createdAt: Date
  if (identity.created_at) {
    createdAt = new Date(identity.created_at)
  } else {
    recordExceptionInCurrentSpan({
      error: new MissingCreatedAtKratosError(
        "createdAt should always be set? type approximation from kratos",
      ),
      level: ErrorLevel.Critical,
    })
    createdAt = new Date()
  }

  const { username: rawUsername } = identity.traits
  return {
    id: identity.id as UserId,
    phone: identity.traits.phone as PhoneNumber,
    email: identity.traits.email as EmailAddress,
    username: rawUsername !== undefined ? (rawUsername as IdentityUsername) : rawUsername,
    emailVerified: identity.verifiable_addresses?.[0].verified ?? false,
    totpEnabled: identity?.credentials?.totp?.type === "totp",
    schema: toSchema(identity.schema_id),
    createdAt,
  }
}

// unlike toDomainIdentity, return a more precise type
export const toDomainIdentityEmail = (identity: KratosIdentity): IdentityEmail => {
  let createdAt: Date
  if (identity.created_at) {
    createdAt = new Date(identity.created_at)
  } else {
    recordExceptionInCurrentSpan({
      error: new MissingCreatedAtKratosError(
        "createdAt should always be set? type approximation from kratos",
      ),
      level: ErrorLevel.Critical,
    })
    createdAt = new Date()
  }

  const { username: rawUsername } = identity.traits
  return {
    id: identity.id as UserId,
    phone: undefined,
    email: identity.traits.email as EmailAddress,
    username: rawUsername !== undefined ? (rawUsername as IdentityUsername) : rawUsername,
    emailVerified: identity.verifiable_addresses?.[0].verified ?? false,
    totpEnabled: identity?.credentials?.totp?.type === "totp",
    schema: toSchema(identity.schema_id),
    createdAt,
  }
}

export const toDomainIdentityPhone = (identity: KratosIdentity): IdentityPhone => {
  let createdAt: Date
  if (identity.created_at) {
    createdAt = new Date(identity.created_at)
  } else {
    recordExceptionInCurrentSpan({
      error: new MissingCreatedAtKratosError(
        "createdAt should always be set? type approximation from kratos",
      ),
      level: ErrorLevel.Critical,
    })
    createdAt = new Date()
  }

  const { username: rawUsername } = identity.traits
  return {
    id: identity.id as UserId,
    phone: identity.traits.phone as PhoneNumber,
    email: undefined,
    username: rawUsername !== undefined ? (rawUsername as IdentityUsername) : rawUsername,
    emailVerified: undefined,
    totpEnabled: identity?.credentials?.totp?.type === "totp",
    schema: toSchema(identity.schema_id),
    createdAt,
  }
}

export const toDomainIdentityEmailPhone = (
  identity: KratosIdentity,
): IdentityPhoneEmail => {
  let createdAt: Date
  if (identity.created_at) {
    createdAt = new Date(identity.created_at)
  } else {
    recordExceptionInCurrentSpan({
      error: new MissingCreatedAtKratosError(
        "createdAt should always be set? type approximation from kratos",
      ),
      level: ErrorLevel.Critical,
    })
    createdAt = new Date()
  }

  const { username: rawUsername } = identity.traits
  return {
    id: identity.id as UserId,
    phone: identity.traits.phone as PhoneNumber,
    email: identity.traits.email as EmailAddress,
    username: rawUsername !== undefined ? (rawUsername as IdentityUsername) : rawUsername,
    emailVerified: identity.verifiable_addresses?.[0].verified ?? false,
    totpEnabled: identity?.credentials?.totp?.type === "totp",
    schema: toSchema(identity.schema_id),
    createdAt,
  }
}
