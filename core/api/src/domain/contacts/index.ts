import { InvalidContactIdError, InvalidIdentifierError } from "./errors"

import { UuidRegex } from "@/domain/shared"

export * from "./primitives"

export const checkedToContactId = (
  contactId: string,
): ContactId | InvalidContactIdError => {
  if (contactId.match(UuidRegex)) {
    return contactId as ContactId
  }

  return new InvalidContactIdError(contactId)
}

export const checkedToIdentifier = (
  identifier: string,
): string | InvalidIdentifierError => {
  const trimmed = identifier.trim()

  if (
    typeof trimmed !== "string" ||
    trimmed.length === 0 ||
    trimmed.length > 256 ||
    /\s/.test(trimmed)
  ) {
    return new InvalidIdentifierError(identifier)
  }

  return trimmed
}
