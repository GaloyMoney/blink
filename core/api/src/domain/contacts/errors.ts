import { DomainError } from "@/domain/shared"

export class ContactError extends DomainError {}

export class InvalidContactIdError extends ContactError {}
export class InvalidIdentifierError extends ContactError {}
